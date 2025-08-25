import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectMongoose } from '@/lib/mongoose'
import mongoose from 'mongoose'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    await connectMongoose()
    const db = mongoose.connection.db
    if (!db) {
      throw new Error('Database connection not established')
    }
    const messagesCollection = db.collection('messages')
    const channelsCollection = db.collection('channels')

    // Récupérer tous les channels où l'utilisateur est membre
    const userChannels = await channelsCollection
      .find({
        'members.user': new mongoose.Types.ObjectId(session.user.id),
        isActive: { $ne: false },
      })
      .toArray()

    const channelIds = userChannels.map((ch) => ch._id)

    // Compter les messages non lus par channel
    const unreadByChannel = await messagesCollection
      .aggregate([
        {
          $match: {
            channel: { $in: channelIds },
            sender: { $ne: new mongoose.Types.ObjectId(session.user.id) }, // Pas mes messages
            'readBy.user': {
              $ne: new mongoose.Types.ObjectId(session.user.id),
            }, // Pas encore lu
            isDeleted: { $ne: true },
          },
        },
        {
          $group: {
            _id: '$channel',
            count: { $sum: 1 },
          },
        },
      ])
      .toArray()

    // Construire le breakdown par channel
    const channelBreakdown: Record<string, number> = {}
    let messagesDMs = 0
    let channelsCount = 0

    unreadByChannel.forEach((result) => {
      const channelId = result._id.toString()
      const count = result.count

      channelBreakdown[channelId] = count

      // Trouver le type de channel
      const channel = userChannels.find((ch) => ch._id.toString() === channelId)
      if (channel?.type === 'direct' || channel?.type === 'dm') {
        messagesDMs += count
      } else {
        channelsCount += count
      }
    })

    const totalUnread = messagesDMs + channelsCount

    return NextResponse.json({
      success: true,
      counts: {
        totalUnread,
        messagesDMs,
        channels: channelsCount,
        channelBreakdown,
      },
    })
  } catch (error) {
    console.error('Erreur compteurs notifications:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
