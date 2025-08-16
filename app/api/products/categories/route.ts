import { NextRequest } from 'next/server'
import dbConnect from '@/lib/mongodb'
import { Product } from '@/lib/models'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    // Récupérer les statistiques par catégorie
    const categoryStats = await Product.aggregate([
      { $match: { status: 'available' } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          averagePrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
          featuredCount: {
            $sum: { $cond: ['$featured', 1, 0] }
          }
        }
      },
      { $sort: { count: -1 } }
    ])

    // Mapping des catégories avec leurs métadonnées
    const categoryMetadata: Record<string, any> = {
      coffee: {
        name: 'Café',
        description: 'Nos délicieux cafés artisanaux',
        icon: '☕',
        color: '#8B4513'
      },
      tea: {
        name: 'Thé',
        description: 'Une sélection de thés du monde entier',
        icon: '🍵',
        color: '#228B22'
      },
      pastry: {
        name: 'Pâtisseries',
        description: 'Viennoiseries et pâtisseries fraîches',
        icon: '🥐',
        color: '#DAA520'
      },
      sandwich: {
        name: 'Sandwichs',
        description: 'Sandwichs frais et savoureux',
        icon: '🥪',
        color: '#CD853F'
      },
      snack: {
        name: 'Snacks',
        description: 'Petites collations pour tous les goûts',
        icon: '🍪',
        color: '#DEB887'
      },
      beverage: {
        name: 'Boissons',
        description: 'Boissons fraîches et rafraîchissantes',
        icon: '🥤',
        color: '#4169E1'
      },
      healthy: {
        name: 'Healthy',
        description: 'Options saines et équilibrées',
        icon: '🥗',
        color: '#32CD32'
      },
      breakfast: {
        name: 'Petit-déjeuner',
        description: 'Pour bien commencer la journée',
        icon: '🍳',
        color: '#FF6347'
      }
    }

    // Enrichir les données avec les métadonnées
    const enrichedCategories = categoryStats.map(category => ({
      id: category._id,
      slug: category._id,
      ...categoryMetadata[category._id],
      stats: {
        count: category.count,
        averagePrice: Math.round(category.averagePrice * 100) / 100,
        priceRange: {
          min: category.minPrice,
          max: category.maxPrice
        },
        featuredCount: category.featuredCount
      }
    }))

    // Ajouter les catégories sans produits
    const existingCategories = categoryStats.map(cat => cat._id)
    const allCategories = Object.keys(categoryMetadata)
    
    const emptyCategories = allCategories
      .filter(cat => !existingCategories.includes(cat))
      .map(cat => ({
        id: cat,
        slug: cat,
        ...categoryMetadata[cat],
        stats: {
          count: 0,
          averagePrice: 0,
          priceRange: { min: 0, max: 0 },
          featuredCount: 0
        }
      }))

    const allCategoriesWithStats = [...enrichedCategories, ...emptyCategories]
      .sort((a, b) => b.stats.count - a.stats.count)

    // Statistiques globales
    const totalProducts = await Product.countDocuments({ status: 'available' })
    const featuredProducts = await Product.countDocuments({ 
      status: 'available', 
      featured: true 
    })

    return Response.json({
      success: true,
      data: {
        categories: allCategoriesWithStats,
        globalStats: {
          totalProducts,
          featuredProducts,
          totalCategories: allCategories.length,
          activeCategories: enrichedCategories.length
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