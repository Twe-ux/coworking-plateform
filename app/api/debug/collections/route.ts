import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectMongoose from '@/lib/mongoose'
import mongoose from 'mongoose'

/**
 * GET /api/debug/collections - Debug des collections MongoDB
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const user = session.user as any
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Accès non autorisé - Admin requis' },
        { status: 403 }
      )
    }

    await connectMongoose()

    const db = mongoose.connection.db

    // Lister toutes les collections
    const collections = await db.listCollections().toArray()

    const debug = {
      collections: collections.map((c) => c.name),
      connectionState: mongoose.connection.readyState,
      dbName: db.databaseName,
    }

    // Vérifier quelques collections importantes
    for (const collectionName of ['bookings', 'users', 'spaces']) {
      try {
        const collection = db.collection(collectionName)
        const count = await collection.countDocuments()
        const sample = await collection.findOne({})

        debug[`${collectionName}_info`] = {
          count,
          sampleDocument: sample
            ? {
                _id: sample._id,
                keys: Object.keys(sample),
                ...(sample.date && { date: sample.date }),
                ...(sample.status && { status: sample.status }),
                ...(sample.totalPrice && { totalPrice: sample.totalPrice }),
              }
            : null,
        }
      } catch (error) {
        debug[`${collectionName}_info`] = { error: 'Collection non trouvée' }
      }
    }

    return NextResponse.json({
      success: true,
      debug,
    })
  } catch (error) {
    console.error('Erreur API debug collections:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Erreur serveur interne',
      },
      { status: 500 }
    )
  }
}
