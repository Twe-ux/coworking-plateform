import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { UserRole } from '@/types/auth'
import dbConnect from '@/lib/mongodb'
import Space, { insertDefaultSpaces } from '@/lib/models/space'

/**
 * API pour initialiser les espaces par défaut
 */
export async function POST() {
  try {
    // Vérifier l'authentification et les permissions admin
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Accès refusé - Permissions administrateur requises' },
        { status: 403 }
      )
    }

    await dbConnect()

    // Vérifier s'il y a déjà des espaces
    const existingSpacesCount = await Space.countDocuments()
    
    if (existingSpacesCount > 0) {
      return NextResponse.json({
        success: false,
        message: 'Des espaces existent déjà dans la base de données',
        existingCount: existingSpacesCount
      })
    }

    // Insérer les espaces par défaut
    await insertDefaultSpaces()

    // Compter les espaces créés
    const createdSpacesCount = await Space.countDocuments()

    return NextResponse.json({
      success: true,
      message: 'Espaces par défaut initialisés avec succès',
      createdCount: createdSpacesCount
    })

  } catch (error: any) {
    console.error('❌ Erreur initialisation espaces:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de l\'initialisation des espaces',
        details: error.message 
      },
      { status: 500 }
    )
  }
}