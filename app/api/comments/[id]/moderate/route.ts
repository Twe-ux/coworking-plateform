/**
 * API endpoint pour la modération des commentaires
 * PUT /api/comments/[id]/moderate - Modération (staff+)
 */

import { NextRequest } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Comment from '@/lib/models/Comment'
import Article from '@/lib/models/Article'
import {
  requireCommentPermission,
  createErrorResponse,
  createSuccessResponse,
  logBlogAction,
} from '@/lib/api/blog-auth'
import {
  validateRequestBody,
  ModerateCommentSchema,
  isValidObjectId,
  type ModerateCommentInput,
} from '@/lib/validation/blog'

/**
 * PUT /api/comments/[id]/moderate - Modérer un commentaire (approuver/rejeter/spam)
 */
export async function PUT(
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

    await connectToDatabase()

    // Récupérer le commentaire existant
    const existingComment = await Comment.findById(id)
      .populate('article', 'title slug')
      .populate('author', 'firstName lastName email')

    if (!existingComment) {
      return createErrorResponse(
        'Commentaire non trouvé',
        404,
        'COMMENT_NOT_FOUND'
      )
    }

    // Vérification des permissions de modération
    const authResult = await requireCommentPermission(request, 'moderate')
    if (!authResult.success) {
      return createErrorResponse(authResult.error, authResult.status)
    }

    const { context } = authResult

    // Validation du body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return createErrorResponse('Corps de requête JSON invalide', 400, 'INVALID_JSON')
    }

    const validationResult = validateRequestBody(ModerateCommentSchema, body)
    if (!validationResult.success) {
      return createErrorResponse(
        'Données de modération invalides',
        400,
        'VALIDATION_ERROR',
        validationResult.errors
      )
    }

    const moderationData: ModerateCommentInput = validationResult.data

    // Vérifier si une action est nécessaire
    if (existingComment.status === moderationData.action) {
      return createErrorResponse(
        `Le commentaire est déjà ${moderationData.action}`,
        400,
        'NO_ACTION_NEEDED'
      )
    }

    // Préparer les données de mise à jour
    const updateFields: any = {
      status: moderationData.action,
      moderatedBy: context.user.id,
      moderatedAt: new Date(),
      moderationNote: moderationData.note || null,
    }

    // Déterminer le nouveau statut selon l'action
    let newStatus: string
    switch (moderationData.action) {
      case 'approve':
        newStatus = 'approved'
        break
      case 'reject':
        newStatus = 'rejected'
        break
      case 'spam':
        newStatus = 'spam'
        break
      default:
        return createErrorResponse(
          'Action de modération invalide',
          400,
          'INVALID_MODERATION_ACTION'
        )
    }

    updateFields.status = newStatus

    // Mettre à jour le commentaire
    const updatedComment = await Comment.findByIdAndUpdate(
      id,
      updateFields,
      { 
        new: true,
        runValidators: true 
      }
    )
      .populate('author', 'firstName lastName email image')
      .populate('article', 'title slug')
      .populate('parentComment', 'content author')
      .populate('moderatedBy', 'firstName lastName email image')

    if (!updatedComment) {
      return createErrorResponse(
        'Erreur lors de la modération',
        500,
        'MODERATION_FAILED'
      )
    }

    // Mettre à jour les statistiques de l'article
    const previousStatus = existingComment.status
    const currentStatus = newStatus

    let articleStatChange = 0

    // Calculer le changement pour les statistiques d'article
    if (previousStatus === 'approved' && currentStatus !== 'approved') {
      articleStatChange = -1 // Retirer des stats
    } else if (previousStatus !== 'approved' && currentStatus === 'approved') {
      articleStatChange = 1 // Ajouter aux stats
    }

    if (articleStatChange !== 0) {
      await Article.findByIdAndUpdate(
        existingComment.article._id,
        { $inc: { 'stats.comments': articleStatChange } }
      )
    }

    // Si c'est du spam, marquer automatiquement les autres commentaires du même auteur/email comme suspects
    if (newStatus === 'spam') {
      const suspiciousComments = await Comment.find({
        $or: [
          { author: existingComment.author },
          { authorEmail: existingComment.authorEmail }
        ],
        status: { $in: ['pending', 'approved'] },
        _id: { $ne: id }
      }).limit(10) // Limiter pour éviter les opérations massives

      if (suspiciousComments.length > 0) {
        await Comment.updateMany(
          {
            _id: { $in: suspiciousComments.map(c => c._id) }
          },
          {
            $push: {
              reports: {
                reportedBy: context.user.id,
                reason: 'spam',
                reportedAt: new Date()
              }
            }
          }
        )
      }
    }

    // Traiter les commentaires enfants si nécessaire
    let childrenUpdated = 0
    if (newStatus === 'spam' || newStatus === 'rejected') {
      // Si le commentaire parent est rejeté/spam, traiter aussi les réponses
      const childComments = await Comment.find({ parentComment: id })
      
      if (childComments.length > 0) {
        await Comment.updateMany(
          { parentComment: id },
          {
            status: newStatus,
            moderatedBy: context.user.id,
            moderatedAt: new Date(),
            moderationNote: `Modéré automatiquement suite à la modération du commentaire parent`
          }
        )
        
        childrenUpdated = childComments.length

        // Mettre à jour les stats pour les commentaires enfants
        const approvedChildren = childComments.filter(c => c.status === 'approved').length
        if (approvedChildren > 0) {
          await Article.findByIdAndUpdate(
            existingComment.article._id,
            { $inc: { 'stats.comments': -approvedChildren } }
          )
        }
      }
    }

    // Log de l'action
    await logBlogAction(
      context,
      'MODERATE_COMMENT',
      'comment',
      id,
      {
        action: moderationData.action,
        previousStatus,
        newStatus,
        articleId: existingComment.article._id.toString(),
        articleTitle: existingComment.article.title,
        authorEmail: existingComment.authorEmail,
        note: moderationData.note,
        childrenAffected: childrenUpdated,
        articleStatChange,
      }
    )

    // Préparer le message de réponse
    const actionMessages: Record<string, string> = {
      approved: 'approuvé',
      rejected: 'rejeté',
      spam: 'marqué comme spam'
    }

    let responseMessage = `Commentaire ${actionMessages[newStatus]} avec succès`
    if (childrenUpdated > 0) {
      responseMessage += ` (${childrenUpdated} réponse(s) également affectée(s))`
    }

    return createSuccessResponse(
      updatedComment,
      responseMessage,
      {
        action: moderationData.action,
        previousStatus,
        newStatus,
        childrenUpdated,
        articleStatChange,
        moderatedBy: context.user.id,
        moderatedAt: updateFields.moderatedAt,
      }
    )

  } catch (error: any) {
    console.error('Erreur lors de la modération du commentaire:', error)

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
      'Erreur lors de la modération du commentaire',
      500,
      'DATABASE_ERROR',
      process.env.NODE_ENV === 'development' ? error.message : undefined
    )
  }
}

