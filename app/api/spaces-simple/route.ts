import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'

/**
 * GET /api/spaces-simple - Liste publique des espaces disponibles
 * Version simplifiée sans validation Zod
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Récupération des espaces...')
    
    const { db } = await connectToDatabase()
    const spacesCollection = db.collection('spaces')
    
    // Parser les query parameters de base
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    const available = searchParams.get('available')
    const popular = searchParams.get('popular')
    
    // Construire le filtre
    const filter: any = {}
    
    if (available === 'true') {
      filter.available = true
    }
    
    if (popular === 'true') {
      filter.isPopular = true
    }
    
    console.log('🔍 Filtre appliqué:', filter)
    
    // Récupérer les espaces avec pagination
    const spaces = await spacesCollection
      .find(filter)
      .sort({ isPopular: -1, rating: -1 }) // Populaires en premier, puis par note
      .skip(offset)
      .limit(Math.min(limit, 50)) // Limiter à 50 max
      .toArray()
    
    // Compter le total pour la pagination
    const total = await spacesCollection.countDocuments(filter)
    
    console.log(`✅ ${spaces.length} espace(s) trouvé(s) sur ${total} total`)
    
    return NextResponse.json({
      spaces,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des espaces:', error)
    
    return NextResponse.json(
      { 
        error: 'Erreur lors de la récupération des espaces',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}