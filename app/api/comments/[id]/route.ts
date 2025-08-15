/**
 * API endpoints pour un commentaire spécifique
 * GET /api/comments/[id] - Récupérer un commentaire
 * PUT /api/comments/[id] - Modifier un commentaire
 * DELETE /api/comments/[id] - Supprimer un commentaire
 */

import { NextRequest } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Comment from '@/lib/models/Comment'
import Article from '@/lib/models/Article'
import {
  requireCommentPermission,
  createErrorResponse,
  createSuccessResponse,
  logBlogAction,
  canModerateComments,
} from '@/lib/api/blog-auth'
import {
  validateRequestBody,
  UpdateCommentSchema,
  isValidObjectId,
  type UpdateCommentInput,
} from '@/lib/validation/blog'

/**
 * GET /api/comments/[id] - Récupérer un commentaire par ID
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

    await dbConnect()

    // Récupérer le commentaire
    const comment = await Comment.findById(id)
      .populate('author', 'firstName lastName email image')
      .populate('article', 'title slug allowComments')
      .populate('parentComment', 'content author')
      .populate('moderatedBy', 'firstName lastName email')

    if (!comment) {
      return createErrorResponse(
        'Commentaire non trouvé',
        404,
        'COMMENT_NOT_FOUND'
      )
    }

    // Récupérer les réponses à ce commentaire
    const replies = await Comment.find({
      parentComment: id,
      status: 'approved',
    })
      .populate('author', 'firstName lastName image')
      .sort({ createdAt: 1 })
      .lean()

    const responseData = {
      ...comment.toObject(),
      replies: replies || [],
      replyCount: replies?.length || 0,
    }

    return createSuccessResponse(
      responseData,
      'Commentaire récupéré avec succès'
    )

  } catch (error: any) {
    console.error('Erreur lors de la récupération du commentaire:', error)
    return createErrorResponse(
      'Erreur lors de la récupération du commentaire',
      500,
      'DATABASE_ERROR',
      process.env.NODE_ENV === 'development' ? error.message : undefined
    )
  }
}

/**
 * PUT /api/comments/[id] - Modifier un commentaire
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

    await dbConnect()

    // Récupérer le commentaire existant
    const existingComment = await Comment.findById(id)
      .populate('article', 'title allowComments')
    
    if (!existingComment) {
      return createErrorResponse(
        'Commentaire non trouvé',
        404,
        'COMMENT_NOT_FOUND'
      )
    }

    // Vérification des permissions
    const authResult = await requireCommentPermission(
      request,
      'edit',
      existingComment.author.toString()
    )
    if (!authResult.success) {
      return createErrorResponse(authResult.error, authResult.status)
    }

    const { context } = authResult

    // Vérifier si l'article autorise encore les commentaires
    if (!existingComment.article.allowComments && !canModerateComments(context.user.role)) {
      return createErrorResponse(
        'Les commentaires sont désactivés pour cet article',
        403,
        'COMMENTS_DISABLED'
      )
    }

    // Validation du body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return createErrorResponse('Corps de requête JSON invalide', 400, 'INVALID_JSON')
    }

    const validationResult = validateRequestBody(UpdateCommentSchema, body)
    if (!validationResult.success) {
      return createErrorResponse(
        'Données de commentaire invalides',
        400,
        'VALIDATION_ERROR',
        validationResult.errors
      )
    }

    const updateData: UpdateCommentInput = validationResult.data

    // Vérifier si le contenu a vraiment changé
    if (updateData.content === existingComment.content) {
      return createErrorResponse(
        'Aucune modification détectée',
        400,
        'NO_CHANGES'
      )
    }

    // Préparer les données de mise à jour
    const updateFields: any = {
      content: updateData.content,
      isEdited: true,
      editedAt: new Date(),
    }

    // Sauvegarder le contenu original si c'est la première édition
    if (!existingComment.isEdited) {
      updateFields.originalContent = existingComment.content
    }

    // Si ce n'est pas un modérateur qui modifie, repasser en pending
    if (!canModerateComments(context.user.role) && 
        existingComment.author.toString() === context.user.id) {
      updateFields.status = 'pending'
      updateFields.moderatedBy = null
      updateFields.moderatedAt = null
      updateFields.moderationNote = null
    }

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
      .populate('moderatedBy', 'firstName lastName email')

    if (!updatedComment) {
      return createErrorResponse(
        'Erreur lors de la mise à jour',
        500,
        'UPDATE_FAILED'
      )
    }

    // Mettre à jour les statistiques de l'article si le statut change
    if (updateFields.status === 'pending' && existingComment.status === 'approved') {
      await Article.findByIdAndUpdate(
        existingComment.article._id,
        { $inc: { 'stats.comments': -1 } }
      )
    }

    // Log de l'action
    await logBlogAction(
      context,
      'UPDATE_COMMENT',
      'comment',
      id,
      {
        articleId: existingComment.article._id.toString(),
        articleTitle: existingComment.article.title,
        contentChanged: true,
        statusChange: updateFields.status !== existingComment.status,
        previousStatus: existingComment.status,
        newStatus: updateFields.status || existingComment.status,
      }
    )

    const responseMessage = updateFields.status === 'pending' 
      ? 'Commentaire modifié et soumis pour re-modération'
      : 'Commentaire modifié avec succès'

    return createSuccessResponse(
      updatedComment,
      responseMessage,
      { 
        requiresModeration: updateFields.status === 'pending',
        wasEdited: true
      }
    )

  } catch (error: any) {
    console.error('Erreur lors de la modification du commentaire:', error)

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
      'Erreur lors de la modification du commentaire',
      500,
      'DATABASE_ERROR',
      process.env.NODE_ENV === 'development' ? error.message : undefined
    )
  }
}

/**
 * DELETE /api/comments/[id] - Supprimer un commentaire
 */
