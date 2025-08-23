'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { pusherClient, PUSHER_EVENTS, PUSHER_CHANNELS, type PusherMessage } from '@/lib/pusher'
import { Channel } from 'pusher-js'

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
  readBy?: Array<{
    user: string
    readAt: string
  }>
}

interface DirectMessage {
  id: string
  name: string
  participants: string[]
  lastMessage?: Message
  unreadCount?: number
}

interface UserStatus {
  isOnline: boolean
  lastSeen: Date
}

interface UsePusherMessagingReturn {
  // Connection
  isConnected: boolean

  // Messages
  messages: Message[]
  sendMessage: (
    channelId: string,
    content: string,
    type?: 'text' | 'image' | 'file'
  ) => Promise<void>
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

  // User status (online/offline)
  userStatuses: UserStatus[]
  onlineUsers: Set<string>

  // Message status
  markMessagesAsRead: (channelId: string, messageIds: string[]) => void

  // Connection management
  connect: () => void
  disconnect: () => void
}

export function usePusherMessaging(): UsePusherMessagingReturn {
  const { data: session } = useSession()
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([])
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const [userStatuses, setUserStatuses] = useState<Record<string, UserStatus>>({})
  
  const activeChannelsRef = useRef<Set<string>>(new Set())
  const channelInstancesRef = useRef<Map<string, Channel>>(new Map())
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  // Initialize Pusher connection
  const connect = useCallback(() => {
    if (!session?.user) return

    console.log('🔌 Connecting to Pusher...')

    try {
      // Connection state events
      pusherClient.connection.bind('connected', () => {
        console.log('✅ Pusher connected')
        setIsConnected(true)
      })

      pusherClient.connection.bind('disconnected', () => {
        console.log('❌ Pusher disconnected')
        setIsConnected(false)
      })

      pusherClient.connection.bind('error', (error: any) => {
        console.error('❌ Pusher connection error:', error)
        setIsConnected(false)
      })

      // Subscribe to user's personal channel for notifications
      const userChannel = pusherClient.subscribe(PUSHER_CHANNELS.USER(session.user.id))
      
      userChannel.bind(PUSHER_EVENTS.NOTIFICATION, (data: any) => {
        console.log('📧 Notification received:', data)
        // Handle notifications
      })

      // Subscribe to presence channel for online users
      const presenceChannel = pusherClient.subscribe(PUSHER_CHANNELS.PRESENCE)
      
      presenceChannel.bind('pusher:subscription_succeeded', (members: any) => {
        console.log('👥 Presence channel subscription succeeded')
        const memberIds = Object.keys(members.members)
        setOnlineUsers(new Set(memberIds))
      })

      presenceChannel.bind('pusher:member_added', (member: any) => {
        console.log('👤 User came online:', member.id)
        setOnlineUsers(prev => new Set([...prev, member.id]))
        setUserStatuses(prev => ({
          ...prev,
          [member.id]: { isOnline: true, lastSeen: new Date() }
        }))
      })

      presenceChannel.bind('pusher:member_removed', (member: any) => {
        console.log('👤 User went offline:', member.id)
        setOnlineUsers(prev => {
          const newSet = new Set(prev)
          newSet.delete(member.id)
          return newSet
        })
        setUserStatuses(prev => ({
          ...prev,
          [member.id]: { isOnline: false, lastSeen: new Date() }
        }))
      })

    } catch (error) {
      console.error('❌ Pusher connection error:', error)
      setIsConnected(false)
    }
  }, [session])

  // Disconnect Pusher
  const disconnect = useCallback(() => {
    console.log('🔌 Disconnecting from Pusher...')
    
    // Unsubscribe from all channels
    channelInstancesRef.current.forEach((channel, channelName) => {
      pusherClient.unsubscribe(channelName)
    })
    
    channelInstancesRef.current.clear()
    activeChannelsRef.current.clear()
    setIsConnected(false)
    setMessages([])
    setOnlineUsers(new Set())
    setUserStatuses({})
  }, [])

  // Auto connect/disconnect based on session
  useEffect(() => {
    if (session?.user) {
      connect()
    } else {
      disconnect()
    }

    return () => {
      disconnect()
    }
  }, [session?.user?.id, connect, disconnect])

  // Send message
  const sendMessage = useCallback(
    async (
      channelId: string,
      content: string,
      type: 'text' | 'image' | 'file' = 'text'
    ) => {
      if (!session?.user) {
        throw new Error('User not authenticated')
      }

      try {
        const response = await fetch('/api/pusher/messages?action=send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channelId,
            content: content.trim(),
            messageType: type,
          }),
        })

        const data = await response.json()

        if (!data.success) {
          throw new Error(data.message || 'Failed to send message')
        }

        console.log('📤 Message sent successfully:', data.message)
      } catch (error) {
        console.error('❌ Error sending message:', error)
        throw error
      }
    },
    [session]
  )

  // Load messages for a channel
  const loadMessages = useCallback(
    async (channelId: string, limit: number = 50): Promise<Message[]> => {
      try {
        const response = await fetch(
          `/api/messaging/messages?channelId=${channelId}&limit=${limit}`
        )
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
    },
    []
  )

  // Join channel
  const joinChannel = useCallback(
    (channelId: string) => {
      if (!session?.user || activeChannelsRef.current.has(channelId)) return

      console.log(`📺 Joining Pusher channel: ${channelId}`)

      const channelName = PUSHER_CHANNELS.PUBLIC(channelId)
      const channel = pusherClient.subscribe(channelName)

      // Bind channel events
      channel.bind(PUSHER_EVENTS.MESSAGE_SENT, (data: PusherMessage) => {
        console.log('📨 New message received:', data)
        setMessages(prev => {
          const exists = prev.find(m => m._id === data.id)
          if (exists) return prev
          
          // Convert PusherMessage to Message format
          const message: Message = {
            _id: data.id,
            content: data.content,
            messageType: data.messageType,
            sender: {
              _id: data.sender.id,
              name: data.sender.name,
              avatar: data.sender.image,
              role: 'user', // Default role
            },
            channel: data.channel,
            createdAt: data.createdAt,
            reactions: data.reactions,
            attachments: data.attachments,
            readBy: data.readBy,
          }
          
          return [...prev, message]
        })
      })

      channel.bind('messages_read', (data: { userId: string; messageIds: string[]; readAt: string }) => {
        console.log('👁️ Messages read event:', data)
        setMessages(prev =>
          prev.map(message => {
            if (data.messageIds.includes(message._id)) {
              const readBy = message.readBy || []
              const alreadyRead = readBy.some(read => read.user === data.userId)

              if (!alreadyRead) {
                return {
                  ...message,
                  readBy: [...readBy, { user: data.userId, readAt: data.readAt }],
                }
              }
            }
            return message
          })
        )
      })

      channel.bind(PUSHER_EVENTS.USER_TYPING, (data: any) => {
        console.log('⌨️ User typing:', data)
        // Handle typing indicator
      })

      channel.bind(PUSHER_EVENTS.USER_STOP_TYPING, (data: any) => {
        console.log('⌨️ User stopped typing:', data)
        // Handle stop typing
      })

      channelInstancesRef.current.set(channelName, channel)
      activeChannelsRef.current.add(channelId)

      // Load channel history
      loadMessages(channelId)
    },
    [session, loadMessages]
  )

  // Leave channel
  const leaveChannel = useCallback(
    (channelId: string) => {
      if (!activeChannelsRef.current.has(channelId)) return

      console.log(`📺 Leaving Pusher channel: ${channelId}`)

      const channelName = PUSHER_CHANNELS.PUBLIC(channelId)
      const channel = channelInstancesRef.current.get(channelName)

      if (channel) {
        pusherClient.unsubscribe(channelName)
        channelInstancesRef.current.delete(channelName)
      }

      activeChannelsRef.current.delete(channelId)
    },
    []
  )

  // Create direct message
  const createDirectMessage = useCallback(
    async (userId: string): Promise<{ id: string } | null> => {
      try {
        const response = await fetch('/api/messaging/simple-create-channel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `Direct Message`,
            type: 'direct',
            description: 'Direct message conversation',
            targetUserId: userId,
          }),
        })

        const data = await response.json()

        if (data.success && data.channel) {
          const dm = {
            id: data.channel._id,
            name: data.channel.name,
            participants: [session?.user?.id, userId].filter(Boolean) as string[],
            unreadCount: 0,
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
    },
    [session]
  )

  // Typing indicators
  const startTyping = useCallback(
    (channelId: string) => {
      if (!session?.user) return

      // Send typing indicator via API
      fetch('/api/pusher/messages?action=typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId, isTyping: true }),
      }).catch(console.error)

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      // Auto-stop typing after 3 seconds
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(channelId)
      }, 3000)
    },
    [session]
  )

  const stopTyping = useCallback(
    (channelId: string) => {
      if (!session?.user) return

      // Send stop typing indicator via API
      fetch('/api/pusher/messages?action=typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId, isTyping: false }),
      }).catch(console.error)

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = undefined
      }
    },
    [session]
  )

  // Mark messages as read
  const markMessagesAsRead = useCallback(
    (channelId: string, messageIds: string[]) => {
      if (!session?.user || messageIds.length === 0) return

      console.log('👁️ Marking messages as read:', { channelId, messageIds })
      
      fetch('/api/pusher/messages?action=mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId, messageIds }),
      }).catch(console.error)
    },
    [session]
  )

  return {
    // Connection
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

    // User presence
    onlineUsers,
    userStatuses: Object.entries(userStatuses).map(([_id, status]) => ({
      _id,
      ...status,
    })),

    // Message status
    markMessagesAsRead,

    // Connection management
    connect,
    disconnect,
  }
}