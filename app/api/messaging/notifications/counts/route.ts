import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectMongoose } from '@/lib/mongoose'
import { getCached, setCache } from '@/lib/cache'
import mongoose from 'mongoose'

export async function GET(request: NextRequest) {
  try {
    console.log('📊 API compteurs notifications...')

    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Vérifier le cache d'abord (10 secondes de cache)
    const cacheKey = `notification-counts:${session.user.email}`
    const cached = getCached(cacheKey, 10000)
    if (cached) {
      console.log('💾 Compteurs notifications depuis le cache')
      return NextResponse.json(cached)
    }

    await connectMongoose()

    const db = mongoose.connection.db
    if (!db) {
      throw new Error('Database connection not established')
    }

    const messagesCollection = db.collection('messages')
    const channelsCollection = db.collection('channels')
    const usersCollection = db.collection('users')

    const user = await usersCollection.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Trouver tous les channels dont l'utilisateur est membre
    const userChannels = await channelsCollection
      .find({
        'members.user': user._id,
        isDeleted: { $ne: true }
      })
      .toArray()

    const channelIds = userChannels.map(channel => channel._id)

    // Compter les messages non lus dans chaque channel
    const unreadByChannel = await messagesCollection
      .aggregate([
        {
          $match: {
            channel: { $in: channelIds },
            'readBy.user': { $ne: user._id },
            sender: { $ne: user._id } // Ne pas compter ses propres messages
          }
        },
        {
          $group: {
            _id: '$channel',
            count: { $sum: 1 }
          }
        }
      ])
      .toArray()

    // Construire le breakdown par channel
    const channelBreakdown: Record<string, number> = {}
    let totalDMs = 0
    let totalChannels = 0

    unreadByChannel.forEach(item => {
      const channelId = item._id.toString()
      const count = item.count
      
      channelBreakdown[channelId] = count

      // Trouver le type de channel
      const channel = userChannels.find(c => c._id.toString() === channelId)
      if (channel) {
        if (channel.type === 'direct') {
          totalDMs += count
        } else {
          totalChannels += count
        }
      }
    })

    const totalUnread = totalDMs + totalChannels

    const counts = {
      totalUnread,
      messagesDMs: totalDMs,
      channels: totalChannels,
      channelBreakdown
    }

    console.log('📊 Compteurs calculés:', counts)

    const result = {
      success: true,
      counts
    }

    // Mettre en cache la réponse
    setCache(cacheKey, result)

    return NextResponse.json(result)

  } catch (error) {
    console.error('❌ Erreur compteurs notifications:', error)
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