import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectMongoose } from '@/lib/mongoose'
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

    // Connexion DB
    await connectMongoose()

    // Récupérer tous les utilisateurs sauf l'utilisateur actuel
    const db = mongoose.connection.db
    const usersCollection = db.collection('users')

    const users = await usersCollection.find({
      email: { $ne: session.user.email },
      isActive: { $ne: false }
    }).toArray()

    const formattedUsers = users.map(user => {
      const displayName = (user.firstName && user.lastName) 
        ? `${user.firstName} ${user.lastName}`
        : user.name || user.email || 'Utilisateur'
        
      return {
        _id: user._id,
        name: displayName,
        email: user.email,
        role: user.role,
        avatar: user.avatar || null,
        isOnline: false // TODO: Implémenter le statut en ligne
      }
    })

    return NextResponse.json({
      success: true,
      users: formattedUsers
    })

  } catch (error) {
    console.error('❌ Erreur récupération utilisateurs:', error)
    return NextResponse.json(
      { 
        error: 'Erreur serveur', 
        message: error.message
      },
      { status: 500 }
    )
  }
}