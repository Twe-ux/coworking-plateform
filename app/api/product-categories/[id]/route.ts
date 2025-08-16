import { NextRequest } from 'next/server'
import dbConnect from '@/lib/mongodb'
import { ProductCategoryModel, Product } from '@/lib/models'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ObjectId } from 'mongodb'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect()

    const { id } = params

    // Validation de l'ID
    if (!ObjectId.isValid(id)) {
      return Response.json({
        success: false,
        message: 'ID de catégorie invalide'
      }, { status: 400 })
    }

    const category = await ProductCategoryModel.findById(id)
      .populate('createdBy', 'name email')
      .populate('parentCategoryId', 'name slug')
      .lean()

    if (!category) {
      return Response.json({
        success: false,
        message: 'Catégorie non trouvée'
      }, { status: 404 })
    }

    // Récupérer les statistiques de la catégorie
    const [productCount, childrenCount] = await Promise.all([
      Product.countDocuments({ category: category.slug }),
      ProductCategoryModel.countDocuments({ parentCategoryId: id })
    ])

    const categoryWithStats = {
      ...category,
      productCount,
      childrenCount,
      hasChildren: childrenCount > 0
    }

    return Response.json({
      success: true,
      data: categoryWithStats,
      message: 'Catégorie récupérée avec succès'
    })

  } catch (error: any) {
    console.error('Erreur lors de la récupération de la catégorie:', error)
    return Response.json({
      success: false,
      message: 'Erreur lors de la récupération de la catégorie',
      error: error.message
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    const { id } = params
    
    // Validation de l'ID
    if (!ObjectId.isValid(id)) {
      return Response.json({
        success: false,
        message: 'ID de catégorie invalide'
      }, { status: 400 })
    }

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

    // Vérifier que la catégorie existe
    const existingCategory = await ProductCategoryModel.findById(id)
    if (!existingCategory) {
      return Response.json({
        success: false,
        message: 'Catégorie non trouvée'
      }, { status: 404 })
    }

    // Empêcher de définir une catégorie comme son propre parent
    if (parentCategoryId && parentCategoryId === id) {
      return Response.json({
        success: false,
        message: 'Une catégorie ne peut pas être son propre parent'
      }, { status: 400 })
    }

    // Empêcher les boucles dans la hiérarchie
    if (parentCategoryId) {
      const parentCategory = await ProductCategoryModel.findById(parentCategoryId)
      if (!parentCategory) {
        return Response.json({
          success: false,
          message: 'Catégorie parent non trouvée'
        }, { status: 400 })
      }

      // Vérifier que la catégorie parent n'est pas un descendant de la catégorie actuelle
      const descendants = await existingCategory.getDescendants()
      const descendantIds = descendants.map((desc: any) => desc._id.toString())
      
      if (descendantIds.includes(parentCategoryId)) {
        return Response.json({
          success: false,
          message: 'Impossible de créer une boucle dans la hiérarchie des catégories'
        }, { status: 400 })
      }
    }

    // Générer un nouveau slug si le nom a changé
    let slug = existingCategory.slug
    if (name && name !== existingCategory.name) {
      slug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')

      // Vérifier l'unicité du nouveau slug
      const slugExists = await ProductCategoryModel.findOne({ slug, _id: { $ne: id } })
      if (slugExists) {
        return Response.json({
          success: false,
          message: 'Une catégorie avec ce nom existe déjà'
        }, { status: 400 })
      }
    }

    // Données à mettre à jour
    const updateData: any = {}
    
    if (name !== undefined) updateData.name = name
    if (slug !== existingCategory.slug) updateData.slug = slug
    if (description !== undefined) updateData.description = description
    if (icon !== undefined) updateData.icon = icon
    if (color !== undefined) updateData.color = color
    if (image !== undefined) updateData.image = image
    if (isActive !== undefined) updateData.isActive = isActive
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder
    if (parentCategoryId !== undefined) updateData.parentCategoryId = parentCategoryId || null
    if (metaTitle !== undefined) updateData.metaTitle = metaTitle
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription

    const updatedCategory = await ProductCategoryModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { 
        new: true, 
        runValidators: true 
      }
    ).populate([
      { path: 'createdBy', select: 'name email' },
      { path: 'parentCategoryId', select: 'name slug' }
    ])

    return Response.json({
      success: true,
      data: updatedCategory,
      message: 'Catégorie mise à jour avec succès'
    })

  } catch (error: any) {
    console.error('Erreur lors de la mise à jour de la catégorie:', error)
    
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
      message: 'Erreur lors de la mise à jour de la catégorie',
      error: error.message
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return Response.json({
        success: false,
        message: 'Authentification requise'
      }, { status: 401 })
    }

    // Vérifier les permissions (admin seulement pour la suppression)
    if (session.user.role !== 'admin') {
      return Response.json({
        success: false,
        message: 'Seuls les administrateurs peuvent supprimer des catégories'
      }, { status: 403 })
    }

    await dbConnect()

    const { id } = params
    
    // Validation de l'ID
    if (!ObjectId.isValid(id)) {
      return Response.json({
        success: false,
        message: 'ID de catégorie invalide'
      }, { status: 400 })
    }

    // Vérifier que la catégorie existe
    const category = await ProductCategoryModel.findById(id)
    if (!category) {
      return Response.json({
        success: false,
        message: 'Catégorie non trouvée'
      }, { status: 404 })
    }

    // Vérifier qu'aucun produit n'utilise cette catégorie
    const productCount = await Product.countDocuments({ category: category.slug })
    if (productCount > 0) {
      return Response.json({
        success: false,
        message: `Impossible de supprimer cette catégorie car ${productCount} produit(s) l'utilisent`
      }, { status: 400 })
    }

    // Vérifier qu'aucune sous-catégorie n'existe
    const childrenCount = await ProductCategoryModel.countDocuments({ parentCategoryId: id })
    if (childrenCount > 0) {
      return Response.json({
        success: false,
        message: `Impossible de supprimer cette catégorie car elle contient ${childrenCount} sous-catégorie(s)`
      }, { status: 400 })
    }

    const deletedCategory = await ProductCategoryModel.findByIdAndDelete(id)

    return Response.json({
      success: true,
      data: { id: deletedCategory._id },
      message: 'Catégorie supprimée avec succès'
    })

  } catch (error: any) {
    console.error('Erreur lors de la suppression de la catégorie:', error)
    return Response.json({
      success: false,
      message: 'Erreur lors de la suppression de la catégorie',
      error: error.message
    }, { status: 500 })
  }
}