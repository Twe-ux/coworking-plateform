/**
 * API endpoint pour signaler un commentaire
 * POST /api/comments/[id]/report - Signaler un commentaire (utilisateurs authentifiés)
 */

import { NextRequest } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Comment from '@/lib/models/Comment'
import {
  requireAuth,
  createErrorResponse,
  createSuccessResponse,
  logBlogAction,
} from '@/lib/api/blog-auth'
import {
  validateRequestBody,
  ReportCommentSchema,
  isValidObjectId,
  type ReportCommentInput,
} from '@/lib/validation/blog'

/**
 * POST /api/comments/[id]/report - Signaler un commentaire
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Validation de l'ID
    if (!isValidObjectId(id)) {
      return createErrorResponse(
        'ID de commentaire invalide',
        400,
        'INVALID_ID'
      )
    }

    // Vérification de l'authentification
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return createErrorResponse(authResult.error, authResult.status)
    }

    const { context } = authResult

    await connectToDatabase()

    // Récupérer le commentaire existant
    const existingComment = await Comment.findById(id)
      .populate('article', 'title slug')

    if (!existingComment) {
      return createErrorResponse(
        'Commentaire non trouvé',
        404,
        'COMMENT_NOT_FOUND'
      )
    }

    // Vérifier que l'utilisateur ne signale pas son propre commentaire
    if (existingComment.author.toString() === context.user.id) {
      return createErrorResponse(
        'Vous ne pouvez pas signaler votre propre commentaire',
        400,
        'CANNOT_REPORT_OWN_COMMENT'
      )
    }

    // Vérifier si l'utilisateur a déjà signalé ce commentaire
    const existingReport = existingComment.reports.find(
      (report: any) => report.reportedBy.toString() === context.user.id
    )

    if (existingReport) {
      return createErrorResponse(
        'Vous avez déjà signalé ce commentaire',
        400,
        'ALREADY_REPORTED'
      )
    }

    // Validation du body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return createErrorResponse('Corps de requête JSON invalide', 400, 'INVALID_JSON')
    }

    const validationResult = validateRequestBody(ReportCommentSchema, body)
    if (!validationResult.success) {
      return createErrorResponse(
        'Données de signalement invalides',
        400,
        'VALIDATION_ERROR',
        validationResult.errors
      )
    }

    const reportData: ReportCommentInput = validationResult.data

    // Ajouter le signalement
    const newReport = {
      reportedBy: context.user.id,
      reason: reportData.reason,
      details: reportData.details,
      reportedAt: new Date(),
    }

    existingComment.reports.push(newReport)

    // Vérifier si le commentaire doit être automatiquement marqué comme spam
    const reportCount = existingComment.reports.length
    let autoModerated = false
    let previousStatus = existingComment.status

    if (reportCount >= 3 && existingComment.status !== 'spam') {
      existingComment.status = 'spam'
      existingComment.moderatedAt = new Date()
      existingComment.moderationNote = `Marqué automatiquement comme spam suite à ${reportCount} signalements`
      autoModerated = true
    }

    // Sauvegarder les modifications
    await existingComment.save()

    // Si le statut a changé automatiquement, mettre à jour les stats d'article
    if (autoModerated && previousStatus === 'approved') {
      const Article = require('@/lib/models/Article').default
      await Article.findByIdAndUpdate(
        existingComment.article._id,
        { $inc: { 'stats.comments': -1 } }
      )
    }

    // Populer les champs pour la réponse
    await existingComment.populate('reports.reportedBy', 'firstName lastName')

    // Log de l'action
    await logBlogAction(
      context,
      'REPORT_COMMENT',
      'comment',
      id,
      {
        reason: reportData.reason,
        details: reportData.details,
        articleId: existingComment.article._id.toString(),
        articleTitle: existingComment.article.title,
        reportCount,
        autoModerated,
        previousStatus,
        newStatus: existingComment.status,
      }
    )

    // Préparer la réponse
    const responseMessage = autoModerated
      ? 'Commentaire signalé et automatiquement marqué comme spam'
      : 'Commentaire signalé avec succès'

    const meta = {
      reportCount,
      autoModerated,
      requiresManualReview: !autoModerated && reportCount >= 2,
    }

    // Si le commentaire a été auto-modéré, l'inclure dans la réponse
    const responseData = autoModerated 
      ? existingComment.toObject()
      : {
          id: existingComment._id,
          reportCount,
          status: existingComment.status,
        }

    return createSuccessResponse(
      responseData,
      responseMessage,
      meta
    )

  } catch (error: any) {
    console.error('Erreur lors du signalement du commentaire:', error)

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message)
      return createErrorResponse(
        'Erreurs de validation',
        400,
        'MONGOOSE_VALIDATION_ERROR',
        errors
      )
    }

    return createErrorResponse(
      'Erreur lors du signalement du commentaire',
      500,
      'DATABASE_ERROR',
      process.env.NODE_ENV === 'development' ? error.message : undefined
    )
  }
}

/**
 * GET /api/comments/[id]/report - Obtenir les signalements d'un commentaire (modérateurs seulement)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Validation de l'ID
    if (!isValidObjectId(id)) {
      return createErrorResponse(
        'ID de commentaire invalide',
        400,
        'INVALID_ID'
      )
    }

    // Vérification de l'authentification et des permissions de modération
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return createErrorResponse(authResult.error, authResult.status)
    }

    const { context } = authResult
    
    // Importer la fonction de vérification des permissions de modération
    const { canModerateComments } = await import('@/lib/api/blog-auth')
    
    if (!canModerateComments(context.user.role)) {
      return createErrorResponse(
        'Permissions insuffisantes pour voir les signalements',
        403,
        'INSUFFICIENT_PERMISSIONS'
      )
    }

    await connectToDatabase()

    // Récupérer le commentaire avec ses signalements
    const comment = await Comment.findById(id)
      .select('content status reports createdAt article author')
      .populate('article', 'title slug')
      .populate('author', 'firstName lastName email')
      .populate('reports.reportedBy', 'firstName lastName email')

    if (!comment) {
      return createErrorResponse(
        'Commentaire non trouvé',
        404,
        'COMMENT_NOT_FOUND'
      )
    }

    // Analyser les signalements
    const reportStats = {
      total: comment.reports.length,
      byReason: {} as Record<string, number>,
      recent: comment.reports.filter((r: any) => 
        new Date().getTime() - new Date(r.reportedAt).getTime() < 24 * 60 * 60 * 1000
      ).length,
    }

    comment.reports.forEach((report: any) => {
      reportStats.byReason[report.reason] = (reportStats.byReason[report.reason] || 0) + 1
    })

    const responseData = {
      comment: {
        id: comment._id,
        content: comment.content.substring(0, 200) + (comment.content.length > 200 ? '...' : ''),
        status: comment.status,
        createdAt: comment.createdAt,
        article: comment.article,
        author: comment.author,
      },
      reports: comment.reports.sort((a: any, b: any) => 
        new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime()
      ),
      stats: reportStats,
      recommendations: {
        shouldAutoModerate: reportStats.total >= 3,
        riskLevel: reportStats.total >= 5 ? 'high' : reportStats.total >= 2 ? 'medium' : 'low',
        suggestedAction: reportStats.total >= 5 ? 'spam' : reportStats.total >= 3 ? 'reject' : 'review',
      }
    }

    return createSuccessResponse(
      responseData,
      'Signalements récupérés avec succès'
    )

  } catch (error: any) {
    console.error('Erreur lors de la récupération des signalements:', error)
    return createErrorResponse(
      'Erreur lors de la récupération des signalements',
      500,
      'DATABASE_ERROR',
      process.env.NODE_ENV === 'development' ? error.message : undefined
    )
  }
}