/**
 * API endpoints CRUD pour les Categories
 * GET /api/categories - Liste toutes catégories
 * POST /api/categories - Création (admin/manager only)
 */

import { NextRequest } from 'next/server'
import dbConnect from '@/lib/mongodb'
import { Category } from '@/lib/models'
import {
  requireCategoryPermission,
  createErrorResponse,
  createSuccessResponse,
  logBlogAction,
} from '@/lib/api/blog-auth'
import {
  CategoryFiltersSchema,
  CreateCategorySchema,
  generateSlug,
  type CategoryFilters,
  type CreateCategoryInput,
} from '@/lib/validation/blog'
import { ObjectId } from 'mongodb'

/**
 * GET /api/categories - Liste toutes les catégories avec filtres
 */
export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())

    // Validation des filtres
    const filtersResult = CategoryFiltersSchema.safeParse(queryParams)
    if (!filtersResult.success) {
      return createErrorResponse(
        'Filtres invalides',
        400,
        'INVALID_FILTERS',
        filtersResult.error
      )
    }

    const filters: CategoryFilters = filtersResult.data

    // Construction de la requête MongoDB
    const query: any = {}

    // Filtres de base
    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive
    } else {
      // Par défaut, ne montrer que les catégories actives
      query.isActive = true
    }

    if (filters.parentCategoryId) {
      query.parentCategory = new ObjectId(filters.parentCategoryId)
    }

    // Recherche textuelle
    if (filters.search) {
      query.$text = { $search: filters.search }
    }

    // Options d'affichage
    const includeTree = queryParams.tree === 'true'
    const includeStats = queryParams.stats === 'true'

    if (includeTree) {
      // Retourner l'arbre complet des catégories
      const categoryTree = await Category.buildCategoryTree()
      
      return createSuccessResponse(
        categoryTree,
        'Arbre des catégories récupéré avec succès',
        { type: 'tree' }
      )
    }

    // Tri par défaut
    const sort: any = { sortOrder: 1, name: 1 }
    if (filters.search) {
      sort.score = { $meta: 'textScore' }
    }

    // Exécution de la requête
    let categoriesQuery = Category.find(query)
      .populate('parentCategory', 'name slug color icon')
      .populate('createdBy', 'firstName lastName email')
      .sort(sort)

    if (includeStats) {
      // Ajouter les statistiques détaillées
      categoriesQuery = categoriesQuery.populate('updatedBy', 'firstName lastName email')
    }

    const categories = await categoriesQuery.lean()

    // Enrichir avec des statistiques supplémentaires si demandé
    if (includeStats) {
      const enrichedCategories = await Promise.all(
        categories.map(async (category) => {
          // Compter les sous-catégories
          const subCategoriesCount = await Category.countDocuments({
            parentCategory: category._id,
            isActive: true,
          })

          // Récupérer les articles récents de cette catégorie
          const Article = require('@/lib/models/Article').default
          const recentArticles = await Article.find({
            category: category._id,
            status: 'published',
          })
            .select('title slug publishedAt')
            .sort({ publishedAt: -1 })
            .limit(5)
            .lean()

          // Transform _id to id for frontend compatibility
          const { _id, parentCategory, ...cleanCategory } = category
          const transformedCategory = {
            ...cleanCategory,
            id: _id.toString(),
            parentCategoryId: parentCategory?.toString(),
            subCategoriesCount,
            recentArticles,
            hasSubCategories: subCategoriesCount > 0,
            articlesCount: category.stats?.articleCount || 0,
          }
          
          return transformedCategory
        })
      )

      return createSuccessResponse(
        enrichedCategories,
        'Catégories avec statistiques récupérées avec succès',
        { 
          type: 'detailed',
          total: enrichedCategories.length,
          filters: filters,
        }
      )
    }

    // Ajouter des informations de base sur les sous-catégories
    const enrichedCategories = await Promise.all(
      categories.map(async (category) => {
        const subCategoriesCount = await Category.countDocuments({
          parentCategory: category._id,
          isActive: true,
        })

        // Transform _id to id for frontend compatibility
        const { _id, parentCategory, ...cleanCategory } = category
        const transformedCategory = {
          ...cleanCategory,
          id: _id.toString(),
          parentCategoryId: parentCategory?.toString(),
          subCategoriesCount,
          hasSubCategories: subCategoriesCount > 0,
          articlesCount: category.stats?.articleCount || 0,
        }
        
        return transformedCategory
      })
    )

    return createSuccessResponse(
      enrichedCategories,
      'Catégories récupérées avec succès',
      { 
        total: enrichedCategories.length,
        filters: filters,
      }
    )

  } catch (error: any) {
    console.error('Erreur lors de la récupération des catégories:', error)
    return createErrorResponse(
      'Erreur lors de la récupération des catégories',
      500,
      'DATABASE_ERROR',
      process.env.NODE_ENV === 'development' ? error.message : undefined
    )
  }
}

