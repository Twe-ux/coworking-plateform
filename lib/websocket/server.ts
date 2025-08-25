import { Server as HTTPServer } from 'http'
import { NextApiRequest } from 'next'
import { Server as SocketIOServer, Socket } from 'socket.io'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Channel } from '@/lib/models/channel'
import { Message } from '@/lib/models/message'
import { User } from '@/lib/models/user'
import { RateLimiterMemory } from 'rate-limiter-flexible'
import { connectToDatabase } from '@/lib/db/mongoose'

export interface SocketData {
  userId: string
  userRole: string
  ipAddress: string
  channels: string[]
}

interface MessageData {
  content: string
  channelId: string
  messageType: 'text' | 'image' | 'file'
  parentMessageId?: string
  mentions?: string[]
  attachments?: {
    url: string
    type: 'image' | 'file'
    filename: string
    size: number
    mimeType: string
  }[]
}

interface TypingData {
  channelId: string
  isTyping: boolean
}

interface ReactionData {
  messageId: string
  emoji: string
  action: 'add' | 'remove'
}

interface ChannelJoinData {
  channelId: string
}

// Rate limiters
const messageLimiter = new RateLimiterMemory({
  points: 30, // 30 messages
  duration: 60, // par minute
})

const connectionLimiter = new RateLimiterMemory({
  points: 5, // 5 connexions simultanées
  duration: 300, // par 5 minutes
})

const typingLimiter = new RateLimiterMemory({
  keyGenerator: (socket: Socket) => (socket.data as SocketData).userId,
  points: 10, // 10 événements typing
  duration: 10, // par 10 secondes
})

