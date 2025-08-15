/**
 * API endpoints pour un article spécifique
 * GET /api/articles/[id] - Récupérer un article
 * PUT /api/articles/[id] - Modifier un article
 * DELETE /api/articles/[id] - Supprimer un article
 */

import { NextRequest } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Article from '@/lib/models/Article'
import Category from '@/lib/models/Category'
import Comment from '@/lib/models/Comment'
import {
  requireAuth,
  requireArticlePermission,
  createErrorResponse,
  createSuccessResponse,
  logBlogAction,
  checkResourceOwnership,
} from '@/lib/api/blog-auth'
import {
  validateRequestBody,
  UpdateArticleSchema,
  generateSlug,
  isValidObjectId,
  type UpdateArticleInput,
} from '@/lib/validation/blog'
import { ObjectId } from 'mongodb'

/**
 * GET /api/articles/[id] - Récupérer un article par ID ou slug
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    await dbConnect()

    // Récupérer l'article par ID ou slug
    let article
    if (isValidObjectId(id)) {
      article = await Article.findById(id)
        .populate('author', 'firstName lastName email image bio')
        .populate('category', 'name slug color icon description')
        .populate('lastEditedBy', 'firstName lastName email image')
    } else {
      // Rechercher par slug
      article = await Article.findOne({ slug: id })
        .populate('author', 'firstName lastName email image bio')
        .populate('category', 'name slug color icon description')
        .populate('lastEditedBy', 'firstName lastName email image')
    }

    if (!article) {
      return createErrorResponse(
        'Article non trouvé',
        404,
        'ARTICLE_NOT_FOUND'
      )
    }

    // Vérifier les permissions pour les brouillons
    if (article.status !== 'published') {
      const authResult = await requireArticlePermission(
        request,
        'view_draft',
        article.author._id.toString()
      )
      
      if (!authResult.success) {
        return createErrorResponse(authResult.error, authResult.status)
      }
    } else {
      // Pour les articles publiés, incrémenter les vues
      await Article.findByIdAndUpdate(
        article._id,
        { 
          $inc: { 'stats.views': 1 },
          $set: { 'stats.lastViewed': new Date() }
        }
      )
    }

    // Récupérer les articles associés (même catégorie)
    const relatedArticles = await Article.find({
      category: article.category._id,
      status: 'published',
      _id: { $ne: article._id },
    })
      .select('title slug excerpt coverImage publishedAt stats.views')
      .populate('author', 'firstName lastName')
      .sort({ publishedAt: -1 })
      .limit(5)
      .lean()

    // Récupérer les articles de navigation (précédent/suivant)
    const publishedDate = article.publishedAt || article.createdAt
    
    // Article précédent (plus ancien)
    const prevArticle = await Article.findOne({
      status: 'published',
      $or: [
        { publishedAt: { $lt: publishedDate } },
        { 
          publishedAt: publishedDate,
          _id: { $lt: article._id }
        }
      ]
    })
      .select('title slug coverImage')
      .sort({ publishedAt: -1, _id: -1 })
      .lean() as { _id: ObjectId; title: string; slug: string; coverImage?: string } | null

    // Article suivant (plus récent)
    const nextArticle = await Article.findOne({
      status: 'published',
      $or: [
        { publishedAt: { $gt: publishedDate } },
        { 
          publishedAt: publishedDate,
          _id: { $gt: article._id }
        }
      ]
    })
      .select('title slug coverImage')
      .sort({ publishedAt: 1, _id: 1 })
      .lean() as { _id: ObjectId; title: string; slug: string; coverImage?: string } | null

    const responseData = {
      ...article.toObject(),
      relatedArticles,
      navigation: {
        prev: prevArticle ? {
          _id: prevArticle._id.toString(),
          title: prevArticle.title,
          slug: prevArticle.slug,
          coverImage: prevArticle.coverImage
        } : undefined,
        next: nextArticle ? {
          _id: nextArticle._id.toString(),
          title: nextArticle.title,
          slug: nextArticle.slug,
          coverImage: nextArticle.coverImage
        } : undefined
      }
    }

    return createSuccessResponse(
      responseData,
      'Article récupéré avec succès'
    )

  } catch (error: any) {
    console.error('Erreur lors de la récupération de l\'article:', error)
    return createErrorResponse(
      'Erreur lors de la récupération de l\'article',
      500,
      'DATABASE_ERROR',
      process.env.NODE_ENV === 'development' ? error.message : undefined
    )
  }
}

/**
 * PUT /api/articles/[id] - Modifier un article
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
        'ID d\'article invalide',
        400,
        'INVALID_ID'
      )
    }

    await dbConnect()

    // Récupérer l'article existant
    const existingArticle = await Article.findById(id)
    if (!existingArticle) {
      return createErrorResponse(
        'Article non trouvé',
        404,
        'ARTICLE_NOT_FOUND'
      )
    }

    // Vérification des permissions
    const authResult = await requireArticlePermission(
      request,
      'edit',
      existingArticle.author.toString()
    )
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

    const validationResult = UpdateArticleSchema.safeParse(body)
    if (!validationResult.success) {
      return createErrorResponse(
        'Données d\'article invalides',
        400,
        'VALIDATION_ERROR',
        validationResult.error
      )
    }

    const updateData: UpdateArticleInput = validationResult.data

    // Vérifier la catégorie si elle est modifiée
    if (updateData.categoryId) {
      const category = await Category.findById(updateData.categoryId)
      if (!category) {
        return createErrorResponse(
          'Catégorie non trouvée',
          404,
          'CATEGORY_NOT_FOUND'
        )
      }

      if (!category.isActive) {
        return createErrorResponse(
          'La catégorie est désactivée',
          400,
          'CATEGORY_INACTIVE'
        )
      }
    }

    // Gérer le slug si le titre change
    let slug = existingArticle.slug
    if (updateData.title && updateData.title !== existingArticle.title) {
      if (updateData.slug) {
        slug = updateData.slug
      } else {
        slug = generateSlug(updateData.title)
      }

      // Vérifier l'unicité du nouveau slug (sauf pour l'article actuel)
      const existingSlug = await Article.findOne({ 
        slug, 
        _id: { $ne: id } 
      })
      
      if (existingSlug) {
        let counter = 1
        let uniqueSlug = `${slug}-${counter}`
        
        while (await Article.findOne({ 
          slug: uniqueSlug,
          _id: { $ne: id }
        })) {
          counter++
          uniqueSlug = `${slug}-${counter}`
        }
        
        slug = uniqueSlug
      }
    }

    // Préparer les données de mise à jour
    const updateFields: any = {
      ...updateData,
      slug,
      lastEditedBy: new ObjectId(context.user.id),
      version: existingArticle.version + 1,
    }

    // Convertir categoryId en ObjectId si présent
    if (updateData.categoryId) {
      updateFields.category = new ObjectId(updateData.categoryId)
      delete updateFields.categoryId
    }

    // Gérer le changement de statut
    if (updateData.status && updateData.status !== existingArticle.status) {
      switch (updateData.status) {
        case 'published':
          if (!existingArticle.publishedAt) {
            updateFields.publishedAt = updateData.scheduledPublishAt || new Date()
          }
          break
        case 'archived':
          updateFields.archivedAt = new Date()
          break
      }
    }

    // Créer une révision si le contenu change
    let shouldCreateRevision = false
    if (updateData.content && updateData.content !== existingArticle.content) {
      shouldCreateRevision = true
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
        'Erreur lors de la mise à jour',
        500,
        'UPDATE_FAILED'
      )
    }

    // Créer une révision si nécessaire
    if (shouldCreateRevision) {
      await updatedArticle.createRevision(
        existingArticle.content,
        new ObjectId(context.user.id),
        'Mise à jour automatique'
      )
    }

    // Mettre à jour les statistiques de catégorie si changement
    if (updateData.categoryId && updateData.categoryId !== existingArticle.category.toString()) {
      // Décrémenter l'ancienne catégorie
      await Category.findByIdAndUpdate(
        existingArticle.category,
        { $inc: { 'stats.articleCount': -1 } }
      )
      
      // Incrémenter la nouvelle catégorie
      await Category.findByIdAndUpdate(
        updateData.categoryId,
        { 
          $inc: { 'stats.articleCount': 1 },
          $set: { 'stats.lastArticleAt': new Date() }
        }
      )
    }

    // Log de l'action
    await logBlogAction(
      context,
      'UPDATE_ARTICLE',
      'article',
      id,
      {
        title: updatedArticle.title,
        changes: Object.keys(updateData),
        previousVersion: existingArticle.version,
        newVersion: updatedArticle.version,
      }
    )

    return createSuccessResponse(
      updatedArticle,
      'Article mis à jour avec succès'
    )

  } catch (error: any) {
    console.error('Erreur lors de la mise à jour de l\'article:', error)

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message)
      return createErrorResponse(
        'Erreurs de validation',
        400,
        'MONGOOSE_VALIDATION_ERROR',
        errors
      )
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'champ'
      return createErrorResponse(
        `${field} doit être unique`,
        409,
        'DUPLICATE_ERROR',
        { field, value: error.keyValue?.[field] }
      )
    }

    return createErrorResponse(
      'Erreur lors de la mise à jour de l\'article',
      500,
      'DATABASE_ERROR',
      process.env.NODE_ENV === 'development' ? error.message : undefined
    )
  }
}

/**
 * DELETE /api/articles/[id] - Supprimer un article
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
        'ID d\'article invalide',
        400,
        'INVALID_ID'
      )
    }

    await dbConnect()

    // Récupérer l'article existant
    const existingArticle = await Article.findById(id)
    if (!existingArticle) {
      return createErrorResponse(
        'Article non trouvé',
        404,
        'ARTICLE_NOT_FOUND'
      )
    }

    // Vérification des permissions
    const authResult = await requireArticlePermission(
      request,
      'delete',
      existingArticle.author.toString()
    )
    if (!authResult.success) {
      return createErrorResponse(authResult.error, authResult.status)
    }

    const { context } = authResult

    // Supprimer tous les commentaires associés
    const deletedComments = await Comment.deleteMany({ article: id })

    // Mettre à jour les statistiques de la catégorie
    await Category.findByIdAndUpdate(
      existingArticle.category,
      { $inc: { 'stats.articleCount': -1 } }
    )

    // Supprimer l'article
    await Article.findByIdAndDelete(id)

    // Log de l'action
    await logBlogAction(
      context,
      'DELETE_ARTICLE',
      'article',
      id,
      {
        title: existingArticle.title,
        status: existingArticle.status,
        deletedComments: deletedComments.deletedCount,
      }
    )

    return createSuccessResponse(
      { 
        deletedArticle: id,
        deletedComments: deletedComments.deletedCount 
      },
      'Article supprimé avec succès'
    )

  } catch (error: any) {
    console.error('Erreur lors de la suppression de l\'article:', error)
    return createErrorResponse(
      'Erreur lors de la suppression de l\'article',
      500,
      'DATABASE_ERROR',
      process.env.NODE_ENV === 'development' ? error.message : undefined
    )
  }
}