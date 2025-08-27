import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectMongoose } from '@/lib/mongoose'
import { getCached, setCache } from '@/lib/cache'
import mongoose from 'mongoose'

export async function GET(request: NextRequest) {
  try {
    // Vérification de session
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non authentifié', message: 'Session requise' },
        { status: 401 }
      )
    }

    // Vérifier le cache d'abord (60 secondes de cache pour les utilisateurs)
    const cacheKey = `users:${session.user.email}`
    const cached = getCached(cacheKey, 60000)
    if (cached) {
      console.log('💾 Utilisateurs depuis le cache')
      return NextResponse.json(cached)
    }

    // Connexion DB
    await connectMongoose()

    // Récupérer tous les utilisateurs sauf l'utilisateur actuel
    const db = mongoose.connection.db
    if (!db) {
      throw new Error('Database connection not established')
    }
    const usersCollection = db.collection('users')

    const users = await usersCollection
      .find({
        email: { $ne: session.user.email },
        isActive: { $ne: false },
      })
      .toArray()

    const formattedUsers = users.map((user) => {
      const displayName =
        user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : user.name || user.email || 'Utilisateur'

      return {
        _id: user._id,
        name: displayName,
        email: user.email,
        role: user.role,
        avatar: user.avatar || null,
        firstName: user.firstName,
        lastName: user.lastName,
        isOnline: user.isOnline || false,
        bio: user.bio || null,
        profession: user.profession || null,
        company: user.company || null,
        website: user.website || null,
        phone: user.phone || null,
        location: user.location || null,
      }
    })

    const result = {
      success: true,
      users: formattedUsers,
    }

    // Mettre en cache la réponse
    setCache(cacheKey, result)

    return NextResponse.json(result)
  } catch (error) {
    console.error('❌ Erreur récupération utilisateurs:', error)
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