export class MessageWebSocketServer {
  private io: SocketIOServer
  private connectedUsers: Map<string, { socketId: string; lastSeen: Date; channels: Set<string> }> = new Map()

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      path: '/api/socket',
      cors: {
        origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000
    })

    this.setupMiddleware()
    this.setupEventHandlers()
  }

  private async setupMiddleware() {
    // Middleware d'authentification
    this.io.use(async (socket, next) => {
      try {
        const req = socket.request as any
        const session = await getServerSession(req, {} as any, authOptions)
        
        if (!session?.user) {
          return next(new Error('Non authentifié'))
        }

        // Vérifier la limite de connexion par IP
        const clientIP = this.getClientIP(socket)
        try {
          await connectionLimiter.consume(clientIP)
        } catch {
          return next(new Error('Trop de connexions simultanées depuis cette IP'))
        }

        // Connecter à la base de données
        await connectToDatabase()

        // Récupérer les informations de l'utilisateur
        const user = await User.findById(session.user.id)
        if (!user) {
          return next(new Error('Utilisateur introuvable'))
        }

        // Récupérer les channels de l'utilisateur
        const userChannels = await Channel.findByUser(user._id.toString())
        const channelIds = userChannels.map(channel => channel._id.toString())

        // Stocker les données dans la socket
        socket.data = {
          userId: user._id.toString(),
          userRole: user.role,
          ipAddress: clientIP,
          channels: channelIds
        } as SocketData

        next()
      } catch (error) {
        console.error('Erreur d\'authentification WebSocket:', error)
        next(new Error('Erreur d\'authentification'))
      }
    })
  }

  private setupEventHandlers() {
    this.io.on('connection', async (socket: Socket) => {
      const socketData = socket.data as SocketData
      
      console.log(`Utilisateur connecté: ${socketData.userId}`)

      // Ajouter l'utilisateur à la liste des connectés
      this.connectedUsers.set(socketData.userId, {
        socketId: socket.id,
        lastSeen: new Date(),
        channels: new Set(socketData.channels)
      })

      // Rejoindre les channels de l'utilisateur
      await this.joinUserChannels(socket)

      // Notifier la présence
      await this.broadcastUserPresence(socketData.userId, 'online')

      // Event handlers
      socket.on('send_message', (data: MessageData) => this.handleSendMessage(socket, data))
      socket.on('typing', (data: TypingData) => this.handleTyping(socket, data))
      socket.on('stop_typing', (data: TypingData) => this.handleStopTyping(socket, data))
      socket.on('join_channel', (data: ChannelJoinData) => this.handleJoinChannel(socket, data))
      socket.on('leave_channel', (data: ChannelJoinData) => this.handleLeaveChannel(socket, data))
      socket.on('add_reaction', (data: ReactionData) => this.handleAddReaction(socket, data))
      socket.on('remove_reaction', (data: ReactionData) => this.handleRemoveReaction(socket, data))
      socket.on('mark_messages_read', (data: { channelId: string; messageIds: string[] }) => 
        this.handleMarkMessagesRead(socket, data))
      socket.on('request_channel_history', (data: { channelId: string; before?: string; limit?: number }) =>
        this.handleRequestChannelHistory(socket, data))

      // Gestion de la déconnexion
      socket.on('disconnect', () => this.handleDisconnect(socket))
    })
  }

  private async handleSendMessage(socket: Socket, data: MessageData) {
    try {
      const socketData = socket.data as SocketData

      // Rate limiting
      try {
        await messageLimiter.consume(socket)
      } catch {
        socket.emit('error', { message: 'Limite de messages atteinte. Veuillez patienter.' })
        return
      }

      // Valider les données
      if (!data.content?.trim() || !data.channelId) {
        socket.emit('error', { message: 'Contenu du message invalide' })
        return
      }

      // Vérifier l'accès au channel
      const channel = await Channel.findById(data.channelId)
      if (!channel) {
        socket.emit('error', { message: 'Channel introuvable' })
        return
      }

      const canAccess = channel.canUserAccess(socketData.userId, socketData.ipAddress)
      if (!canAccess) {
        socket.emit('error', { message: 'Accès au channel refusé' })
        return
      }

      // Vérifier les permissions d'écriture
      const member = channel.members.find(m => m.user.toString() === socketData.userId)
      if (!member?.permissions.canWrite) {
        socket.emit('error', { message: 'Permissions d\'écriture insuffisantes' })
        return
      }

      // Vérifier le slow mode
      if (channel.settings.slowModeSeconds > 0) {
        const lastMessage = await Message.findOne({
          channel: data.channelId,
          sender: socketData.userId
        }).sort({ createdAt: -1 })

        if (lastMessage) {
          const timeSinceLastMessage = Date.now() - lastMessage.createdAt.getTime()
          const requiredDelay = channel.settings.slowModeSeconds * 1000

          if (timeSinceLastMessage < requiredDelay) {
            const remainingTime = Math.ceil((requiredDelay - timeSinceLastMessage) / 1000)
            socket.emit('error', { 
              message: `Slow mode actif. Attendez ${remainingTime} secondes.`
            })
            return
          }
        }
      }

      // Créer le message
      const messageDoc = new Message({
        content: data.content.trim(),
        messageType: data.messageType || 'text',
        sender: socketData.userId,
        channel: data.channelId,
        parentMessage: data.parentMessageId || null,
        attachments: data.attachments || [],
        mentions: data.mentions || [],
        metadata: {
          ipAddress: socketData.ipAddress,
          userAgent: socket.request.headers['user-agent']
        }
      })

      await messageDoc.save()

      // Peupler les données pour l'envoi
      await messageDoc.populate('sender', 'name email avatar role')
      await messageDoc.populate('mentions', 'name email')

      // Mettre à jour les statistiques du channel
      await Channel.findByIdAndUpdate(data.channelId, {
        $inc: { 'stats.totalMessages': 1, 'stats.createdMessages24h': 1 },
        $set: { 'stats.lastActivity': new Date() }
      })

      // Diffuser le message aux membres du channel
      const messageData = {
        _id: messageDoc._id,
        content: messageDoc.content,
        messageType: messageDoc.messageType,
        sender: messageDoc.sender,
        channel: messageDoc.channel,
        parentMessage: messageDoc.parentMessage,
        attachments: messageDoc.attachments,
        mentions: messageDoc.mentions,
        reactions: messageDoc.reactions,
        createdAt: messageDoc.createdAt,
        isEdited: messageDoc.isEdited,
        editedAt: messageDoc.editedAt
      }

      this.io.to(`channel:${data.channelId}`).emit('new_message', messageData)

      // Envoyer des notifications aux utilisateurs mentionnés
      if (data.mentions && data.mentions.length > 0) {
        await this.sendMentionNotifications(data.mentions, messageData, channel)
      }

      // Gestion spéciale pour les channels IA
      if (channel.type === 'ai_assistant' && channel.aiSettings?.isEnabled) {
        await this.handleAIResponse(channel, messageData)
      }

    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error)
      socket.emit('error', { message: 'Erreur lors de l\'envoi du message' })
    }
  }

  private async handleTyping(socket: Socket, data: TypingData) {
    try {
      const socketData = socket.data as SocketData

      // Rate limiting pour le typing
      try {
        await typingLimiter.consume(socket)
      } catch {
        return // Ignorer silencieusement si limite atteinte
      }

      // Vérifier l'accès au channel
      if (!socketData.channels.includes(data.channelId)) {
        return
      }

      // Diffuser l'événement de frappe
      socket.to(`channel:${data.channelId}`).emit('user_typing', {
        userId: socketData.userId,
        channelId: data.channelId,
        isTyping: data.isTyping
      })

    } catch (error) {
      console.error('Erreur lors de la gestion du typing:', error)
    }
  }

  private async handleStopTyping(socket: Socket, data: TypingData) {
    const socketData = socket.data as SocketData
    
    socket.to(`channel:${data.channelId}`).emit('user_typing', {
      userId: socketData.userId,
      channelId: data.channelId,
      isTyping: false
    })
  }

  private async handleJoinChannel(socket: Socket, data: ChannelJoinData) {
    try {
      const socketData = socket.data as SocketData

      // Vérifier l'accès au channel
      const channel = await Channel.findById(data.channelId)
      if (!channel) {
        socket.emit('error', { message: 'Channel introuvable' })
        return
      }

      const canAccess = channel.canUserAccess(socketData.userId, socketData.ipAddress)
      if (!canAccess) {
        socket.emit('error', { message: 'Accès au channel refusé' })
        return
      }

      // Rejoindre le room
      await socket.join(`channel:${data.channelId}`)
      
      // Ajouter à la liste des channels de l'utilisateur
      const userConnection = this.connectedUsers.get(socketData.userId)
      if (userConnection) {
        userConnection.channels.add(data.channelId)
      }

      // Mettre à jour la dernière vue
      await channel.updateLastSeen(socketData.userId)

      socket.emit('channel_joined', { channelId: data.channelId })

    } catch (error) {
      console.error('Erreur lors de la jointure du channel:', error)
      socket.emit('error', { message: 'Erreur lors de la jointure du channel' })
    }
  }

  private async handleLeaveChannel(socket: Socket, data: ChannelJoinData) {
    try {
      const socketData = socket.data as SocketData

      // Quitter le room
      await socket.leave(`channel:${data.channelId}`)
      
      // Retirer de la liste des channels de l'utilisateur
      const userConnection = this.connectedUsers.get(socketData.userId)
      if (userConnection) {
        userConnection.channels.delete(data.channelId)
      }

      socket.emit('channel_left', { channelId: data.channelId })

    } catch (error) {
      console.error('Erreur lors de la sortie du channel:', error)
    }
  }

  private async handleAddReaction(socket: Socket, data: ReactionData) {
    try {
      const socketData = socket.data as SocketData

      const message = await Message.findById(data.messageId)
      if (!message) {
        socket.emit('error', { message: 'Message introuvable' })
        return
      }

      // Vérifier l'accès au channel
      if (!socketData.channels.includes(message.channel.toString())) {
        socket.emit('error', { message: 'Accès refusé' })
        return
      }

      // Ajouter la réaction
      await message.addReaction(data.emoji, socketData.userId)

      // Diffuser la réaction
      this.io.to(`channel:${message.channel}`).emit('reaction_added', {
        messageId: data.messageId,
        emoji: data.emoji,
        userId: socketData.userId,
        reactions: message.reactions
      })

    } catch (error) {
      console.error('Erreur lors de l\'ajout de réaction:', error)
      socket.emit('error', { message: 'Erreur lors de l\'ajout de réaction' })
    }
  }

  private async handleRemoveReaction(socket: Socket, data: ReactionData) {
    try {
      const socketData = socket.data as SocketData

      const message = await Message.findById(data.messageId)
      if (!message) {
        socket.emit('error', { message: 'Message introuvable' })
        return
      }

      // Vérifier l'accès au channel
      if (!socketData.channels.includes(message.channel.toString())) {
        socket.emit('error', { message: 'Accès refusé' })
        return
      }

      // Retirer la réaction
      await message.removeReaction(data.emoji, socketData.userId)

      // Diffuser le retrait de réaction
      this.io.to(`channel:${message.channel}`).emit('reaction_removed', {
        messageId: data.messageId,
        emoji: data.emoji,
        userId: socketData.userId,
        reactions: message.reactions
      })

    } catch (error) {
      console.error('Erreur lors du retrait de réaction:', error)
      socket.emit('error', { message: 'Erreur lors du retrait de réaction' })
    }
  }

  private async handleMarkMessagesRead(socket: Socket, data: { channelId: string; messageIds: string[] }) {
    try {
      const socketData = socket.data as SocketData

      // Vérifier l'accès au channel
      if (!socketData.channels.includes(data.channelId)) {
        socket.emit('error', { message: 'Accès refusé' })
        return
      }

      // Marquer les messages comme lus
      for (const messageId of data.messageIds) {
        const message = await Message.findById(messageId)
        if (message && message.channel.toString() === data.channelId) {
          await message.markAsRead(socketData.userId)
        }
      }

      // Diffuser les receipts de lecture
      socket.to(`channel:${data.channelId}`).emit('messages_read', {
        userId: socketData.userId,
        messageIds: data.messageIds,
        readAt: new Date()
      })

    } catch (error) {
      console.error('Erreur lors du marquage des messages lus:', error)
    }
  }

  private async handleRequestChannelHistory(socket: Socket, data: { channelId: string; before?: string; limit?: number }) {
    try {
      const socketData = socket.data as SocketData

      // Vérifier l'accès au channel
      if (!socketData.channels.includes(data.channelId)) {
        socket.emit('error', { message: 'Accès refusé' })
        return
      }

      const limit = Math.min(data.limit || 50, 100) // Maximum 100 messages
      const beforeDate = data.before ? new Date(data.before) : undefined

      const messages = await Message.findByChannel(data.channelId, {
        limit,
        before: beforeDate,
        includeDeleted: false
      })

      socket.emit('channel_history', {
        channelId: data.channelId,
        messages: messages.reverse(), // Ordre chronologique
        hasMore: messages.length === limit
      })

    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error)
      socket.emit('error', { message: 'Erreur lors de la récupération de l\'historique' })
    }
  }

  private async handleDisconnect(socket: Socket) {
    const socketData = socket.data as SocketData
    
    if (socketData?.userId) {
      console.log(`Utilisateur déconnecté: ${socketData.userId}`)
      
      // Retirer de la liste des connectés
      this.connectedUsers.delete(socketData.userId)
      
      // Notifier la présence
      await this.broadcastUserPresence(socketData.userId, 'offline')
    }
  }

  private async joinUserChannels(socket: Socket) {
    const socketData = socket.data as SocketData
    
    for (const channelId of socketData.channels) {
      await socket.join(`channel:${channelId}`)
    }
  }

  private async broadcastUserPresence(userId: string, status: 'online' | 'offline') {
    const userConnection = this.connectedUsers.get(userId)
    if (!userConnection) return

    for (const channelId of userConnection.channels) {
      this.io.to(`channel:${channelId}`).emit('user_presence', {
        userId,
        status,
        lastSeen: status === 'offline' ? new Date() : null
      })
    }
  }

  private async sendMentionNotifications(mentionedUserIds: string[], message: any, channel: any) {
    // TODO: Implémenter l'envoi de notifications push et email
    // pour les utilisateurs mentionnés
    for (const userId of mentionedUserIds) {
      const userConnection = this.connectedUsers.get(userId)
      if (userConnection) {
        this.io.to(userConnection.socketId).emit('mention_notification', {
          message,
          channel: {
            _id: channel._id,
            name: channel.name,
            type: channel.type
          }
        })
      }
    }
  }

  private async handleAIResponse(channel: any, userMessage: any) {
    // TODO: Implémenter la réponse IA
    // Cette méthode sera développée dans la tâche messaging-8
    console.log('AI response needed for channel:', channel._id)
  }

  private getClientIP(socket: Socket): string {
    const forwarded = socket.request.headers['x-forwarded-for'] as string
    const ip = forwarded ? forwarded.split(',')[0].trim() : socket.request.connection.remoteAddress
    return ip || '127.0.0.1'
  }

  // Méthodes publiques pour l'API
  public async broadcastToChannel(channelId: string, event: string, data: any) {
    this.io.to(`channel:${channelId}`).emit(event, data)
  }

  public async broadcastToUser(userId: string, event: string, data: any) {
    const userConnection = this.connectedUsers.get(userId)
    if (userConnection) {
      this.io.to(userConnection.socketId).emit(event, data)
    }
  }

  public getConnectedUsers(): Map<string, { socketId: string; lastSeen: Date; channels: Set<string> }> {
    return this.connectedUsers
  }

  public getChannelUserCount(channelId: string): number {
    const room = this.io.sockets.adapter.rooms.get(`channel:${channelId}`)
    return room ? room.size : 0
  }
}

let socketServer: MessageWebSocketServer | null = null

export function initializeWebSocketServer(httpServer: HTTPServer): MessageWebSocketServer {
  if (!socketServer) {
    socketServer = new MessageWebSocketServer(httpServer)
  }
  return socketServer
}

export function getWebSocketServer(): MessageWebSocketServer | null {
  return socketServer
}