/**
 * POST /api/categories - Création d'une nouvelle catégorie (admin/manager only)
 */
export async function POST(request: NextRequest) {
  try {
    // Vérification des permissions
    const authResult = await requireCategoryPermission(request, 'create')
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

    const validationResult = CreateCategorySchema.safeParse(body)
    if (!validationResult.success) {
      return createErrorResponse(
        'Données de catégorie invalides',
        400,
        'VALIDATION_ERROR',
        validationResult.error
      )
    }

    const categoryData: CreateCategoryInput = validationResult.data

    // Vérifier la catégorie parent si spécifiée
    if (categoryData.parentCategoryId) {
      const parentCategory = await Category.findById(categoryData.parentCategoryId)
      if (!parentCategory) {
        return createErrorResponse(
          'Catégorie parent non trouvée',
          404,
          'PARENT_CATEGORY_NOT_FOUND'
        )
      }

      if (!parentCategory.isActive) {
        return createErrorResponse(
          'La catégorie parent est désactivée',
          400,
          'PARENT_CATEGORY_INACTIVE'
        )
      }
    }

    // Générer le slug si non fourni
    let slug = categoryData.slug
    if (!slug) {
      slug = generateSlug(categoryData.name)
    }

    // Vérifier l'unicité du slug
    const existingCategory = await Category.findOne({ slug })
    if (existingCategory) {
      // Ajouter un suffixe numérique
      let counter = 1
      let uniqueSlug = `${slug}-${counter}`
      
      while (await Category.findOne({ slug: uniqueSlug })) {
        counter++
        uniqueSlug = `${slug}-${counter}`
      }
      
      slug = uniqueSlug
    }

    // Préparer les données pour la création
    const categoryToCreate = {
      ...categoryData,
      slug,
      parentCategory: categoryData.parentCategoryId ? 
        new ObjectId(categoryData.parentCategoryId) : 
        undefined,
      createdBy: new ObjectId(context.user.id),
      updatedBy: new ObjectId(context.user.id),
    }

    // Supprimer parentCategoryId du payload
    delete categoryToCreate.parentCategoryId

    // Créer la catégorie
    const category = new Category(categoryToCreate)
    await category.save()

    // Populer les champs pour la réponse
    await category.populate([
      { path: 'parentCategory', select: 'name slug color icon' },
      { path: 'createdBy', select: 'firstName lastName email' },
      { path: 'updatedBy', select: 'firstName lastName email' }
    ])

    // Log de l'action
    await logBlogAction(
      context,
      'CREATE_CATEGORY',
      'category',
      category._id.toString(),
      {
        name: category.name,
        slug: category.slug,
        parentCategoryId: categoryData.parentCategoryId,
      }
    )

    return createSuccessResponse(
      category,
      'Catégorie créée avec succès',
      { slug: category.slug }
    )

  } catch (error: any) {
    console.error('Erreur lors de la création de la catégorie:', error)

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
      'Erreur lors de la création de la catégorie',
      500,
      'DATABASE_ERROR',
      process.env.NODE_ENV === 'development' ? error.message : undefined
    )
  }
}