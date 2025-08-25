import { io, Socket } from 'socket.io-client'
// Toast will be handled by the component using this client

export interface ClientMessage {
  _id: string
  content: string
  messageType: 'text' | 'image' | 'file' | 'system' | 'ai_response'
  sender: {
    _id: string
    name: string
    email: string
    avatar?: string
    role: string
  }
  channel: string
  parentMessage?: string
  attachments: {
    url: string
    type: 'image' | 'file'
    filename: string
    size: number
    mimeType: string
  }[]
  mentions: {
    _id: string
    name: string
    email: string
  }[]
  reactions: {
    emoji: string
    users: string[]
    count: number
  }[]
  createdAt: string
  isEdited: boolean
  editedAt?: string
}

export interface UserPresence {
  userId: string
  status: 'online' | 'offline'
  lastSeen?: string
}

export interface TypingIndicator {
  userId: string
  channelId: string
  isTyping: boolean
}

export interface ChannelInfo {
  _id: string
  name: string
  type: 'public' | 'private' | 'direct' | 'ai_assistant'
  unreadCount: number
  lastActivity: string
}

export type SocketEventMap = {
  // Événements reçus du serveur
  new_message: (message: ClientMessage) => void
  user_typing: (data: TypingIndicator) => void
  user_presence: (data: UserPresence) => void
  reaction_added: (data: { messageId: string; emoji: string; userId: string; reactions: any[] }) => void
  reaction_removed: (data: { messageId: string; emoji: string; userId: string; reactions: any[] }) => void
  messages_read: (data: { userId: string; messageIds: string[]; readAt: string }) => void
  channel_history: (data: { channelId: string; messages: ClientMessage[]; hasMore: boolean }) => void
  channel_joined: (data: { channelId: string }) => void
  channel_left: (data: { channelId: string }) => void
  mention_notification: (data: { message: ClientMessage; channel: any }) => void
  error: (data: { message: string }) => void
  connect: () => void
  disconnect: () => void
  connect_error: (error: Error) => void
}

export class MessageWebSocketClient {
  private socket: Socket | null = null
  private eventListeners: Map<string, Function[]> = new Map()
  private isConnecting = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  constructor() {
    this.setupEventListeners()
  }

  public async connect(): Promise<void> {
    if (this.socket?.connected || this.isConnecting) {
      return
    }

    this.isConnecting = true

    try {
      // Get session token from cookies
      const sessionToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('next-auth.session-token='))
        ?.split('=')[1] || 
        document.cookie
        .split('; ')
        .find(row => row.startsWith('__Secure-next-auth.session-token='))
        ?.split('=')[1]

      this.socket = io({
        path: '/api/socket/',
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
        upgrade: true,
        autoConnect: false,
        auth: {
          sessionToken
        }
      })

      this.setupSocketEventHandlers()
      
      return new Promise((resolve, reject) => {
        if (!this.socket) return reject(new Error('Socket non initialisé'))

        const timeout = setTimeout(() => {
          reject(new Error('Timeout de connexion'))
        }, 10000)

        this.socket.once('connect', () => {
          clearTimeout(timeout)
          this.isConnecting = false
          this.reconnectAttempts = 0
          console.log('Connexion WebSocket établie')
          this.emit('connect')
          resolve()
        })

        this.socket.once('connect_error', (error: any) => {
          clearTimeout(timeout)
          this.isConnecting = false
          console.error('Erreur de connexion WebSocket:', error)
          this.emit('connect_error', error)
          reject(error)
        })

        this.socket.connect()
      })
    } catch (error) {
      this.isConnecting = false
      throw error
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    this.isConnecting = false
    this.reconnectAttempts = 0
  }

  public isConnected(): boolean {
    return this.socket?.connected || false
  }

  // Méthodes d'envoi de messages
  public sendMessage(channelId: string, content: string, options: {
    messageType?: 'text' | 'image' | 'file'
    parentMessageId?: string
    mentions?: string[]
    attachments?: any[]
  } = {}): void {
    if (!this.socket?.connected) {
      console.error({
        title: 'Erreur',
        description: 'Connexion perdue. Tentative de reconnexion...',
        variant: 'destructive'
      })
      this.attemptReconnect()
      return
    }

    this.socket.emit('send_message', {
      content,
      channelId,
      messageType: options.messageType || 'text',
      parentMessageId: options.parentMessageId,
      mentions: options.mentions || [],
      attachments: options.attachments || []
    })
  }

