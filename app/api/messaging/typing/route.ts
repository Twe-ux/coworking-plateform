import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectMongoose } from '@/lib/mongoose'
import { getCached, setCache } from '@/lib/cache'
import mongoose from 'mongoose'

// Store temporaire des indicateurs de frappe (en production, utiliser Redis)
const typingIndicators = new Map<string, { userId: string, userName: string, timestamp: number }>()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const { channelId, isTyping } = body

    if (!channelId) {
      return NextResponse.json({ error: 'Channel ID requis' }, { status: 400 })
    }

    await connectMongoose()
    const db = mongoose.connection.db
    const usersCollection = db.collection('users')

    const user = await usersCollection.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    const key = `${channelId}-${user._id.toString()}`
    
    if (isTyping) {
      // Marquer l'utilisateur comme en train d'écrire
      typingIndicators.set(key, {
        userId: user._id.toString(),
        userName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.name,
        timestamp: Date.now()
      })
    } else {
      // Supprimer l'indicateur de frappe
      typingIndicators.delete(key)
    }

    console.log('👤 Typing indicator:', { channelId, userId: user._id.toString(), isTyping })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('❌ Erreur typing indicator:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', message: (error as any).message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const url = new URL(request.url)
    const channelId = url.searchParams.get('channelId')

    if (!channelId) {
      return NextResponse.json({ error: 'Channel ID requis' }, { status: 400 })
    }

    // Vérifier le cache d'abord (2 secondes de cache pour les indicateurs de frappe)
    const cacheKey = `typing-users:${channelId}:${session.user.email}`
    const cached = getCached(cacheKey, 2000)
    if (cached) {
      console.log('💾 Typing users depuis le cache')
      return NextResponse.json(cached)
    }

    await connectMongoose()
    const db = mongoose.connection.db
    const usersCollection = db.collection('users')

    const user = await usersCollection.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    const currentTime = Date.now()
    const typingUsers = []

    // Nettoyer les indicateurs expirés (plus de 5 secondes)
    for (const [key, indicator] of typingIndicators.entries()) {
      if (currentTime - indicator.timestamp > 5000) {
        typingIndicators.delete(key)
      } else if (key.startsWith(`${channelId}-`) && indicator.userId !== user._id.toString()) {
        // Seulement les autres utilisateurs qui écrivent dans ce channel
        typingUsers.push(indicator.userName)
      }
    }

    const result = { 
      success: true, 
      typingUsers 
    }

    // Mettre en cache la réponse (courte durée pour les indicateurs temps réel)
    setCache(cacheKey, result)

    return NextResponse.json(result)

  } catch (error) {
    console.error('❌ Erreur get typing indicators:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', message: (error as any).message },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'