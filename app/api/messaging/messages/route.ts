import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectMongoose } from '@/lib/mongoose'
import mongoose from 'mongoose'

export async function GET(request: NextRequest) {
  try {
    console.log('📥 API récupération messages...')

    const session = await getServerSession(authOptions)
    console.log('👤 Session:', session?.user?.email)
    
    if (!session?.user) {
      console.log('❌ Pas de session')
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const url = new URL(request.url)
    console.log('🔗 URL complète:', url.toString())
    const channelId = url.searchParams.get('channelId')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100)
    const before = url.searchParams.get('before')

    console.log('📋 Paramètres:', { channelId, limit, before })

    if (!channelId) {
      console.log('❌ Channel ID manquant')
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

    const channelsCollection = db.collection('channels')
    const messagesCollection = db.collection('messages')
    const usersCollection = db.collection('users')

    const user = await usersCollection.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    const channel = await channelsCollection.findOne({
      _id: new mongoose.Types.ObjectId(channelId),
      isDeleted: { $ne: true }
    })

    if (!channel) {
      return NextResponse.json(
        { error: 'Channel non trouvé' },
        { status: 404 }
      )
    }

    const isMember = channel.members?.some((member: any) => 
      member.user.toString() === user._id.toString()
    )

    if (!isMember) {
      return NextResponse.json(
        { error: 'Accès refusé' },
        { status: 403 }
      )
    }

    let query: any = {
      channel: new mongoose.Types.ObjectId(channelId)
    }

    if (before) {
      query.createdAt = { $lt: new Date(before) }
    }

    const messages = await messagesCollection
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray()

    const senderIds = [...new Set(messages.map(msg => msg.sender.toString()))]
    const senders = await usersCollection
      .find({ _id: { $in: senderIds.map(id => new mongoose.Types.ObjectId(id)) } })
      .project({ _id: 1, name: 1, firstName: 1, lastName: 1, avatar: 1, email: 1 })
      .toArray()

    const sendersMap = new Map(senders.map(sender => [sender._id.toString(), sender]))

    const messagesWithSenders = messages
      .map(msg => ({
        ...msg,
        sender: sendersMap.get(msg.sender.toString()) || {
          _id: msg.sender,
          name: 'Utilisateur supprimé',
          email: 'deleted@example.com'
        }
      }))
      .reverse()

    console.log(`✅ ${messagesWithSenders.length} messages récupérés`)

    return NextResponse.json({
      success: true,
      messages: messagesWithSenders,
      hasMore: messages.length === limit
    })

  } catch (error) {
    console.error('❌ Erreur récupération messages:', error)
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