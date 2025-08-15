/**
 * API endpoint pour la recherche dans le blog
 * Recherche textuelle dans les articles avec suggestions
 */

import { NextRequest } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Article from '@/lib/models/Article'
import Category from '@/lib/models/Category'
import {
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/api/blog-auth'

/**
 * GET /api/search - Recherche dans les articles du blog
 */
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')?.trim()
    const categories = searchParams.get('categories')?.split(',').filter(Boolean)
    const contentTypes = searchParams.get('contentTypes')?.split(',').filter(Boolean)
    const sortBy = searchParams.get('sortBy') || 'relevance'
    const dateRange = searchParams.get('dateRange') || 'all'
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)

    if (!query || query.length < 2) {
      return createErrorResponse(
        'Le terme de recherche doit contenir au moins 2 caractères',
        400,
        'INVALID_QUERY'
      )
    }

    const startTime = Date.now()

    // Construction de la requête MongoDB
    const searchQuery: any = {
      status: 'published',
      $text: { $search: query },
    }

    // Filtres par catégorie
    if (categories && categories.length > 0) {
      const categoryObjects = await Category.find({
        $or: [
          { _id: { $in: categories.filter(id => /^[a-f\d]{24}$/i.test(id)) } },
          { slug: { $in: categories } },
        ]
      }).select('_id')
      
      if (categoryObjects.length > 0) {
        searchQuery.category = { $in: categoryObjects.map(c => c._id) }
      }
    }

    // Filtres par type de contenu
    if (contentTypes && contentTypes.length > 0) {
      searchQuery.contentType = { $in: contentTypes }
    }

    // Filtres par date
    if (dateRange !== 'all') {
      const now = new Date()
      let startDate: Date

      switch (dateRange) {
        case 'day':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          break
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          break
        default:
          startDate = new Date(0)
      }

      searchQuery.publishedAt = { $gte: startDate }
    }

    // Configuration du tri
    let sort: any = { score: { $meta: 'textScore' } }

    switch (sortBy) {
      case 'date':
        sort = { publishedAt: -1, score: { $meta: 'textScore' } }
        break
      case 'popularity':
        sort = { 'stats.views': -1, score: { $meta: 'textScore' } }
        break
      case 'relevance':
      default:
        sort = { score: { $meta: 'textScore' }, 'stats.views': -1 }
        break
    }

    // Exécution de la recherche
    const articles = await Article.find(searchQuery)
      .select('title slug excerpt coverImage publishedAt stats.views category author tags contentType')
      .populate('author', 'firstName lastName image')
      .populate('category', 'name slug color')
      .sort(sort)
      .limit(limit)
      .lean()

    // Calculer le score maximum pour la normalisation
    const maxScore = articles.length > 0 ? (articles[0] as any).score || 1 : 1

    // Transformer les résultats
    const results = articles.map((article: any) => ({
      type: 'article' as const,
      id: article._id.toString(),
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      coverImage: article.coverImage,
      category: article.category?.name,
      categorySlug: article.category?.slug,
      categoryColor: article.category?.color,
      author: `${article.author?.firstName} ${article.author?.lastName}`,
      tags: article.tags,
      publishedAt: article.publishedAt,
      views: article.stats?.views || 0,
      contentType: article.contentType,
      score: Math.round((article.score / maxScore) * 100) / 100,
    }))

    // Générer des suggestions basées sur les termes de recherche
    const suggestions: string[] = []
    
    if (results.length === 0) {
      // Suggestions pour les recherches sans résultats
      const suggestionsFromCategories = await Category.find({
        name: { $regex: query, $options: 'i' },
        isActive: true,
      }).select('name').limit(3).lean()
      
      suggestionsFromCategories.forEach(cat => {
        suggestions.push(cat.name)
      })
      
      // Suggestions de termes populaires
      const popularTerms = ['coworking', 'productivité', 'espaces', 'communauté', 'télétravail']
      popularTerms.forEach(term => {
        if (term.toLowerCase().includes(query.toLowerCase()) || 
            query.toLowerCase().includes(term.toLowerCase())) {
          suggestions.push(term)
        }
      })
    } else {
      // Suggestions basées sur les tags des résultats
      const allTags = results.flatMap(r => r.tags || [])
      const tagCounts = allTags.reduce((acc: any, tag: string) => {
        acc[tag] = (acc[tag] || 0) + 1
        return acc
      }, {})
      
      Object.entries(tagCounts)
        .sort(([,a]: any, [,b]: any) => b - a)
        .slice(0, 5)
        .forEach(([tag]) => {
          if (!suggestions.includes(tag) && tag.toLowerCase() !== query.toLowerCase()) {
            suggestions.push(tag)
          }
        })
    }

    const endTime = Date.now()
    const took = endTime - startTime

    const responseData = {
      results,
      suggestions: suggestions.slice(0, 5),
      meta: {
        query,
        total: results.length,
        took,
        maxScore: maxScore,
        filters: {
          categories,
          contentTypes,
          dateRange,
          sortBy,
        },
      },
    }

    return createSuccessResponse(
      responseData,
      `${results.length} résultat${results.length > 1 ? 's' : ''} trouvé${results.length > 1 ? 's' : ''}`
    )

  } catch (error: any) {
    console.error('Erreur lors de la recherche:', error)
    return createErrorResponse(
      'Erreur lors de la recherche',
      500,
      'SEARCH_ERROR',
      process.env.NODE_ENV === 'development' ? error.message : undefined
    )
  }
}