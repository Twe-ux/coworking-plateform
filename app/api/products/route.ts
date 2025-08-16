import { NextRequest } from 'next/server'
import dbConnect from '@/lib/mongodb'
import { Product } from '@/lib/models'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const featured = searchParams.get('featured')
    const search = searchParams.get('search')
    const status = searchParams.get('status') || 'available'
    const limit = parseInt(searchParams.get('limit') || '20')
    const page = parseInt(searchParams.get('page') || '1')
    const sortBy = searchParams.get('sortBy') || 'popularity'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    let query: any = {}

    // Filtres de statut
    if (status) {
      query.status = status
    }

    // Filtre par catégorie
    if (category && category !== 'all') {
      query.category = category
    }

    // Filtre featured
    if (featured === 'true') {
      query.featured = true
    }

    // Recherche textuelle
    if (search) {
      query.$text = { $search: search }
    }

    // Construction de la requête avec pagination
    const skip = (page - 1) * limit
    const sortOptions: any = {}
    
    if (search) {
      sortOptions.score = { $meta: 'textScore' }
    }
    
    switch (sortBy) {
      case 'name':
        sortOptions.name = sortOrder === 'desc' ? -1 : 1
        break
      case 'price':
        sortOptions.price = sortOrder === 'desc' ? -1 : 1
        break
      case 'rating':
        sortOptions.averageRating = sortOrder === 'desc' ? -1 : 1
        break
      case 'created':
        sortOptions.createdAt = sortOrder === 'desc' ? -1 : 1
        break
      default:
        sortOptions.featured = -1
        sortOptions.popularity = -1
        sortOptions.createdAt = -1
    }

    // Exécution de la requête
    const [products, totalCount] = await Promise.all([
      Product.find(query)
        .populate('createdBy', 'name email')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query)
    ])

    // Statistiques par catégorie
    const categoryStats = await Product.aggregate([
      { $match: { status: 'available' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])

    const totalPages = Math.ceil(totalCount / limit)

    return Response.json({
      success: true,
      data: {
        products,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          limit
        },
        categoryStats,
        filters: {
          category,
          featured,
          search,
          status,
          sortBy,
          sortOrder
        }
      },
      message: 'Produits récupérés avec succès'
    })

  } catch (error: any) {
    console.error('Erreur lors de la récupération des produits:', error)
    return Response.json({
      success: false,
      message: 'Erreur lors de la récupération des produits',
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

    // Validation des champs obligatoires
    if (!name || !description || !category || price === undefined) {
      return Response.json({
        success: false,
        message: 'Champs obligatoires manquants: name, description, category, price'
      }, { status: 400 })
    }

    // Vérifier l'unicité du slug
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')

    const existingProduct = await Product.findOne({ slug })
    if (existingProduct) {
      return Response.json({
        success: false,
        message: 'Un produit avec ce nom existe déjà'
      }, { status: 400 })
    }

    // Créer le nouveau produit
    const productData = {
      name,
      slug,
      description,
      shortDescription,
      category,
      subcategory,
      price: parseFloat(price),
      originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
      images: images || [],
      mainImage: mainImage || (images && images[0]),
      recipe,
      nutrition,
      status: status || 'available',
      featured: featured || false,
      isOrganic: isOrganic || false,
      isFairTrade: isFairTrade || false,
      isVegan: isVegan || false,
      isGlutenFree: isGlutenFree || false,
      tags: tags || [],
      customizations: customizations || [],
      sizes: sizes || [],
      availableHours,
      stockQuantity: stockQuantity || 0,
      isUnlimited: isUnlimited !== false,
      preparationTime,
      createdBy: session.user.id
    }

    const newProduct = new Product(productData)
    const savedProduct = await newProduct.save()

    // Populer les données du créateur
    await savedProduct.populate('createdBy', 'name email')

    return Response.json({
      success: true,
      data: savedProduct,
      message: 'Produit créé avec succès'
    }, { status: 201 })

  } catch (error: any) {
    console.error('Erreur lors de la création du produit:', error)
    
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
      message: 'Erreur lors de la création du produit',
      error: error.message
    }, { status: 500 })
  }
}