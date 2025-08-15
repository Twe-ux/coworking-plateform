/**
 * API endpoints CRUD pour les Comments
 * GET /api/comments - Liste des commentaires avec filtres (staff+)
 * POST /api/comments - Nouveau commentaire (authentifié)
 */

import { NextRequest } from 'next/server'
import dbConnect from '@/lib/mongodb'
import { Comment, Article } from '@/lib/models'
import {
  requireAuth,
  requireCommentPermission,
  createErrorResponse,
  createSuccessResponse,
  logBlogAction,
  canModerateComments,
} from '@/lib/api/blog-auth'
import {
  validateRequestBody,
  PaginationSchema,
  CommentFiltersSchema,
  CreateCommentSchema,
  type PaginationParams,
  type CommentFilters,
  type CreateCommentInput,
} from '@/lib/validation/blog'
import { getRealIP } from '@/lib/auth-utils'
import { ObjectId } from 'mongodb'

/**
 * GET /api/comments - Liste des commentaires avec filtres (modération)
 */
export async function GET(request: NextRequest) {
  try {
    // Authentification requise pour voir la liste complète des commentaires
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return createErrorResponse(authResult.error, authResult.status)
    }

    const { context } = authResult

    // Seuls les modérateurs peuvent voir tous les commentaires
    if (!canModerateComments(context.user.role)) {
      return createErrorResponse(
        'Permissions insuffisantes pour voir la liste des commentaires',
        403,
        'INSUFFICIENT_PERMISSIONS'
      )
    }

    await dbConnect()

    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())

    // Validation des paramètres de pagination
    const paginationResult = PaginationSchema.safeParse({
      page: queryParams.page || '1',
      limit: queryParams.limit || '20',
      sortBy: queryParams.sortBy,
      sortOrder: queryParams.sortOrder || 'desc'
    })
    if (!paginationResult.success) {
      return createErrorResponse(
        'Paramètres de pagination invalides',
        400,
        'INVALID_PAGINATION',
        paginationResult.error
      )
    }

    // Validation des filtres
    const filtersResult = CommentFiltersSchema.safeParse(queryParams)
    if (!filtersResult.success) {
      return createErrorResponse(
        'Filtres invalides',
        400,
        'INVALID_FILTERS',
        filtersResult.error
      )
    }

    const pagination: PaginationParams = paginationResult.data
    const filters: CommentFilters = filtersResult.data

    // Construction de la requête MongoDB
    const query: any = {}

    // Filtres de base
    if (filters.status) {
      query.status = filters.status
    }

    if (filters.articleId) {
      query.article = new ObjectId(filters.articleId)
    }

    if (filters.authorId) {
      query.author = new ObjectId(filters.authorId)
    }

    if (filters.authorEmail) {
      query.authorEmail = filters.authorEmail
    }

    if (filters.parentCommentId) {
      query.parentComment = new ObjectId(filters.parentCommentId)
    } else if (queryParams.topLevel === 'true') {
      // Seulement les commentaires de niveau supérieur
      query.parentComment = { $exists: false }
    }

    // Filtres de dates
    if (filters.startDate || filters.endDate) {
      query.createdAt = {}
      if (filters.startDate) {
        query.createdAt.$gte = filters.startDate
      }
      if (filters.endDate) {
        query.createdAt.$lte = filters.endDate
      }
    }

    // Recherche textuelle
    if (filters.search) {
      query.$text = { $search: filters.search }
    }

    // Calculs pour la pagination
    const page = pagination.page
    const limit = pagination.limit
    const skip = (page - 1) * limit

    // Tri
    const sortField = pagination.sortBy || 'createdAt'
    const sortOrder = pagination.sortOrder === 'asc' ? 1 : -1
    const sort: any = { [sortField]: sortOrder }

    // Si recherche textuelle, trier par score
    if (filters.search) {
      sort.score = { $meta: 'textScore' }
    }

    // Exécution de la requête
    const [comments, total] = await Promise.all([
      Comment.find(query)
        .populate('author', 'firstName lastName email image')
        .populate('article', 'title slug')
        .populate('parentComment', 'content author')
        .populate('moderatedBy', 'firstName lastName email')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Comment.countDocuments(query),
    ])

    // Métadonnées de pagination
    const totalPages = Math.ceil(total / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1

    // Statistiques générales
    const statsQuery = Comment.aggregate([
      { $match: filters.articleId ? { article: new ObjectId(filters.articleId) } : {} },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ])

    const stats = await statsQuery
    const statsMap = stats.reduce((acc: any, stat: any) => {
      acc[stat._id] = stat.count
      return acc
    }, {})

    const meta = {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev,
      filters: filters,
      stats: {
        approved: statsMap.approved || 0,
        pending: statsMap.pending || 0,
        rejected: statsMap.rejected || 0,
        spam: statsMap.spam || 0,
        total: Object.values(statsMap).reduce((sum: number, count: any) => sum + count, 0),
      },
    }

    return createSuccessResponse(comments, 'Commentaires récupérés avec succès', meta)

  } catch (error: any) {
    console.error('Erreur lors de la récupération des commentaires:', error)
    return createErrorResponse(
      'Erreur lors de la récupération des commentaires',
      500,
      'DATABASE_ERROR',
      process.env.NODE_ENV === 'development' ? error.message : undefined
    )
  }
}

