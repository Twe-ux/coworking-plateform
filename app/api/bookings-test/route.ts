import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

/**
 * POST /api/bookings-test - Créer une réservation test
 * Version simplifiée sans authentification pour les tests
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Test de création de réservation...')

    const body = await request.json()

    // Validation basique
    const {
      spaceId,
      date,
      startTime,
      endTime,
      duration,
      durationType,
      guests,
    } = body

    if (!spaceId || !date || !startTime || !endTime) {
      return NextResponse.json(
        {
          error:
            'Données manquantes: spaceId, date, startTime, endTime sont requis',
        },
        { status: 400 }
      )
    }

    const { db } = await connectToDatabase()

    // Vérifier que l'espace existe
    const spacesCollection = db.collection('spaces')
    const space = await spacesCollection.findOne({ id: spaceId })

    if (!space) {
      return NextResponse.json(
        { error: `Espace non trouvé: ${spaceId}` },
        { status: 404 }
      )
    }

    // Calculer le prix total basique
    const hours = duration || 2
    const totalPrice = space.pricePerHour * hours

    // Créer un utilisateur test
    const testUserId = new ObjectId()

    // Créer la réservation
    const booking = {
      userId: testUserId,
      spaceId: new ObjectId(space._id),
      spaceName: space.name, // Pour faciliter les requêtes
      date: new Date(date),
      startTime,
      endTime,
      duration: duration || 2,
      durationType: durationType || 'hour',
      guests: guests || 1,
      totalPrice,
      status: 'confirmed', // Directement confirmé pour les tests
      notes: 'Réservation de test',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    console.log('📝 Création de la réservation:', booking)

    const bookingsCollection = db.collection('bookings')
    const result = await bookingsCollection.insertOne(booking)

    if (!result.insertedId) {
      throw new Error("Erreur lors de l'insertion de la réservation")
    }

    console.log(`✅ Réservation créée avec l'ID: ${result.insertedId}`)

    return NextResponse.json({
      message: 'Réservation de test créée avec succès',
      booking: {
        ...booking,
        _id: result.insertedId,
      },
    })
  } catch (error) {
    console.error(
      '❌ Erreur lors de la création de la réservation test:',
      error
    )

    return NextResponse.json(
      {
        error: 'Erreur lors de la création de la réservation',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/bookings-test - Liste des réservations test
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Récupération des réservations test...')

    const { db } = await connectToDatabase()
    const bookingsCollection = db.collection('bookings')

    // Récupérer toutes les réservations
    const bookings = await bookingsCollection
      .find()
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray()

    console.log(`✅ ${bookings.length} réservation(s) trouvée(s)`)

    return NextResponse.json({
      bookings,
      total: bookings.length,
    })
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des réservations:', error)

    return NextResponse.json(
      {
        error: 'Erreur lors de la récupération des réservations',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    )
  }
}
