import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { Space, Booking } from '@/lib/models'
import { checkBookingConflicts, getAvailableTimeSlots } from '@/lib/mongodb-utils'

/**
 * API de test pour vérifier les modèles MongoDB
 * GET /api/test/models - Teste la connexion et les modèles
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Test des modèles MongoDB...')

    // Test de connexion
    await connectToDatabase()
    console.log('✅ Connexion MongoDB OK')

    // Test du modèle Space
    const spacesCount = await Space.countDocuments()
    console.log(`📊 Nombre d'espaces en BD: ${spacesCount}`)

    const spaces = await Space.find({}).limit(3)
    console.log(`📋 Espaces trouvés: ${spaces.length}`)

    // Test du modèle Booking
    const bookingsCount = await Booking.countDocuments()
    console.log(`📊 Nombre de réservations en BD: ${bookingsCount}`)

    // Test des fonctions utilitaires avec un espace existant
    let testResults = {}
    if (spaces.length > 0) {
      const testSpace = spaces[0]
      const testDate = new Date()
      testDate.setHours(24, 0, 0, 0) // Demain

      console.log(`🧪 Test avec l'espace: ${testSpace.name}`)

      // Test des créneaux disponibles
      try {
        const timeSlots = await getAvailableTimeSlots(testSpace._id, testDate)
        console.log(`⏰ Créneaux trouvés: ${timeSlots.length}`)
        
        testResults = {
          ...testResults,
          timeSlotsCount: timeSlots.length,
          sampleTimeSlots: timeSlots.slice(0, 3)
        }
      } catch (error) {
        console.error('❌ Erreur test créneaux:', error)
      }

      // Test de détection de conflit (normalement aucun conflit)
      try {
        const conflicts = await checkBookingConflicts(
          testSpace._id,
          testDate,
          '09:00',
          '10:00'
        )
        console.log(`⚡ Conflits détectés: ${conflicts.length}`)
        
        testResults = {
          ...testResults,
          conflictsCount: conflicts.length
        }
      } catch (error) {
        console.error('❌ Erreur test conflits:', error)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Tests des modèles réussis',
      data: {
        connection: 'OK',
        spacesCount,
        bookingsCount,
        sampleSpaces: spaces.map(s => ({
          id: s.id,
          name: s.name,
          specialty: s.specialty,
          capacity: s.capacity,
          available: s.available
        })),
        testResults
      }
    })

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error)
    
    return NextResponse.json(
      {
        success: false,
        message: 'Erreur lors des tests des modèles',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}