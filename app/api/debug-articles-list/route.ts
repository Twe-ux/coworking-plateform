/**
 * Endpoint de debug pour la liste des articles
 */

import { NextRequest } from 'next/server'

const mockArticles = [
  {
    id: "debug_article_1",
    title: "Premier Article de Test",
    slug: "premier-article-test",
    excerpt: "Ceci est le premier article de test pour vérifier le fonctionnement du système.",
    status: "published" as const,
    contentType: "article" as const,
    featured: false,
    authorName: "Debug User",
    category: {
      id: "689e3f4a0b44c16071e05f1d",
      name: "Général",
      color: "#6B7280"
    },
    tags: ["test", "debug"],
    viewsCount: 42,
    commentsCount: 3,
    publishedAt: new Date(Date.now() - 86400000).toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: "debug_article_2", 
    title: "Guide du Coworking",
    slug: "guide-coworking",
    excerpt: "Tout ce que vous devez savoir sur le coworking pour bien commencer.",
    status: "published" as const,
    contentType: "tutorial" as const,
    featured: true,
    authorName: "Debug Admin",
    category: {
      id: "689e3f4b0b44c16071e05f20",
      name: "Coworking",
      color: "#3B82F6"
    },
    tags: ["coworking", "guide"],
    viewsCount: 156,
    commentsCount: 12,
    publishedAt: new Date(Date.now() - 172800000).toISOString(),
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 172800000).toISOString()
  },
  {
    id: "debug_article_3",
    title: "Brouillon en Cours",
    slug: "brouillon-en-cours",
    excerpt: "Cet article est encore en cours de rédaction.",
    status: "draft" as const,
    contentType: "article" as const,
    featured: false,
    authorName: "Debug User",
    category: {
      id: "689e3f4b0b44c16071e05f23",
      name: "Conseils",
      color: "#10B981"
    },
    tags: ["draft"],
    viewsCount: 0,
    commentsCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    
    // Simulation de la pagination
    const total = mockArticles.length
    const totalPages = Math.ceil(total / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1
    
    console.log('🐛 Debug - Liste des articles demandée:', { page, limit })
    
    return Response.json({
      success: true,
      data: mockArticles,
      message: "Articles récupérés avec succès (mode debug)",
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('🐛 Debug - Erreur liste articles:', error)
    return Response.json({
      success: false,
      error: error.message || 'Erreur inconnue',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}