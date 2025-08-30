'use client'

import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

// Singleton Socket.IO instance to prevent multiple connections
let globalSocket: Socket | null = null
let connectionPromise: Promise<Socket> | null = null

// Types
interface Message {
  _id: string
  content: string
  messageType: 'text' | 'image' | 'file' | 'system'
  sender: any
  channel: string
  createdAt: Date
  readBy: any[]
  reactions: any[]
  attachments: any[]
}

interface Channel {
  _id: string
  name: string
  type: 'public' | 'private' | 'direct'
  members: any[]
  isActive: boolean
}

interface DirectMessage {
  _id: string
  participants: string[]
  lastMessage?: Message
  unreadCount: number
}

interface UserStatus {
  isOnline: boolean
  lastSeen: Date
}

interface UseMessagingReturn {
  // Connection state
  isConnected: boolean
  socket: Socket | null
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'

  // Messages
  messages: Message[]
  sendMessage: (channelId: string, content: string, messageType?: string, attachments?: any[]) => void
  loadMessages: (channelId: string) => void
  loadMoreMessages: (channelId: string, before?: Date) => void
  
  // Channels
  joinChannel: (channelId: string) => void
  leaveChannel: (channelId: string) => void
  
  // Direct Messages
  directMessages: DirectMessage[]
  createDirectMessage: (userId: string) => Promise<{ id: string } | null>
  
  // Typing indicators
  startTyping: (channelId: string) => void
  stopTyping: (channelId: string) => void
  currentTypingUsers: string[]
  
  // User status (online/offline)
  userStatuses: UserStatus[]
  onlineUsers: Set<string>
  
  // Message status
  markMessagesAsRead: (channelId: string, messageIds: string[]) => void
  
  // Channel management
  createChannel: (name: string, type: string, description?: string) => Promise<boolean>
  updateChannel: (channelId: string, updates: any) => void
  
  // Utility
  clearMessages: () => void
  disconnect: () => void
  reconnect: () => void
}

