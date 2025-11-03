/**
 * API endpoints CRUD pour les Articles
 * GET /api/articles - Liste paginée avec filtres
 * POST /api/articles - Création (admin/manager only)
 */

import { NextRequest } from 'next/server'
import dbConnect from '@/lib/mongodb'
import { Article, Category, User } from '@/lib/models'
import {
  requireAuth,
  requireArticlePermission,
  createErrorResponse,
  createSuccessResponse,
  logBlogAction,
} from '@/lib/api/blog-auth'
import {
  validateRequestBody,
  PaginationSchema,
  ArticleFiltersSchema,
  CreateArticleSchema,
  generateSlug,
  type PaginationParams,
  type ArticleFilters,
  type CreateArticleInput,
} from '@/lib/validation/blog'
import { ObjectId } from 'mongodb'

/**
 * GET /api/articles - Liste paginée des articles avec filtres
 */
export async function GET(request: NextRequest) {
  try {
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
    const filtersResult = ArticleFiltersSchema.safeParse(queryParams)
    if (!filtersResult.success) {
      return createErrorResponse(
        'Filtres invalides',
        400,
        'INVALID_FILTERS',
        filtersResult.error
      )
    }

    const pagination: PaginationParams = paginationResult.data
    const filters: ArticleFilters = filtersResult.data

    // Construction de la requête MongoDB
    const query: any = {}

    // Filtres de base
    if (filters.status) {
      query.status = filters.status
    } else {
      // Par défaut, ne montrer que les articles publiés pour les utilisateurs non authentifiés
      const authResult = await requireAuth(request)
      if (!authResult.success) {
        query.status = 'published'
        query.$or = [
          { scheduledPublishAt: { $lte: new Date() } },
          { scheduledPublishAt: { $exists: false } },
        ]
      }
    }

    if (filters.contentType) {
      query.contentType = filters.contentType
    }

    if (filters.categoryId) {
      query.category = new ObjectId(filters.categoryId)
    }

    if (filters.authorId) {
      query.author = new ObjectId(filters.authorId)
    }

    if (filters.featured !== undefined) {
      query.featured = filters.featured
    }

    if (filters.tags && filters.tags.length > 0) {
      query.tags = { $in: filters.tags }
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
    const [articles, total] = await Promise.all([
      Article.find(query)
        .populate('author', 'firstName lastName email image')
        .populate('category', 'name slug color icon')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Article.countDocuments(query),
    ])

    // Transformer les articles pour ajouter l'id
    const transformedArticles = articles.map((article: any) => ({
      ...article,
      id: article._id.toString(),
      _id: undefined,
    }))

    // Métadonnées de pagination
    const totalPages = Math.ceil(total / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1

    const meta = {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev,
      filters: filters,
    }

    return createSuccessResponse(transformedArticles, 'Articles récupérés avec succès', meta)

  } catch (error: any) {
    console.error('Erreur lors de la récupération des articles:', error)
    return createErrorResponse(
      'Erreur lors de la récupération des articles',
      500,
      'DATABASE_ERROR',
      process.env.NODE_ENV === 'development' ? error.message : undefined
    )
  }
}

/**
 * POST /api/articles - Création d'un nouvel article (admin/manager only)
 */
export async function POST(request: NextRequest) {
  try {
    // Vérification des permissions
    const authResult = await requireArticlePermission(request, 'create')
    if (!authResult.success) {
      return createErrorResponse(authResult.error, authResult.status)
    }

    const { context } = authResult

    await dbConnect()

    // Validation du body
    let body: unknown
    try {
      body = await request.json()
      console.log('Données reçues pour création d\'article:', JSON.stringify(body, null, 2))
    } catch {
      return createErrorResponse('Corps de requête JSON invalide', 400, 'INVALID_JSON')
    }

    const validationResult = CreateArticleSchema.safeParse(body)
    if (!validationResult.success) {
      console.error('Erreur de validation détaillée:', {
        errors: validationResult.error.format(),
        issues: validationResult.error.issues.map(issue => ({
          path: issue.path.join('.'),
          message: issue.message,
          ...(('received' in issue) && { received: issue.received }),
          ...(('expected' in issue) && { expected: issue.expected })
        })),
        receivedData: JSON.stringify(body, null, 2)
      })
      
      const detailedErrors = validationResult.error.issues.map(issue => 
        `${issue.path.join('.')}: ${issue.message}${('received' in issue) ? ` (received: ${JSON.stringify(issue.received)})` : ''}`
      )
      
      return createErrorResponse(
        `Validation échouée: ${detailedErrors.join('; ')}`,
        400,
        'VALIDATION_ERROR',
        validationResult.error.issues
      )
    }

    const articleData: CreateArticleInput = validationResult.data

    // Vérifier que la catégorie existe
    const category = await Category.findById(articleData.categoryId)
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

    // Générer le slug si non fourni
    let slug = articleData.slug
    if (!slug) {
      slug = generateSlug(articleData.title)
    }

    // Vérifier l'unicité du slug
    const existingArticle = await Article.findOne({ slug })
    if (existingArticle) {
      // Ajouter un suffixe numérique
      let counter = 1
      let uniqueSlug = `${slug}-${counter}`
      
      while (await Article.findOne({ slug: uniqueSlug })) {
        counter++
        uniqueSlug = `${slug}-${counter}`
      }
      
      slug = uniqueSlug
    }

    // Préparer les données pour la création
    const now = new Date()
    const articleToCreate = {
      ...articleData,
      slug,
      category: new ObjectId(articleData.categoryId),
      author: new ObjectId(context.user.id),
      lastEditedBy: new ObjectId(context.user.id),
      publishedAt: articleData.status === 'published' ? (articleData.scheduledPublishAt || now) : undefined,
    }

    // Remove undefined publishedAt if not needed
    if (articleToCreate.publishedAt === undefined) {
      delete (articleToCreate as any).publishedAt
    }

    // Créer l'article
    const article = new Article(articleToCreate)
    await article.save()

    // Mettre à jour les statistiques de la catégorie
    await Category.findByIdAndUpdate(
      articleData.categoryId,
      { 
        $inc: { 'stats.articleCount': 1 },
        $set: { 'stats.lastArticleAt': now }
      }
    )

    // Populer les champs pour la réponse
    await article.populate([
      { path: 'author', select: 'firstName lastName email image' },
      { path: 'category', select: 'name slug color icon' }
    ])

    // Log de l'action
    await logBlogAction(
      context,
      'CREATE_ARTICLE',
      'article',
      article._id.toString(),
      {
        title: article.title,
        status: article.status,
        categoryId: articleData.categoryId,
      }
    )

    return createSuccessResponse(
      article,
      'Article créé avec succès',
      { slug: article.slug }
    )

  } catch (error: any) {
    console.error('Erreur lors de la création de l\'article:', error)

    // Gestion des erreurs de validation Mongoose
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message)
      return createErrorResponse(
        'Erreurs de validation',
        400,
        'MONGOOSE_VALIDATION_ERROR',
        errors
      )
    }

    // Gestion des erreurs de duplication
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
      'Erreur lors de la création de l\'article',
      500,
      'DATABASE_ERROR',
      process.env.NODE_ENV === 'development' ? error.message : undefined
    )
  }
}

// Force Node.js runtime for database compatibility
export const runtime = 'nodejs'