export async function DELETE(
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

    await dbConnect()

    // Récupérer le commentaire existant
    const existingComment = await Comment.findById(id)
      .populate('article', 'title')
    
    if (!existingComment) {
      return createErrorResponse(
        'Commentaire non trouvé',
        404,
        'COMMENT_NOT_FOUND'
      )
    }

    // Vérification des permissions
    const authResult = await requireCommentPermission(
      request,
      'delete',
      existingComment.author.toString()
    )
    if (!authResult.success) {
      return createErrorResponse(authResult.error, authResult.status)
    }

    const { context } = authResult

    // Compter les réponses à ce commentaire
    const repliesCount = await Comment.countDocuments({ 
      parentComment: id 
    })

    // Récupérer des informations pour les logs avant suppression
    const commentInfo = {
      content: existingComment.content.substring(0, 100) + (existingComment.content.length > 100 ? '...' : ''),
      status: existingComment.status,
      articleId: existingComment.article._id.toString(),
      articleTitle: existingComment.article.title,
      repliesCount,
    }

    // Supprimer le commentaire et toutes ses réponses
    await Comment.deleteMany({
      $or: [
        { _id: id },
        { parentComment: id }
      ]
    })

    // Mettre à jour les statistiques de l'article
    const totalDeleted = 1 + repliesCount
    if (existingComment.status === 'approved') {
      await Article.findByIdAndUpdate(
        existingComment.article._id,
        { $inc: { 'stats.comments': -totalDeleted } }
      )
    }

    // Log de l'action
    await logBlogAction(
      context,
      'DELETE_COMMENT',
      'comment',
      id,
      {
        ...commentInfo,
        totalDeleted,
      }
    )

    return createSuccessResponse(
      { 
        deletedComment: id,
        deletedReplies: repliesCount,
        totalDeleted,
        ...commentInfo
      },
      `Commentaire et ${repliesCount} réponse(s) supprimé(s) avec succès`
    )

  } catch (error: any) {
    console.error('Erreur lors de la suppression du commentaire:', error)
    return createErrorResponse(
      'Erreur lors de la suppression du commentaire',
      500,
      'DATABASE_ERROR',
      process.env.NODE_ENV === 'development' ? error.message : undefined
    )
  }
}