/**
 * GET /api/comments/[id]/moderate - Obtenir les informations de modération d'un commentaire
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

    // Vérification des permissions de modération
    const authResult = await requireCommentPermission(request, 'moderate')
    if (!authResult.success) {
      return createErrorResponse(authResult.error, authResult.status)
    }

    await connectToDatabase()

    // Récupérer le commentaire avec toutes les informations de modération
    const comment = await Comment.findById(id)
      .populate('author', 'firstName lastName email image')
      .populate('article', 'title slug')
      .populate('parentComment', 'content author')
      .populate('moderatedBy', 'firstName lastName email image')
      .populate('reports.reportedBy', 'firstName lastName email')

    if (!comment) {
      return createErrorResponse(
        'Commentaire non trouvé',
        404,
        'COMMENT_NOT_FOUND'
      )
    }

    // Récupérer les réponses pour contexte
    const replies = await Comment.find({ parentComment: id })
      .select('content status author createdAt')
      .populate('author', 'firstName lastName')
      .sort({ createdAt: 1 })

    // Récupérer l'historique des commentaires de cet auteur
    const authorCommentHistory = await Comment.find({
      $or: [
        { author: comment.author },
        { authorEmail: comment.authorEmail }
      ]
    })
      .select('status createdAt article')
      .populate('article', 'title')
      .sort({ createdAt: -1 })
      .limit(10)

    // Calculer des statistiques sur l'auteur
    const authorStats = {
      totalComments: authorCommentHistory.length,
      approved: authorCommentHistory.filter(c => c.status === 'approved').length,
      pending: authorCommentHistory.filter(c => c.status === 'pending').length,
      rejected: authorCommentHistory.filter(c => c.status === 'rejected').length,
      spam: authorCommentHistory.filter(c => c.status === 'spam').length,
    }

    const responseData = {
      comment: comment.toObject(),
      replies,
      authorCommentHistory,
      authorStats,
      moderationSuggestion: {
        riskLevel: calculateRiskLevel(comment, authorStats),
        reasons: generateModerationReasons(comment, authorStats),
      }
    }

    return createSuccessResponse(
      responseData,
      'Informations de modération récupérées avec succès'
    )

  } catch (error: any) {
    console.error('Erreur lors de la récupération des informations de modération:', error)
    return createErrorResponse(
      'Erreur lors de la récupération des informations de modération',
      500,
      'DATABASE_ERROR',
      process.env.NODE_ENV === 'development' ? error.message : undefined
    )
  }
}

/**
 * Calcule le niveau de risque d'un commentaire
 */
