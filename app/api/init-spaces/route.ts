import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { insertDefaultSpaces } from '@/lib/models/space'

/**
 * POST /api/init-spaces
 * Initialise les espaces par défaut dans la base de données
 */
export async function POST() {
  try {
    // Vérifier l'authentification admin (optionnel pour le dev)
    const session = await getServerSession(authOptions)
    
    // En développement, permettre l'initialisation sans auth
    if (process.env.NODE_ENV === 'production' && (!session?.user || session.user.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 401 }
      )
    }

    console.log('🔄 Initialisation des espaces par défaut...')
    
    const result = await insertDefaultSpaces()
    
    console.log('✅ Espaces initialisés avec succès:', result)
    
    return NextResponse.json({
      message: 'Espaces initialisés avec succès',
      spaces: result
    })
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation des espaces:', error)
    
    return NextResponse.json(
      { 
        error: 'Erreur lors de l\'initialisation des espaces',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}