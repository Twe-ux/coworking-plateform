import { NextRequest } from 'next/server'
import dbConnect from '@/lib/mongodb'
import { ProductCategoryModel } from '@/lib/models'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const activeOnly = searchParams.get('activeOnly') !== 'false'
    const includeHierarchy = searchParams.get('includeHierarchy') === 'true'
    const parentId = searchParams.get('parentId')

    let categories

    if (search) {
      // Recherche textuelle
      categories = await ProductCategoryModel.searchCategories(search, activeOnly)
    } else if (includeHierarchy) {
      // Récupération avec hiérarchie et compteurs
      categories = await ProductCategoryModel.findHierarchy()
    } else {
      // Récupération simple avec filtrage optionnel par parent
      const query: any = {}
      if (activeOnly) query.isActive = true
      if (parentId !== undefined) {
        query.parentCategoryId = parentId === 'null' ? null : parentId
      }

      categories = await ProductCategoryModel.find(query)
        .populate('createdBy', 'name email')
        .populate('parentCategoryId', 'name slug')
        .sort({ sortOrder: 1, name: 1 })
        .lean()
    }

    // Statistiques globales
    const stats = await ProductCategoryModel.aggregate([
      {
        $group: {
          _id: null,
          totalCategories: { $sum: 1 },
          activeCategories: {
            $sum: { $cond: ['$isActive', 1, 0] }
          },
          parentCategories: {
            $sum: { $cond: [{ $eq: ['$parentCategoryId', null] }, 1, 0] }
          }
        }
      }
    ])

    return Response.json({
      success: true,
      data: {
        categories,
        stats: stats[0] || {
          totalCategories: 0,
          activeCategories: 0,
          parentCategories: 0
        }
      },
      message: 'Catégories récupérées avec succès'
    })

  } catch (error: any) {
    console.error('Erreur lors de la récupération des catégories:', error)
    return Response.json({
      success: false,
      message: 'Erreur lors de la récupération des catégories',
      error: error.message
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return Response.json({
        success: false,
        message: 'Authentification requise'
      }, { status: 401 })
    }

    // Vérifier les permissions (admin ou manager)
    if (!['admin', 'manager'].includes(session.user.role)) {
      return Response.json({
        success: false,
        message: 'Permissions insuffisantes'
      }, { status: 403 })
    }

    await dbConnect()

    const body = await request.json()
    const {
      name,
      description,
      icon,
      color,
      image,
      isActive,
      sortOrder,
      parentCategoryId,
      metaTitle,
      metaDescription
    } = body

    // Validation des champs obligatoires
    if (!name) {
      return Response.json({
        success: false,
        message: 'Le nom de la catégorie est obligatoire'
      }, { status: 400 })
    }

    // Générer le slug
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')

    // Vérifier l'unicité du slug
    const existingCategory = await ProductCategoryModel.findOne({ slug })
    if (existingCategory) {
      return Response.json({
        success: false,
        message: 'Une catégorie avec ce nom existe déjà'
      }, { status: 400 })
    }

    // Valider la catégorie parent si spécifiée
    if (parentCategoryId) {
      const parentCategory = await ProductCategoryModel.findById(parentCategoryId)
      if (!parentCategory) {
        return Response.json({
          success: false,
          message: 'Catégorie parent non trouvée'
        }, { status: 400 })
      }
    }

    // Créer la nouvelle catégorie
    const categoryData = {
      name,
      slug,
      description,
      icon,
      color,
      image,
      isActive: isActive !== false,
      sortOrder: sortOrder || 0,
      parentCategoryId: parentCategoryId || null,
      metaTitle,
      metaDescription,
      createdBy: session.user.id
    }

    const newCategory = new ProductCategoryModel(categoryData)
    const savedCategory = await newCategory.save()

    // Populer les données
    await savedCategory.populate([
      { path: 'createdBy', select: 'name email' },
      { path: 'parentCategoryId', select: 'name slug' }
    ])

    return Response.json({
      success: true,
      data: savedCategory,
      message: 'Catégorie créée avec succès'
    }, { status: 201 })

  } catch (error: any) {
    console.error('Erreur lors de la création de la catégorie:', error)
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message)
      return Response.json({
        success: false,
        message: 'Erreurs de validation',
        errors: validationErrors
      }, { status: 400 })
    }

    if (error.code === 11000) {
      return Response.json({
        success: false,
        message: 'Une catégorie avec ce slug existe déjà'
      }, { status: 400 })
    }

    return Response.json({
      success: false,
      message: 'Erreur lors de la création de la catégorie',
      error: error.message
    }, { status: 500 })
  }
}