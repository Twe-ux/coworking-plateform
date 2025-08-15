/**
 * Endpoint de debug pour la création d'articles
 * Simule la création sans vraiment sauvegarder
 */

import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('🐛 Debug - Données d\'article reçues:', JSON.stringify(body, null, 2))
    
    // Simulation d'une création réussie
    const mockArticle = {
      _id: "debug_article_" + Date.now(),
      ...body,
      author: {
        _id: "689377c667fd70e1283b0377",
        firstName: "Debug",
        lastName: "User",
        email: "debug@example.com"
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      slug: body.slug || body.title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
    }
    
    console.log('🐛 Debug - Article simulé créé:', mockArticle)
    
    return Response.json({
      success: true,
      data: mockArticle,
      message: "Article créé avec succès (mode debug)",
      meta: { slug: mockArticle.slug }
    })
    
  } catch (error: any) {
    console.error('🐛 Debug - Erreur:', error)
    return Response.json({
      success: false,
      error: error.message || 'Erreur inconnue',
      timestamp: new Date().toISOString()
    }, { status: 400 })
  }
}