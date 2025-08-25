import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db/mongoose'
import { User } from '@/lib/models/user'
import { triggerPusherEvent, PUSHER_CHANNELS, PUSHER_EVENTS } from '@/lib/pusher'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Vérifier l'authentification
    const session = await getServerSession(req, res, authOptions)
    if (!session?.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    await connectToDatabase()

    const { status = 'online' } = req.body
    const isOnline = status === 'online'

    // Mettre à jour le statut utilisateur
    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      {
        isOnline,
        lastActive: new Date(),
      },
      { new: true }
    ).select('_id name firstName lastName email image isOnline lastActive')

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' })
    }

    console.log(`👤 User ${updatedUser.email} set to ${status}`)

    // Diffuser le changement de statut via Pusher (optionnel)
    try {
      const userName = updatedUser.firstName && updatedUser.lastName 
        ? `${updatedUser.firstName} ${updatedUser.lastName}`
        : updatedUser.name

      // Broadcast to presence channel (this will be handled automatically by Pusher presence)
      // But we can also send a custom event for immediate updates
      await triggerPusherEvent(
        'presence-coworking', // Global presence channel
        PUSHER_EVENTS.USER_PRESENCE,
        {
          userId: updatedUser._id.toString(),
          userName,
          status: isOnline ? 'online' : 'offline',
          lastSeen: updatedUser.lastActive,
        }
      )

      console.log(`📢 Pusher event sent: ${status} for ${userName}`)
    } catch (pusherError) {
      console.error('❌ Pusher broadcast error:', pusherError)
      // Continue même si Pusher échoue
    }

    return res.status(200).json({
      success: true,
      user: {
        _id: updatedUser._id.toString(),
        name: updatedUser.firstName && updatedUser.lastName 
          ? `${updatedUser.firstName} ${updatedUser.lastName}`
          : updatedUser.name,
        email: updatedUser.email,
        image: updatedUser.image,
        isOnline: updatedUser.isOnline,
        lastActive: updatedUser.lastActive
      }
    })

  } catch (error) {
    console.error('Erreur API set-online:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}