// Singleton connection function
const createSocketConnection = async (session: any): Promise<Socket> => {
  if (globalSocket?.connected) {
    console.log('🔄 Reusing existing Socket.IO connection')
    return globalSocket
  }

  if (connectionPromise) {
    console.log('⏳ Waiting for existing connection attempt')
    return connectionPromise
  }

  console.log('🚀 Creating new Socket.IO connection for user:', session.user.email)

  connectionPromise = new Promise<Socket>((resolve, reject) => {
    // Configuration pour développement - Socket.IO sur même port que l'app
    const socketUrl = window.location.origin
      
    console.log('🔌 Connecting to Socket.IO server:', socketUrl)
    
    const socket = io(socketUrl, {
      path: '/api/socket/',
      transports: ['websocket', 'polling'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    })

    const onConnect = () => {
      console.log('✅ Socket.IO connected:', socket.id)
      
      // Authenticate immediately after connection
      socket.emit('authenticate', {
        userId: session.user.id,
        userName: session.user.name,
        userEmail: session.user.email,
        userRole: session.user.role
      })
    }

    const onAuthenticated = () => {
      console.log('🔐 Socket.IO authenticated successfully')
      globalSocket = socket
      connectionPromise = null
      socket.off('connect', onConnect)
      socket.off('authenticated', onAuthenticated)
      socket.off('connect_error', onConnectError)
      resolve(socket)
    }

    const onConnectError = (error: Error) => {
      console.error('❌ Socket.IO connection error:', error)
      connectionPromise = null
      socket.off('connect', onConnect)
      socket.off('authenticated', onAuthenticated)
      socket.off('connect_error', onConnectError)
      reject(error)
    }

    socket.on('connect', onConnect)
    socket.on('authenticated', onAuthenticated)
    socket.on('connect_error', onConnectError)

    socket.connect()
  })

  return connectionPromise
}

export function useMessaging(): UseMessagingReturn {
  const { data: session } = useSession()
  
  // States
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')
  const [messages, setMessages] = useState<Message[]>([])
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([])
  const [userStatuses, setUserStatuses] = useState<UserStatus[]>([])
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const [currentTypingUsers, setCurrentTypingUsers] = useState<string[]>([])
  
  const socketRef = useRef<Socket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isInitialized = useRef(false)

  // Initialize Socket.IO connection
  const initializeConnection = useCallback(async () => {
    if (!session?.user || isInitialized.current) return

    try {
      setConnectionStatus('connecting')
      isInitialized.current = true

      const socket = await createSocketConnection(session)
      socketRef.current = socket

      // Set up event listeners
      socket.on('connect', () => {
        console.log('🟢 Socket.IO connected')
        setIsConnected(true)
        setConnectionStatus('connected')
      })

      socket.on('disconnect', (reason) => {
        console.log('🔴 Socket.IO disconnected:', reason)
        setIsConnected(false)
        setConnectionStatus('disconnected')
        setCurrentTypingUsers([])

        // Clean up global reference if this socket disconnected
        if (globalSocket === socket) {
          globalSocket = null
        }

        // Auto-reconnect logic
        if (reason !== 'io server disconnect' && reason !== 'io client disconnect') {
          setTimeout(() => {
            if (!globalSocket?.connected) {
              console.log('🔄 Attempting to reconnect...')
              socket.connect()
            }
          }, 2000)
        }
      })

      socket.on('connect_error', (error) => {
        console.error('❌ Socket.IO connection error:', error)
        setConnectionStatus('error')
      })

      // Message events
      socket.on('new_message', (data: Message) => {
        console.log('📨 New message received:', data._id)
        setMessages(prev => {
          // Prevent duplicates
          const exists = prev.find(m => m._id === data._id)
          if (exists) return prev
          
          return [...prev, data]
        })
      })

      socket.on('channel_history', (data: { channelId: string, messages: Message[], hasMore: boolean }) => {
        console.log('📚 Channel history received:', data.messages.length, 'messages')
        setMessages(data.messages)
      })

      socket.on('user_typing', (data: { userId: string, userName: string, channelId: string, isTyping: boolean }) => {
        if (data.isTyping) {
          setCurrentTypingUsers(prev => {
            if (!prev.includes(data.userName)) {
              return [...prev, data.userName]
            }
            return prev
          })
        } else {
          setCurrentTypingUsers(prev => prev.filter(user => user !== data.userName))
        }
      })

      socket.on('user_presence', (data: { userId: string, userName: string, status: 'online' | 'offline', lastSeen?: Date }) => {
        if (data.status === 'online') {
          setOnlineUsers(prev => new Set([...Array.from(prev), data.userId]))
        } else {
          setOnlineUsers(prev => {
            const newSet = new Set(prev)
            newSet.delete(data.userId)
            return newSet
          })
        }
      })

      socket.on('online_users_list', (data: { users: Array<{ userId: string, userName: string, userEmail: string }> }) => {
        const userIds = data.users.map(u => u.userId)
        setOnlineUsers(new Set(userIds))
      })

      socket.on('messages_read', (data: { userId: string, messageIds: string[], readAt: string }) => {
        setMessages(prev => prev.map(msg => {
          if (data.messageIds.includes(msg._id)) {
            const updatedReadBy = [...(msg.readBy || [])]
            if (!updatedReadBy.some(r => r.user === data.userId)) {
              updatedReadBy.push({ 
                user: data.userId, 
                readAt: new Date(data.readAt) 
              })
            }
            return { ...msg, readBy: updatedReadBy }
          }
          return msg
        }))
      })

      socket.on('notification_increment', (data) => {
        // Handled by use-notifications hook
        console.log('🔔 Notification increment:', data)
      })

      socket.on('notifications_read', (data) => {
        // Handled by use-notifications hook
        console.log('👁️ Notifications read:', data)
      })

      socket.on('error', (data: { message: string }) => {
        console.error('🚫 Socket.IO server error:', data.message)
      })

      // Request initial data
      socket.emit('request_online_users')

      setIsConnected(true)
      setConnectionStatus('connected')

    } catch (error) {
      console.error('❌ Failed to initialize Socket.IO:', error)
      setConnectionStatus('error')
      isInitialized.current = false
    }
  }, [session])

  // Auto-connect when session is available
  useEffect(() => {
    if (session?.user && connectionStatus === 'disconnected') {
      initializeConnection()
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [session, initializeConnection])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isInitialized.current = false
      if (socketRef.current && socketRef.current === globalSocket) {
        // Only disconnect if this is the global socket
        socketRef.current.disconnect()
        globalSocket = null
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [])

  // Socket.IO functions
  const sendMessage = useCallback((channelId: string, content: string, messageType: string = 'text', attachments: any[] = []) => {
    if (!content.trim() || !socketRef.current?.connected) {
      console.error('❌ Cannot send message: empty content or not connected')
      return
    }

    console.log('📤 Sending message via Socket.IO')
    socketRef.current.emit('send_message', {
      channelId,
      content: content.trim(),
      messageType,
      attachments
    })
  }, [])

  const loadMessages = useCallback((channelId: string) => {
    console.log('📥 Loading messages for channel:', channelId)
    if (socketRef.current?.connected) {
      socketRef.current.emit('join_channel', { channelId })
    }
  }, [])

  const joinChannel = useCallback((channelId: string) => {
    console.log('🚪 Joining channel:', channelId)
    if (socketRef.current?.connected) {
      socketRef.current.emit('join_channel', { channelId })
    }
  }, [])

  const leaveChannel = useCallback((channelId: string) => {
    console.log('🚪 Leaving channel:', channelId)
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave_channel', { channelId })
    }
  }, [])

  const startTyping = useCallback((channelId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('typing_start', { channelId })
    }
  }, [])

  const stopTyping = useCallback((channelId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('typing_stop', { channelId })
    }
  }, [])

  const markMessagesAsRead = useCallback((channelId: string, messageIds: string[]) => {
    if (!messageIds.length || !socketRef.current?.connected) return

    console.log('👁️ Marking messages as read:', messageIds.length)
    socketRef.current.emit('mark_read', { channelId, messageIds })
  }, [])

  const reconnect = useCallback(() => {
    console.log('🔄 Manual reconnection requested')
    if (socketRef.current) {
      socketRef.current.connect()
    } else {
      isInitialized.current = false
      setConnectionStatus('disconnected')
      initializeConnection()
    }
  }, [initializeConnection])

  const disconnect = useCallback(() => {
    console.log('🔌 Manual disconnection requested')
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    if (socketRef.current) {
      socketRef.current.disconnect()
      if (socketRef.current === globalSocket) {
        globalSocket = null
      }
      socketRef.current = null
    }
    setIsConnected(false)
    setConnectionStatus('disconnected')
    setCurrentTypingUsers([])
    isInitialized.current = false
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  // Compatibility stubs
  const loadMoreMessages = useCallback(() => {
    console.log('📄 Load more messages not yet implemented')
  }, [])

  const createDirectMessage = useCallback(async (targetUserId: string) => {
    console.log('💬 Creating DM via REST API')
    
    try {
      const response = await fetch('/api/messaging/simple-create-channel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `DM with user ${targetUserId}`,
          type: 'direct',
          targetUserId: targetUserId
        })
      })
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (data.success && data.channel) {
        console.log('✅ DM created/retrieved:', data.channel._id)
        return { id: data.channel._id.toString() }
      }
      
      throw new Error('Invalid API response')
      
    } catch (error) {
      console.error('❌ Error creating DM:', error)
      return null
    }
  }, [])

  const createChannel = useCallback(async () => {
    console.log('🏗️ Create channel not implemented')
    return false
  }, [])

  const updateChannel = useCallback(() => {
    console.log('✏️ Update channel not implemented')
  }, [])

  return {
    isConnected,
    socket: socketRef.current,
    connectionStatus,
    messages,
    sendMessage,
    loadMessages,
    loadMoreMessages,
    joinChannel,
    leaveChannel,
    directMessages,
    createDirectMessage,
    startTyping,
    stopTyping,
    currentTypingUsers,
    userStatuses,
    onlineUsers,
    markMessagesAsRead,
    createChannel,
    updateChannel,
    clearMessages,
    disconnect,
    reconnect,
  }
}