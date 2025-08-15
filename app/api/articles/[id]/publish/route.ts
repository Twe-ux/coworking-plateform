/**
 * API endpoint pour publier/dépublier un article
 * POST /api/articles/[id]/publish - Publication/dépublication (admin/manager only)
 */

import { NextRequest } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Article from '@/lib/models/Article'
import {
  requireArticlePermission,
  createErrorResponse,
  createSuccessResponse,
  logBlogAction,
} from '@/lib/api/blog-auth'
import {
  validateRequestBody,
  PublishArticleSchema,
  isValidObjectId,
  type PublishArticleInput,
} from '@/lib/validation/blog'

/**
 * POST /api/articles/[id]/publish - Publier/dépublier un article
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
        'ID d\'article invalide',
        400,
        'INVALID_ID'
      )
    }

    await connectToDatabase()

    // Récupérer l'article existant
    const existingArticle = await Article.findById(id)
      .populate('author', 'firstName lastName email')
      .populate('category', 'name slug')

    if (!existingArticle) {
      return createErrorResponse(
        'Article non trouvé',
        404,
        'ARTICLE_NOT_FOUND'
      )
    }

    // Vérification des permissions de publication
    const authResult = await requireArticlePermission(request, 'publish')
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

    const validationResult = PublishArticleSchema.safeParse(body)
    if (!validationResult.success) {
      return createErrorResponse(
        'Données de publication invalides',
        400,
        'VALIDATION_ERROR',
        validationResult.error
      )
    }

    const publishData: PublishArticleInput = validationResult.data

    // Préparer les données de mise à jour
    const updateFields: any = {
      lastEditedBy: context.user.id,
    }

    let actionMessage = ''
    let logAction = ''

    switch (publishData.action) {
      case 'publish':
        // Vérifications avant publication
        if (!existingArticle.content || existingArticle.content.trim().length < 50) {
          return createErrorResponse(
            'L\'article doit avoir un contenu d\'au moins 50 caractères pour être publié',
            400,
            'INSUFFICIENT_CONTENT'
          )
        }

        if (!existingArticle.excerpt || existingArticle.excerpt.trim().length < 10) {
          return createErrorResponse(
            'L\'article doit avoir un extrait d\'au moins 10 caractères pour être publié',
            400,
            'INSUFFICIENT_EXCERPT'
          )
        }

        // Définir les champs de publication
        updateFields.status = 'published'
        
        if (publishData.scheduledPublishAt) {
          // Publication programmée
          if (publishData.scheduledPublishAt <= new Date()) {
            return createErrorResponse(
              'La date de publication programmée doit être dans le futur',
              400,
              'INVALID_SCHEDULE_DATE'
            )
          }
          
          updateFields.scheduledPublishAt = publishData.scheduledPublishAt
          actionMessage = 'Article programmé pour publication'
          logAction = 'SCHEDULE_ARTICLE'
        } else {
          // Publication immédiate
          updateFields.publishedAt = new Date()
          updateFields.scheduledPublishAt = null
          actionMessage = 'Article publié avec succès'
          logAction = 'PUBLISH_ARTICLE'
        }
        break

      case 'unpublish':
        if (existingArticle.status !== 'published') {
          return createErrorResponse(
            'Seuls les articles publiés peuvent être dépubliés',
            400,
            'NOT_PUBLISHED'
          )
        }

        updateFields.status = 'draft'
        updateFields.scheduledPublishAt = null
        // Note: on garde publishedAt pour l'historique
        actionMessage = 'Article dépublié avec succès'
        logAction = 'UNPUBLISH_ARTICLE'
        break

      default:
        return createErrorResponse(
          'Action de publication invalide',
          400,
          'INVALID_ACTION'
        )
    }

    // Mettre à jour l'article
    const updatedArticle = await Article.findByIdAndUpdate(
      id,
      updateFields,
      { 
        new: true,
        runValidators: true 
      }
    )
      .populate('author', 'firstName lastName email image')
      .populate('category', 'name slug color icon')
      .populate('lastEditedBy', 'firstName lastName email image')

    if (!updatedArticle) {
      return createErrorResponse(
        'Erreur lors de la mise à jour de l\'article',
        500,
        'UPDATE_FAILED'
      )
    }

    // Log de l'action
    await logBlogAction(
      context,
      logAction,
      'article',
      id,
      {
        title: updatedArticle.title,
        action: publishData.action,
        previousStatus: existingArticle.status,
        newStatus: updatedArticle.status,
        scheduledPublishAt: publishData.scheduledPublishAt,
        publishedBy: context.user.id,
      }
    )

    // Préparer les métadonnées de réponse
    const meta: any = {
      action: publishData.action,
      previousStatus: existingArticle.status,
      newStatus: updatedArticle.status,
    }

    if (publishData.scheduledPublishAt) {
      meta.scheduledPublishAt = publishData.scheduledPublishAt
    }

    if (updatedArticle.publishedAt) {
      meta.publishedAt = updatedArticle.publishedAt
    }

    return createSuccessResponse(
      updatedArticle,
      actionMessage,
      meta
    )

  } catch (error: any) {
    console.error('Erreur lors de la publication/dépublication:', error)

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
      'Erreur lors de la publication/dépublication',
      500,
      'DATABASE_ERROR',
      process.env.NODE_ENV === 'development' ? error.message : undefined
    )
  }
}