function calculateRiskLevel(comment: any, authorStats: any): 'low' | 'medium' | 'high' {
  let riskScore = 0

  // Facteurs de risque
  if (comment.reports && comment.reports.length > 0) {
    riskScore += comment.reports.length * 2
  }

  if (authorStats.spam > 0) {
    riskScore += authorStats.spam * 3
  }

  if (authorStats.rejected > 0) {
    riskScore += authorStats.rejected * 2
  }

  const spamRatio = authorStats.totalComments > 0 
    ? (authorStats.spam + authorStats.rejected) / authorStats.totalComments 
    : 0

  if (spamRatio > 0.5) {
    riskScore += 5
  } else if (spamRatio > 0.2) {
    riskScore += 2
  }

  // Facteurs de contenu
  if (comment.metadata.links && comment.metadata.links.length > 2) {
    riskScore += 2
  }

  if (comment.content.length < 10) {
    riskScore += 1
  }

  // Classification
  if (riskScore >= 8) return 'high'
  if (riskScore >= 4) return 'medium'
  return 'low'
}

/**
 * Génère des raisons suggérées pour la modération
 */
function generateModerationReasons(comment: any, authorStats: any): string[] {
  const reasons: string[] = []

  if (comment.reports && comment.reports.length > 0) {
    reasons.push(`Signalé ${comment.reports.length} fois`)
  }

  if (authorStats.spam > 0) {
    reasons.push(`Auteur a ${authorStats.spam} commentaire(s) marqué(s) comme spam`)
  }

  if (authorStats.rejected > 0) {
    reasons.push(`Auteur a ${authorStats.rejected} commentaire(s) rejeté(s)`)
  }

  const spamRatio = authorStats.totalComments > 0 
    ? (authorStats.spam + authorStats.rejected) / authorStats.totalComments 
    : 0

  if (spamRatio > 0.5) {
    reasons.push('Taux élevé de commentaires rejetés/spam pour cet auteur')
  }

  if (comment.metadata.links && comment.metadata.links.length > 2) {
    reasons.push('Contient plusieurs liens')
  }

  if (comment.content.length < 10) {
    reasons.push('Commentaire très court')
  }

  if (!comment.isVerified) {
    reasons.push('Email non vérifié')
  }

  return reasons
}