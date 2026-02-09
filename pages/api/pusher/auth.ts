import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { pusherServer } from '../../../lib/pusher'

// Configuration pour Next.js API
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    console.log('🔍 Auth request received')
    console.log('🔍 Content-Type:', req.headers['content-type'])
    console.log('🔍 Request body:', req.body)

    // Vérifier l'authentification de l'utilisateur
    const session = await getServerSession(req, res, authOptions)
    
    if (!session?.user?.email) {
      console.error('❌ No user session found')
      return res.status(401).json({ message: 'Unauthorized' })
    }

    console.log('👤 User authenticated:', session.user.email)

    // Pusher peut envoyer via JSON ou form-encoded
    let socket_id = req.body.socket_id
    let channel_name = req.body.channel_name

    // Si les données ne sont pas présentes, essayer de parser comme form-data
    if (!socket_id || !channel_name) {
      console.log('🔍 Trying to parse as form data...')
      // Les données peuvent être dans le corps en format x-www-form-urlencoded
      if (typeof req.body === 'string') {
        const params = new URLSearchParams(req.body)
        socket_id = params.get('socket_id')
        channel_name = params.get('channel_name')
      }
    }

    if (!socket_id || !channel_name) {
      console.error('❌ Missing auth data after parsing:', { socket_id, channel_name })
      return res.status(400).json({ message: 'Missing socket_id or channel_name' })
    }

    console.log('🔐 Authorizing channel:', channel_name, 'for user:', session.user.email)

    // Données de présence pour les canaux presence-*
    const presenceData = {
      user_id: session.user.id,
      user_info: {
        id: session.user.id,
        name: session.user.firstName && session.user.lastName 
          ? `${session.user.firstName} ${session.user.lastName}`
          : session.user.name,
        email: session.user.email,
        image: session.user.image,
        isOnline: true,
        lastActive: new Date().toISOString(),
      },
    }

    console.log('👤 Presence data:', presenceData)

    // Autoriser le canal
    let authResponse
    
    if (channel_name.startsWith('presence-')) {
      console.log('🏢 Authorizing presence channel with data:', presenceData)
      // Canal de présence - OBLIGATOIRE pour la gestion des utilisateurs en ligne
      authResponse = pusherServer.authorizeChannel(
        socket_id,
        channel_name,
        presenceData
      )
    } else if (channel_name.startsWith('private-')) {
      console.log('🔒 Authorizing private channel')
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
      console.log('🌐 Authorizing public channel')
      // Canal public
      authResponse = pusherServer.authorizeChannel(socket_id, channel_name)
    }

    console.log('✅ Channel authorized successfully')

    return res.status(200).json(authResponse)
  } catch (error) {
    console.error('Erreur authentification Pusher:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}