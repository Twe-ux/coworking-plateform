import Pusher from 'pusher'
import PusherClient from 'pusher-js'

// Configuration Pusher côté serveur
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER || 'eu',
  useTLS: true,
})

// Configuration Pusher côté client
export const pusherClient = new PusherClient(
  process.env.NEXT_PUBLIC_PUSHER_KEY!,
  {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'eu',
    authEndpoint: '/api/pusher/auth',
    auth: {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    },
  }
)

// Types pour les événements Pusher
export interface PusherMessage {
  id: string
  content: string
  messageType: 'text' | 'image' | 'file' | 'system' | 'ai_response'
  sender: {
    id: string
    name: string
    firstName?: string
    lastName?: string
    email: string
    image?: string
  }
  channel: string
  createdAt: string
  updatedAt: string
  attachments?: Array<{
    url: string
    type: 'image' | 'file'
    filename: string
    size: number
    mimeType: string
  }>
  reactions?: Array<{
    emoji: string
    users: string[]
    count: number
  }>
  readBy?: Array<{
    user: string
    readAt: string
  }>
  parentMessageId?: string
  mentions?: string[]
}

export interface PusherUserPresence {
  id: string
  name: string
  email: string
  image?: string
  isOnline: boolean
  lastActive: string
  status: 'online' | 'away' | 'busy' | 'offline'
}

export interface PusherTyping {
  userId: string
  userName: string
  channelId: string
  isTyping: boolean
}

// Événements Pusher
export const PUSHER_EVENTS = {
  MESSAGE_SENT: 'message-sent',
  MESSAGE_UPDATED: 'message-updated',
  MESSAGE_DELETED: 'message-deleted',
  USER_JOINED: 'user-joined',
  USER_LEFT: 'user-left',
  USER_TYPING: 'user-typing',
  USER_STOP_TYPING: 'user-stop-typing',
  USER_PRESENCE: 'user-presence',
  CHANNEL_UPDATED: 'channel-updated',
  NOTIFICATION: 'notification',
} as const

// Channels Pusher
export const PUSHER_CHANNELS = {
  PRESENCE: 'presence-coworking',
  PRIVATE: (channelId: string) => `private-channel-${channelId}`,
  PUBLIC: (channelId: string) => `channel-${channelId}`,
  USER: (userId: string) => `private-user-${userId}`,
} as const

// Utilitaires Pusher
export const triggerPusherEvent = async (
  channel: string,
  event: string,
  data: any
) => {
  try {
    await pusherServer.trigger(channel, event, data)
  } catch (error) {
    console.error('Erreur Pusher:', error)
    throw error
  }
}

export const triggerPusherBatch = async (
  batch: Array<{
    channel: string
    name: string
    data: any
  }>
) => {
  try {
    await pusherServer.triggerBatch(batch)
  } catch (error) {
    console.error('Erreur Pusher batch:', error)
    throw error
  }
}

// Hook pour l'authentification Pusher
export const authenticatePusherUser = (socketId: string, userId: string) => {
  const presenceData = {
    user_id: userId,
    user_info: {
      id: userId,
    },
  }

  return pusherServer.authenticateUser(socketId, presenceData)
}

// Hook pour autoriser les canaux privés
export const authorizePusherChannel = (
  socketId: string,
  channel: string,
  presenceData?: any
) => {
  if (channel.startsWith('presence-')) {
    return pusherServer.authorizeChannel(socketId, channel, presenceData)
  }
  
  return pusherServer.authorizeChannel(socketId, channel)
}