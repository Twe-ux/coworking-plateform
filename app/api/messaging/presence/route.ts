import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectMongoose } from '@/lib/mongoose'
import { getCached, setCache } from '@/lib/cache'
import mongoose from 'mongoose'

export async function POST(request: NextRequest) {
  try {
    // Vérification de session
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié', message: 'Session requise' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { status } = body

    if (!['online', 'offline'].includes(status)) {
      return NextResponse.json(
        { error: 'Statut invalide', message: 'Le statut doit être "online" ou "offline"' },
        { status: 400 }
      )
    }

    // Connexion DB
    await connectMongoose()

    // Mettre à jour le statut de l'utilisateur
    const db = mongoose.connection.db
    if (!db) {
      throw new Error('Database connection not established')
    }
    
    const usersCollection = db.collection('users')
    const updateResult = await usersCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(session.user.id) },
      { 
        $set: { 
          isOnline: status === 'online',
          lastActive: new Date()
        }
      }
    )

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    console.log(`✅ Statut mis à jour pour ${session.user.email}: ${status}`)

    // Invalider le cache lors de la mise à jour
    const cacheKey = `presence:${session.user.id}`
    setCache(cacheKey, null, 0) // Invalider immédiatement

    return NextResponse.json({
      success: true,
      status: status,
      message: `Statut mis à jour: ${status}`,
      userId: session.user.id
    })

  } catch (error) {
    console.error('❌ Erreur mise à jour statut présence:', error)
    return NextResponse.json(
      {
        error: 'Erreur serveur',
        message: (error as any).message,
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Vérification de session
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Vérifier le cache d'abord (5 secondes de cache)
    const cacheKey = `presence:${session.user.id}`
    const cached = getCached(cacheKey, 5000)
    if (cached) {
      console.log('💾 Présence depuis le cache')
      return NextResponse.json(cached)
    }

    // Connexion DB
    await connectMongoose()

    const db = mongoose.connection.db
    if (!db) {
      throw new Error('Database connection not established')
    }
    
    const usersCollection = db.collection('users')
    
    // Récupérer le statut actuel
    const user = await usersCollection.findOne(
      { _id: new mongoose.Types.ObjectId(session.user.id) },
      { projection: { isOnline: 1, lastActive: 1 } }
    )

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    const result = {
      success: true,
      isOnline: user.isOnline || false,
      lastActive: user.lastActive
    }

    // Mettre en cache la réponse
    setCache(cacheKey, result)

    return NextResponse.json(result)

  } catch (error) {
    console.error('❌ Erreur récupération statut présence:', error)
    return NextResponse.json(
      {
        error: 'Erreur serveur',
        message: (error as any).message,
      },
      { status: 500 }
    )
  }
}

// Force Node.js runtime for database compatibility
export const runtime = 'nodejs'