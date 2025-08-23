import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { pusherServer } from '../../../lib/pusher'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Vérifier l'authentification de l'utilisateur
    const session = await getServerSession(req, res, authOptions)
    
    if (!session?.user?.email) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const { socket_id, channel_name } = req.body

    if (!socket_id || !channel_name) {
      return res.status(400).json({ message: 'Missing socket_id or channel_name' })
    }

    // Données de présence pour les canaux presence-*
    const presenceData = {
      user_id: session.user.id,
      user_info: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        isOnline: true,
        lastActive: new Date().toISOString(),
      },
    }

    // Autoriser le canal
    let authResponse
    
    if (channel_name.startsWith('presence-')) {
      // Canal de présence
      authResponse = pusherServer.authorizeChannel(
        socket_id,
        channel_name,
        presenceData
      )
    } else if (channel_name.startsWith('private-')) {
      // Canal privé - vérifier les permissions
      const channelId = channel_name.replace('private-channel-', '')
      const userChannelPattern = `private-user-${session.user.id}`
      
      // Autoriser si c'est le canal personnel de l'utilisateur
      if (channel_name === userChannelPattern) {
        authResponse = pusherServer.authorizeChannel(socket_id, channel_name)
      } else {
        // TODO: Vérifier si l'utilisateur est membre du canal
        // Pour l'instant, on autorise tous les canaux privés
        authResponse = pusherServer.authorizeChannel(socket_id, channel_name)
      }
    } else {
      // Canal public
      authResponse = pusherServer.authorizeChannel(socket_id, channel_name)
    }

    return res.status(200).json(authResponse)
  } catch (error) {
    console.error('Erreur authentification Pusher:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}