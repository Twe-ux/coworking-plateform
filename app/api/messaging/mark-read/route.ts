import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectMongoose } from '@/lib/mongoose'
import mongoose from 'mongoose'

export async function POST(request: NextRequest) {
  try {
    console.log('👁️ API marquer messages comme lus...')

    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { channelId, messageIds } = body

    console.log('📋 Paramètres:', { channelId, messageIds })

    if (!channelId) {
      return NextResponse.json(
        { error: 'Channel ID requis' },
        { status: 400 }
      )
    }

    await connectMongoose()

    const db = mongoose.connection.db
    if (!db) {
      throw new Error('Database connection not established')
    }

    const messagesCollection = db.collection('messages')
    const usersCollection = db.collection('users')

    const user = await usersCollection.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    let updateQuery: any = {
      channel: new mongoose.Types.ObjectId(channelId),
      'readBy.user': { $ne: user._id }
    }

    // Si des messageIds spécifiques sont fournis, les utiliser
    if (messageIds && messageIds.length > 0) {
      updateQuery._id = { 
        $in: messageIds.map((id: string) => new mongoose.Types.ObjectId(id)) 
      }
    }

    const result = await messagesCollection.updateMany(
      updateQuery,
      {
        $push: {
          readBy: {
            user: user._id,
            readAt: new Date()
          }
        }
      }
    )

    console.log('✅ Messages marqués comme lus:', result.modifiedCount)

    return NextResponse.json({
      success: true,
      markedCount: result.modifiedCount
    })

  } catch (error) {
    console.error('❌ Erreur marquer messages lus:', error)
    return NextResponse.json(
      {
        error: 'Erreur serveur',
        message: (error as any).message,
      },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'