/**
 * POST /api/comments - Nouveau commentaire (authentifié)
 */
export async function POST(request: NextRequest) {
  try {
    // Vérification des permissions
    const authResult = await requireCommentPermission(request, 'create')
    if (!authResult.success) {
      return createErrorResponse(authResult.error, authResult.status)
    }

    const { context } = authResult

    await dbConnect()

    // Validation du body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return createErrorResponse('Corps de requête JSON invalide', 400, 'INVALID_JSON')
    }

    const validationResult = validateRequestBody(CreateCommentSchema, body)
    if (!validationResult.success) {
      return createErrorResponse(
        'Données de commentaire invalides',
        400,
        'VALIDATION_ERROR',
        validationResult.errors
      )
    }

    const commentData: CreateCommentInput = validationResult.data

    // Vérifier que l'article existe et autorise les commentaires
    const article = await Article.findById(commentData.articleId)
    if (!article) {
      return createErrorResponse(
        'Article non trouvé',
        404,
        'ARTICLE_NOT_FOUND'
      )
    }

    if (article.status !== 'published') {
      return createErrorResponse(
        'Les commentaires ne sont autorisés que sur les articles publiés',
        400,
        'ARTICLE_NOT_PUBLISHED'
      )
    }

    if (!article.allowComments) {
      return createErrorResponse(
        'Les commentaires sont désactivés pour cet article',
        403,
        'COMMENTS_DISABLED'
      )
    }

    // Vérifier le commentaire parent si c'est une réponse
    let parentComment = null
    if (commentData.parentCommentId) {
      parentComment = await Comment.findById(commentData.parentCommentId)
      if (!parentComment) {
        return createErrorResponse(
          'Commentaire parent non trouvé',
          404,
          'PARENT_COMMENT_NOT_FOUND'
        )
      }

      // Vérifier que le commentaire parent est sur le même article
      if (parentComment.article.toString() !== commentData.articleId) {
        return createErrorResponse(
          'Le commentaire parent doit être sur le même article',
          400,
          'PARENT_COMMENT_MISMATCH'
        )
      }

      // Vérifier que le commentaire parent est approuvé
      if (parentComment.status !== 'approved') {
        return createErrorResponse(
          'Impossible de répondre à un commentaire non approuvé',
          400,
          'PARENT_COMMENT_NOT_APPROVED'
        )
      }
    }

    // Préparer les données pour la création
    const ip = getRealIP(request) || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    const commentToCreate = {
      content: commentData.content,
      article: new ObjectId(commentData.articleId),
      parentComment: commentData.parentCommentId ? 
        new ObjectId(commentData.parentCommentId) : undefined,
      author: new ObjectId(context.user.id),
      authorName: commentData.authorName,
      authorEmail: commentData.authorEmail,
      authorWebsite: commentData.authorWebsite,
      authorAvatar: context.user.image, // Utiliser l'avatar du profil utilisateur
      ipAddress: ip,
      userAgent: userAgent,
      isVerified: true, // L'utilisateur est authentifié
      status: 'pending', // Par défaut en attente de modération
    }

    // Auto-approuver pour les modérateurs et les auteurs de l'article
    if (canModerateComments(context.user.role) || 
        article.author.toString() === context.user.id) {
      commentToCreate.status = 'approved'
    }

    // Créer le commentaire
    const comment = new Comment(commentToCreate)
    await comment.save()

    // Mettre à jour les statistiques de l'article si approuvé
    if (comment.status === 'approved') {
      await Article.findByIdAndUpdate(
        commentData.articleId,
        { $inc: { 'stats.comments': 1 } }
      )
    }

    // Populer les champs pour la réponse
    await comment.populate([
      { path: 'author', select: 'firstName lastName email image' },
      { path: 'article', select: 'title slug' },
      { path: 'parentComment', select: 'content author' }
    ])

    // Log de l'action
    await logBlogAction(
      context,
      'CREATE_COMMENT',
      'comment',
      comment._id.toString(),
      {
        articleId: commentData.articleId,
        articleTitle: article.title,
        isReply: !!commentData.parentCommentId,
        status: comment.status,
        autoApproved: comment.status === 'approved',
      }
    )

    const responseMessage = comment.status === 'approved' 
      ? 'Commentaire publié avec succès'
      : 'Commentaire soumis et en attente de modération'

    return createSuccessResponse(
      comment,
      responseMessage,
      { 
        status: comment.status,
        requiresModeration: comment.status === 'pending'
      }
    )

  } catch (error: any) {
    console.error('Erreur lors de la création du commentaire:', error)

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
      'Erreur lors de la création du commentaire',
      500,
      'DATABASE_ERROR',
      process.env.NODE_ENV === 'development' ? error.message : undefined
    )
  }
}