  public startTyping(channelId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('typing', { channelId, isTyping: true })
    }
  }

  public stopTyping(channelId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('stop_typing', { channelId, isTyping: false })
    }
  }

  public joinChannel(channelId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join_channel', { channelId })
    }
  }

  public leaveChannel(channelId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leave_channel', { channelId })
    }
  }

  public addReaction(messageId: string, emoji: string): void {
    if (this.socket?.connected) {
      this.socket.emit('add_reaction', { messageId, emoji, action: 'add' })
    }
  }

  public removeReaction(messageId: string, emoji: string): void {
    if (this.socket?.connected) {
      this.socket.emit('remove_reaction', { messageId, emoji, action: 'remove' })
    }
  }

  public markMessagesRead(channelId: string, messageIds: string[]): void {
    if (this.socket?.connected) {
      this.socket.emit('mark_messages_read', { channelId, messageIds })
    }
  }

  public requestChannelHistory(channelId: string, options: {
    before?: string
    limit?: number
  } = {}): void {
    if (this.socket?.connected) {
      this.socket.emit('request_channel_history', {
        channelId,
        before: options.before,
        limit: options.limit || 50
      })
    }
  }

  // Système d'événements
  public on<K extends keyof SocketEventMap>(event: K, callback: SocketEventMap[K]): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(callback)
  }

  public off<K extends keyof SocketEventMap>(event: K, callback?: SocketEventMap[K]): void {
    const listeners = this.eventListeners.get(event)
    if (!listeners) return

    if (callback) {
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    } else {
      this.eventListeners.set(event, [])
    }
  }

  private emit<K extends keyof SocketEventMap>(event: K, ...args: Parameters<SocketEventMap[K]>): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(callback => {
        try {
          ;(callback as any)(...args)
        } catch (error) {
          console.error(`Erreur dans le listener ${event}:`, error)
        }
      })
    }
  }

  private setupSocketEventHandlers(): void {
    if (!this.socket) return

    // Événements de connexion
    this.socket.on('connect', () => {
      this.emit('connect')
    })

    this.socket.on('disconnect', (reason: any) => {
      console.log('Déconnexion WebSocket:', reason)
      this.emit('disconnect')
      
      if (reason === 'io server disconnect') {
        // Le serveur a fermé la connexion, ne pas reconnecter automatiquement
        return
      }
      
      // Tentative de reconnexion automatique
      this.attemptReconnect()
    })

    this.socket.on('connect_error', (error: any) => {
      console.error('Erreur de connexion:', error)
      this.emit('connect_error', error)
      this.attemptReconnect()
    })

    // Événements de messagerie
    this.socket.on('new_message', (message: ClientMessage) => {
      this.emit('new_message', message)
    })

    this.socket.on('user_typing', (data: TypingIndicator) => {
      this.emit('user_typing', data)
    })

    this.socket.on('user_presence', (data: UserPresence) => {
      this.emit('user_presence', data)
    })

    this.socket.on('reaction_added', (data: any) => {
      this.emit('reaction_added', data)
    })

    this.socket.on('reaction_removed', (data: any) => {
      this.emit('reaction_removed', data)
    })

    this.socket.on('messages_read', (data: any) => {
      this.emit('messages_read', data)
    })

    this.socket.on('channel_history', (data: any) => {
      this.emit('channel_history', data)
    })

    this.socket.on('channel_joined', (data: any) => {
      this.emit('channel_joined', data)
    })

    this.socket.on('channel_left', (data: any) => {
      this.emit('channel_left', data)
    })

    this.socket.on('mention_notification', (data: any) => {
      this.emit('mention_notification', data)
      
      // Afficher une notification toast
      console.error({
        title: 'Nouvelle mention',
        description: `Vous avez été mentionné dans ${data.channel.name}`,
        action: {
          label: 'Voir',
          onClick: () => {
            // TODO: Navigation vers le channel
            window.location.href = `/messaging/channels/${data.channel._id}`
          }
        }
      })
    })

    this.socket.on('error', (data: any) => {
      console.error('Erreur WebSocket:', data.message)
      this.emit('error', data)
      
      console.error({
        title: 'Erreur',
        description: data.message,
        variant: 'destructive'
      })
    })
  }

  private setupEventListeners(): void {
    // Événements de visibilité de page
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && !this.isConnected()) {
        this.attemptReconnect()
      }
    })

    // Événements réseau
    window.addEventListener('online', () => {
      if (!this.isConnected()) {
        this.attemptReconnect()
      }
    })

    window.addEventListener('offline', () => {
      console.error({
        title: 'Connexion perdue',
        description: 'Vérifiez votre connexion internet',
        variant: 'destructive'
      })
    })
  }

  private async attemptReconnect(): Promise<void> {
    if (this.isConnecting || this.reconnectAttempts >= this.maxReconnectAttempts) {
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

    console.log(`Tentative de reconnexion ${this.reconnectAttempts}/${this.maxReconnectAttempts} dans ${delay}ms`)

    setTimeout(async () => {
      try {
        await this.connect()
      } catch (error) {
        console.error('Échec de la reconnexion:', error)
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error({
            title: 'Connexion échouée',
            description: 'Impossible de se reconnecter. Rechargez la page.',
            variant: 'destructive',
            action: {
              label: 'Recharger',
              onClick: () => window.location.reload()
            }
          })
        }
      }
    }, delay)
  }

  // Méthodes utilitaires
  public getConnectionStatus(): {
    connected: boolean
    reconnectAttempts: number
    maxReconnectAttempts: number
  } {
    return {
      connected: this.isConnected(),
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts
    }
  }

  public clearReconnectAttempts(): void {
    this.reconnectAttempts = 0
  }
}

// Instance singleton
let wsClient: MessageWebSocketClient | null = null

export function getWebSocketClient(): MessageWebSocketClient {
  if (!wsClient) {
    wsClient = new MessageWebSocketClient()
  }
  return wsClient
}

export function disconnectWebSocket(): void {
  if (wsClient) {
    wsClient.disconnect()
    wsClient = null
  }
}