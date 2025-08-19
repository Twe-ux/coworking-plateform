'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { io, Socket } from 'socket.io-client'

interface Message {
  _id: string
  content: string
  messageType: 'text' | 'image' | 'file' | 'system'
  sender: {
    _id: string
    name: string
    avatar?: string
    role?: string
  }
  channel: string
  createdAt: string
  reactions?: any[]
  attachments?: any[]
}

interface DirectMessage {
  id: string
  name: string
  participants: string[]
  lastMessage?: Message
  unreadCount?: number
}

interface UseMessagingReturn {
  // Socket connection
  socket: Socket | null
  isConnected: boolean
  
  // Messages
  messages: Message[]
  sendMessage: (channelId: string, content: string, type?: 'text' | 'image' | 'file') => Promise<void>
  loadMessages: (channelId: string, limit?: number) => Promise<Message[]>
  
  // Channels
  joinChannel: (channelId: string) => void
  leaveChannel: (channelId: string) => void
  
  // Direct Messages
  directMessages: DirectMessage[]
  createDirectMessage: (userId: string) => Promise<{ id: string } | null>
  
  // Typing indicators
  startTyping: (channelId: string) => void
  stopTyping: (channelId: string) => void
  
  // Connection management
  connect: () => void
  disconnect: () => void
}

export function useMessaging(): UseMessagingReturn {
  const { data: session } = useSession()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([])
  
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  // Initialize socket connection
  const connect = useCallback(() => {
    if (!session?.user || socket?.connected) return

    console.log('🔌 Connecting to Socket.IO...')
    
    const newSocket = io({
      path: '/api/socket/',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      forceNew: false,
      auth: {
        sessionToken: 'auth-token',
        userId: session.user.id,
        userRole: (session.user as any).role || 'client',
        userName: (session.user.firstName && session.user.lastName) 
          ? `${session.user.firstName} ${session.user.lastName}`
          : session.user.name || 'Utilisateur',
        userEmail: session.user.email
      }
    })

    // Connection events
    newSocket.on('connect', () => {
      setIsConnected(true)
      console.log('✅ Socket connected')
      
      // Clear reconnect timeout if exists
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = undefined
      }
    })

    newSocket.on('disconnect', (reason) => {
      setIsConnected(false)
      console.log('❌ Socket disconnected:', reason)
      
      // Attempt reconnection after delay
      if (reason !== 'io client disconnect') {
        reconnectTimeoutRef.current = setTimeout(() => {
          if (!newSocket.connected) {
            console.log('🔄 Attempting reconnection...')
            newSocket.connect()
          }
        }, 3000)
      }
    })

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error)
      setIsConnected(false)
    })

    // Message events
    newSocket.on('new_message', (message: Message) => {
      console.log('📨 New message received:', message)
      setMessages(prev => {
        // Avoid duplicates
        const exists = prev.find(m => m._id === message._id)
        if (exists) return prev
        return [...prev, message]
      })
    })

    newSocket.on('channel_history', (data: { channelId: string; messages: Message[] }) => {
      console.log(`📜 Channel history received: ${data.messages.length} messages`)
      setMessages(data.messages || [])
    })

    newSocket.on('error', (error) => {
      console.error('❌ Socket error:', error)
    })

    setSocket(newSocket)
  }, [session])

  // Disconnect socket
  const disconnect = useCallback(() => {
    if (socket) {
      console.log('🔌 Disconnecting socket...')
      socket.disconnect()
      setSocket(null)
      setIsConnected(false)
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = undefined
    }
  }, [socket])

  // Auto connect/disconnect based on session
  useEffect(() => {
    if (session?.user) {
      connect()
    } else {
      disconnect()
    }

    // Cleanup on unmount
    return () => {
      disconnect()
    }
  }, [session, connect, disconnect])

  // Send message
  const sendMessage = useCallback(async (channelId: string, content: string, type: 'text' | 'image' | 'file' = 'text') => {
    if (!socket || !isConnected) {
      throw new Error('Socket not connected')
    }

    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Message send timeout'))
      }, 10000)

      socket.emit('send_message', {
        channelId,
        content: content.trim(),
        messageType: type
      })

      // Consider message sent immediately for optimistic UI
      clearTimeout(timeout)
      resolve()
    })
  }, [socket, isConnected])

  // Load messages for a channel
  const loadMessages = useCallback(async (channelId: string, limit: number = 50): Promise<Message[]> => {
    try {
      const response = await fetch(`/api/messaging/messages?channelId=${channelId}&limit=${limit}`)
      const data = await response.json()
      
      if (data.success) {
        const messages = data.data.messages || []
        setMessages(messages)
        return messages
      }
      
      return []
    } catch (error) {
      console.error('Error loading messages:', error)
      return []
    }
  }, [])

  // Join channel
  const joinChannel = useCallback((channelId: string) => {
    if (!socket || !isConnected) return
    
    console.log(`📺 Joining channel: ${channelId}`)
    socket.emit('join_channel', { channelId })
  }, [socket, isConnected])

  // Leave channel
  const leaveChannel = useCallback((channelId: string) => {
    if (!socket || !isConnected) return
    
    console.log(`📺 Leaving channel: ${channelId}`)
    socket.emit('leave_channel', { channelId })
  }, [socket, isConnected])

  // Create direct message
  const createDirectMessage = useCallback(async (userId: string): Promise<{ id: string } | null> => {
    try {
      const response = await fetch('/api/messaging/simple-create-channel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Direct Message`,
          type: 'direct',
          description: 'Direct message conversation',
          targetUserId: userId
        })
      })

      const data = await response.json()
      
      if (data.success && data.channel) {
        const dm = {
          id: data.channel._id,
          name: data.channel.name,
          participants: [session?.user?.id, userId].filter(Boolean) as string[],
          unreadCount: 0
        }
        
        setDirectMessages(prev => {
          const exists = prev.find(dm => dm.id === data.channel._id)
          if (exists) return prev
          return [...prev, dm]
        })
        
        return { id: data.channel._id }
      }
      
      return null
    } catch (error) {
      console.error('Error creating direct message:', error)
      return null
    }
  }, [session])

  // Typing indicators
  const startTyping = useCallback((channelId: string) => {
    if (!socket || !isConnected) return
    
    socket.emit('typing_start', { channelId })
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    // Auto-stop typing after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(channelId)
    }, 3000)
  }, [socket, isConnected])

  const stopTyping = useCallback((channelId: string) => {
    if (!socket || !isConnected) return
    
    socket.emit('typing_stop', { channelId })
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = undefined
    }
  }, [socket, isConnected])

  return {
    // Socket connection
    socket,
    isConnected,
    
    // Messages
    messages,
    sendMessage,
    loadMessages,
    
    // Channels
    joinChannel,
    leaveChannel,
    
    // Direct Messages
    directMessages,
    createDirectMessage,
    
    // Typing indicators
    startTyping,
    stopTyping,
    
    // Connection management
    connect,
    disconnect
  }
}