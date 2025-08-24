/**
 * API endpoints pour une catégorie spécifique
 * GET /api/categories/[id] - Récupérer une catégorie
 * PUT /api/categories/[id] - Modifier une catégorie
 * DELETE /api/categories/[id] - Supprimer une catégorie
 */

import { NextRequest } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Category from '@/lib/models/Category'
import Article from '@/lib/models/Article'
import {
  requireCategoryPermission,
  createErrorResponse,
  createSuccessResponse,
  logBlogAction,
} from '@/lib/api/blog-auth'
import {
  validateRequestBody,
  UpdateCategorySchema,
  generateSlug,
  isValidObjectId,
  type UpdateCategoryInput,
} from '@/lib/validation/blog'
import { ObjectId } from 'mongodb'

/**
 * GET /api/categories/[id] - Récupérer une catégorie par ID
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
        'ID de catégorie invalide',
        400,
        'INVALID_ID'
      )
    }

    await dbConnect()

    // Récupérer la catégorie
    const category = await Category.findById(id)
      .populate('parentCategory', 'name slug color icon')
      .populate('createdBy', 'firstName lastName email image')
      .populate('updatedBy', 'firstName lastName email image')

    if (!category) {
      return createErrorResponse(
        'Catégorie non trouvée',
        404,
        'CATEGORY_NOT_FOUND'
      )
    }

    // Récupérer les sous-catégories
    const subCategories = await Category.find({
      parentCategory: id,
      isActive: true,
    })
      .select('name slug color icon sortOrder stats')
      .sort({ sortOrder: 1, name: 1 })
      .lean()

    // Récupérer les articles récents de cette catégorie
    const recentArticles = await Article.find({
      category: id,
      status: 'published',
    })
      .select('title slug excerpt coverImage publishedAt stats author')
      .populate('author', 'firstName lastName')
      .sort({ publishedAt: -1 })
      .limit(10)
      .lean()

    // Récupérer le chemin complet de la catégorie
    const fullPath = await category.getFullPath()

    // Transform _id to id for frontend compatibility
    const categoryObj = category.toObject()
    const { _id, parentCategory, ...cleanCategoryObj } = categoryObj
    const responseData = {
      ...cleanCategoryObj,
      id: _id.toString(),
      parentCategoryId: parentCategory?._id?.toString(),
      subCategories: subCategories.map(sub => ({
        ...sub,
        id: sub._id.toString(),
        parentCategoryId: sub.parentCategory?.toString()
      })),
      recentArticles,
      fullPath,
      subCategoriesCount: subCategories.length,
      hasSubCategories: subCategories.length > 0,
      articlesCount: categoryObj.stats?.articleCount || 0,
    }

    return createSuccessResponse(
      responseData,
      'Catégorie récupérée avec succès'
    )

  } catch (error: any) {
    console.error('Erreur lors de la récupération de la catégorie:', error)
    return createErrorResponse(
      'Erreur lors de la récupération de la catégorie',
      500,
      'DATABASE_ERROR',
      process.env.NODE_ENV === 'development' ? error.message : undefined
    )
  }
}

/**
 * PUT /api/categories/[id] - Modifier une catégorie
 * PATCH /api/categories/[id] - Modifier partiellement une catégorie
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
        'ID de catégorie invalide',
        400,
        'INVALID_ID'
      )
    }

    await dbConnect()

    // Récupérer la catégorie existante
    const existingCategory = await Category.findById(id)
    if (!existingCategory) {
      return createErrorResponse(
        'Catégorie non trouvée',
        404,
        'CATEGORY_NOT_FOUND'
      )
    }

    // Vérification des permissions
    const authResult = await requireCategoryPermission(request, 'edit')
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

    const validationResult = validateRequestBody(UpdateCategorySchema, body)
    if (!validationResult.success) {
      return createErrorResponse(
        'Données de catégorie invalides',
        400,
        'VALIDATION_ERROR',
        validationResult.errors
      )
    }

    const updateData: UpdateCategoryInput = validationResult.data

    // Vérifier la catégorie parent si spécifiée
    if (updateData.parentCategoryId) {
      if (updateData.parentCategoryId === id) {
        return createErrorResponse(
          'Une catégorie ne peut pas être sa propre parente',
          400,
          'CIRCULAR_REFERENCE'
        )
      }

      const parentCategory = await Category.findById(updateData.parentCategoryId)
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

      // Vérifier les références circulaires
      const ancestors = await existingCategory.getAncestors()
      const ancestorIds = ancestors.map((a: any) => a._id.toString())
      
      if (ancestorIds.includes(updateData.parentCategoryId)) {
        return createErrorResponse(
          'Référence circulaire détectée',
          400,
          'CIRCULAR_REFERENCE'
        )
      }
    }

    // Gérer le slug si le nom change
    let slug = existingCategory.slug
    if (updateData.name && updateData.name !== existingCategory.name) {
      if (updateData.slug) {
        slug = updateData.slug
      } else {
        slug = generateSlug(updateData.name)
      }

      // Vérifier l'unicité du nouveau slug (sauf pour la catégorie actuelle)
      const existingSlug = await Category.findOne({ 
        slug, 
        _id: { $ne: id } 
      })
      
      if (existingSlug) {
        let counter = 1
        let uniqueSlug = `${slug}-${counter}`
        
        while (await Category.findOne({ 
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
      updatedBy: new ObjectId(context.user.id),
    }

    // Convertir parentCategoryId en ObjectId si présent
    if (updateData.parentCategoryId) {
      updateFields.parentCategory = new ObjectId(updateData.parentCategoryId)
      delete updateFields.parentCategoryId
    } else if (updateData.parentCategoryId === null) {
      // Retirer la catégorie parent
      updateFields.parentCategory = null
      delete updateFields.parentCategoryId
    }

    // Mettre à jour la catégorie
    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      updateFields,
      { 
        new: true,
        runValidators: true 
      }
    )
      .populate('parentCategory', 'name slug color icon')
      .populate('createdBy', 'firstName lastName email image')
      .populate('updatedBy', 'firstName lastName email image')

    if (!updatedCategory) {
      return createErrorResponse(
        'Erreur lors de la mise à jour',
        500,
        'UPDATE_FAILED'
      )
    }

    // Log de l'action
    await logBlogAction(
      context,
      'UPDATE_CATEGORY',
      'category',
      id,
      {
        name: updatedCategory.name,
        changes: Object.keys(updateData),
        previousParent: existingCategory.parentCategory?.toString(),
        newParent: updateData.parentCategoryId,
      }
    )

    // Transform the response for frontend compatibility
    const categoryObj = updatedCategory.toObject()
    const { _id, parentCategory, ...cleanCategoryObj } = categoryObj
    const responseData = {
      ...cleanCategoryObj,
      id: _id.toString(),
      parentCategoryId: parentCategory?._id?.toString(),
      articlesCount: categoryObj.stats?.articleCount || 0,
    }

    return createSuccessResponse(
      responseData,
      'Catégorie mise à jour avec succès'
    )

  } catch (error: any) {
    console.error('Erreur lors de la mise à jour de la catégorie:', error)

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
      'Erreur lors de la mise à jour de la catégorie',
      500,
      'DATABASE_ERROR',
      process.env.NODE_ENV === 'development' ? error.message : undefined
    )
  }
}

/**
 * PATCH /api/categories/[id] - Modifier partiellement une catégorie
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // PATCH uses the same logic as PUT but allows partial updates
  return PUT(request, { params })
}

/**
 * DELETE /api/categories/[id] - Supprimer une catégorie
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
        'ID de catégorie invalide',
        400,
        'INVALID_ID'
      )
    }

    await dbConnect()

    // Récupérer la catégorie existante
    const existingCategory = await Category.findById(id)
    if (!existingCategory) {
      return createErrorResponse(
        'Catégorie non trouvée',
        404,
        'CATEGORY_NOT_FOUND'
      )
    }

    // Vérification des permissions
    const authResult = await requireCategoryPermission(request, 'delete')
    if (!authResult.success) {
      return createErrorResponse(authResult.error, authResult.status)
    }

    const { context } = authResult

    // Vérifier si la catégorie peut être supprimée
    const canDelete = await existingCategory.canBeDeleted()
    if (!canDelete) {
      return createErrorResponse(
        'La catégorie ne peut pas être supprimée car elle contient des articles ou des sous-catégories',
        400,
        'CATEGORY_IN_USE'
      )
    }

    // Récupérer des informations pour les logs avant suppression
    const categoryInfo = {
      name: existingCategory.name,
      slug: existingCategory.slug,
      articleCount: existingCategory.stats.articleCount,
    }

    // Compter les sous-catégories avant suppression
    const subCategoriesCount = await Category.countDocuments({ 
      parentCategory: id 
    })

    // Supprimer la catégorie
    await Category.findByIdAndDelete(id)

    // Log de l'action
    await logBlogAction(
      context,
      'DELETE_CATEGORY',
      'category',
      id,
      {
        ...categoryInfo,
        subCategoriesCount,
      }
    )

    return createSuccessResponse(
      { 
        deletedCategory: id,
        ...categoryInfo,
        subCategoriesReassigned: subCategoriesCount
      },
      'Catégorie supprimée avec succès'
    )

  } catch (error: any) {
    console.error('Erreur lors de la suppression de la catégorie:', error)
    return createErrorResponse(
      'Erreur lors de la suppression de la catégorie',
      500,
      'DATABASE_ERROR',
      process.env.NODE_ENV === 'development' ? error.message : undefined
    )
  }
}