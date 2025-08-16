import { NextRequest } from 'next/server'
import dbConnect from '@/lib/mongodb'
import { Product } from '@/lib/models'
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
        message: 'ID de produit invalide'
      }, { status: 400 })
    }

    const product = await Product.findById(id)
      .populate('createdBy', 'name email')
      .lean()

    if (!product) {
      return Response.json({
        success: false,
        message: 'Produit non trouvé'
      }, { status: 404 })
    }

    // Incrémenter la popularité du produit
    await Product.findByIdAndUpdate(id, { $inc: { popularity: 1 } })

    return Response.json({
      success: true,
      data: product,
      message: 'Produit récupéré avec succès'
    })

  } catch (error: any) {
    console.error('Erreur lors de la récupération du produit:', error)
    return Response.json({
      success: false,
      message: 'Erreur lors de la récupération du produit',
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
        message: 'ID de produit invalide'
      }, { status: 400 })
    }

    const body = await request.json()
    const {
      name,
      description,
      shortDescription,
      category,
      subcategory,
      price,
      originalPrice,
      images,
      mainImage,
      recipe,
      nutrition,
      status,
      featured,
      isOrganic,
      isFairTrade,
      isVegan,
      isGlutenFree,
      tags,
      customizations,
      sizes,
      availableHours,
      stockQuantity,
      isUnlimited,
      preparationTime
    } = body

    // Vérifier que le produit existe
    const existingProduct = await Product.findById(id)
    if (!existingProduct) {
      return Response.json({
        success: false,
        message: 'Produit non trouvé'
      }, { status: 404 })
    }

    // Générer un nouveau slug si le nom a changé
    let slug = existingProduct.slug
    if (name && name !== existingProduct.name) {
      slug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')

      // Vérifier l'unicité du nouveau slug
      const slugExists = await Product.findOne({ slug, _id: { $ne: id } })
      if (slugExists) {
        return Response.json({
          success: false,
          message: 'Un produit avec ce nom existe déjà'
        }, { status: 400 })
      }
    }

    // Données à mettre à jour
    const updateData: any = {}
    
    if (name !== undefined) updateData.name = name
    if (slug !== existingProduct.slug) updateData.slug = slug
    if (description !== undefined) updateData.description = description
    if (shortDescription !== undefined) updateData.shortDescription = shortDescription
    if (category !== undefined) updateData.category = category
    if (subcategory !== undefined) updateData.subcategory = subcategory
    if (price !== undefined) updateData.price = parseFloat(price)
    if (originalPrice !== undefined) updateData.originalPrice = originalPrice ? parseFloat(originalPrice) : null
    if (images !== undefined) updateData.images = images
    if (mainImage !== undefined) updateData.mainImage = mainImage
    if (recipe !== undefined) updateData.recipe = recipe
    if (nutrition !== undefined) updateData.nutrition = nutrition
    if (status !== undefined) updateData.status = status
    if (featured !== undefined) updateData.featured = featured
    if (isOrganic !== undefined) updateData.isOrganic = isOrganic
    if (isFairTrade !== undefined) updateData.isFairTrade = isFairTrade
    if (isVegan !== undefined) updateData.isVegan = isVegan
    if (isGlutenFree !== undefined) updateData.isGlutenFree = isGlutenFree
    if (tags !== undefined) updateData.tags = tags
    if (customizations !== undefined) updateData.customizations = customizations
    if (sizes !== undefined) updateData.sizes = sizes
    if (availableHours !== undefined) updateData.availableHours = availableHours
    if (stockQuantity !== undefined) updateData.stockQuantity = stockQuantity
    if (isUnlimited !== undefined) updateData.isUnlimited = isUnlimited
    if (preparationTime !== undefined) updateData.preparationTime = preparationTime

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $set: updateData },
      { 
        new: true, 
        runValidators: true 
      }
    ).populate('createdBy', 'name email')

    return Response.json({
      success: true,
      data: updatedProduct,
      message: 'Produit mis à jour avec succès'
    })

  } catch (error: any) {
    console.error('Erreur lors de la mise à jour du produit:', error)
    
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
        message: 'Un produit avec ce slug existe déjà'
      }, { status: 400 })
    }

    return Response.json({
      success: false,
      message: 'Erreur lors de la mise à jour du produit',
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
        message: 'Seuls les administrateurs peuvent supprimer des produits'
      }, { status: 403 })
    }

    await dbConnect()

    const { id } = params
    
    // Validation de l'ID
    if (!ObjectId.isValid(id)) {
      return Response.json({
        success: false,
        message: 'ID de produit invalide'
      }, { status: 400 })
    }

    const deletedProduct = await Product.findByIdAndDelete(id)

    if (!deletedProduct) {
      return Response.json({
        success: false,
        message: 'Produit non trouvé'
      }, { status: 404 })
    }

    return Response.json({
      success: true,
      data: { id: deletedProduct._id },
      message: 'Produit supprimé avec succès'
    })

  } catch (error: any) {
    console.error('Erreur lors de la suppression du produit:', error)
    return Response.json({
      success: false,
      message: 'Erreur lors de la suppression du produit',
      error: error.message
    }, { status: 500 })
  }
}