import { NextRequest } from 'next/server'
import dbConnect from '@/lib/mongodb'
import { Product } from '@/lib/models'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '6')
    const category = searchParams.get('category')

    let query: any = {
      featured: true,
      status: 'available'
    }

    // Filtre par catégorie si spécifié
    if (category && category !== 'all') {
      query.category = category
    }

    const featuredProducts = await Product.find(query)
      .populate('createdBy', 'name')
      .sort({ popularity: -1, createdAt: -1 })
      .limit(limit)
      .lean()

    // Si on n'a pas assez de produits featured, compléter avec des produits populaires
    if (featuredProducts.length < limit) {
      const remainingLimit = limit - featuredProducts.length
      const featuredIds = featuredProducts.map(p => p._id)
      
      const popularProducts = await Product.find({
        ...query,
        featured: false,
        _id: { $nin: featuredIds }
      })
        .populate('createdBy', 'name')
        .sort({ popularity: -1, averageRating: -1, createdAt: -1 })
        .limit(remainingLimit)
        .lean()

      featuredProducts.push(...popularProducts)
    }

    // Statistiques des produits featured
    const featuredStats = await Product.aggregate([
      { $match: { featured: true, status: 'available' } },
      {
        $group: {
          _id: null,
          totalFeatured: { $sum: 1 },
          averagePrice: { $avg: '$price' },
          averageRating: { $avg: '$averageRating' },
          categories: { $addToSet: '$category' }
        }
      }
    ])

    const stats = featuredStats[0] || {
      totalFeatured: 0,
      averagePrice: 0,
      averageRating: 0,
      categories: []
    }

    return Response.json({
      success: true,
      data: {
        products: featuredProducts,
        stats: {
          totalFeatured: stats.totalFeatured,
          averagePrice: Math.round(stats.averagePrice * 100) / 100,
          averageRating: Math.round(stats.averageRating * 10) / 10,
          categoriesCount: stats.categories.length,
          categories: stats.categories
        },
        pagination: {
          limit,
          count: featuredProducts.length,
          hasMore: featuredProducts.length === limit
        }
      },
      message: 'Produits vedettes récupérés avec succès'
    })

  } catch (error: any) {
    console.error('Erreur lors de la récupération des produits vedettes:', error)
    return Response.json({
      success: false,
      message: 'Erreur lors de la récupération des produits vedettes',
      error: error.message
    }, { status: 500 })
  }
}