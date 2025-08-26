import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectMongoose } from '@/lib/mongoose'
import mongoose from 'mongoose'

export async function POST(request: NextRequest) {
  try {
    console.log('📨 API envoi message...')

    const session = await getServerSession(authOptions)
    console.log('📋 Session:', session?.user?.email || 'Aucune session')

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non authentifié', message: 'Session requise' },
        { status: 401 }
      )
    }

    await connectMongoose()

    const body = await request.json()
    console.log('📦 Données reçues:', body)

    const { channelId, content, messageType = 'text', attachments = [] } = body

    if (!channelId || !content?.trim()) {
      return NextResponse.json(
        { error: 'Validation', message: 'Channel ID et contenu requis' },
        { status: 400 }
      )
    }

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
        { error: 'Accès refusé', message: 'Vous n\'êtes pas membre de ce channel' },
        { status: 403 }
      )
    }

    const newMessage = {
      content: content.trim(),
      messageType,
      sender: user._id,
      channel: new mongoose.Types.ObjectId(channelId),
      attachments,
      reactions: [],
      readBy: [{ user: user._id, readAt: new Date() }],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const messageResult = await messagesCollection.insertOne(newMessage)

    await channelsCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(channelId) },
      { 
        $set: { lastActivity: new Date() },
        $inc: { messageCount: 1 }
      }
    )

    const messageWithSender = {
      ...newMessage,
      _id: messageResult.insertedId,
      sender: {
        _id: user._id,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        email: user.email
      }
    }

    console.log('✅ Message créé:', messageResult.insertedId)

    return NextResponse.json({
      success: true,
      message: messageWithSender
    })

  } catch (error) {
    console.error('❌ Erreur envoi message:', error)
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