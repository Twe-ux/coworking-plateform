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
  typingUsers: Record<string, {userId: string, userName: string}[]>

  // User status (online/offline)
  userStatuses: UserStatus[]
  onlineUsers: Set<string>
  getUserOnlineStatus: (userId: string) => boolean

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
  const [typingUsers, setTypingUsers] = useState<Record<string, {userId: string, userName: string}[]>>({})
  
  const activeChannelsRef = useRef<Set<string>>(new Set())
  const channelInstancesRef = useRef<Map<string, Channel>>(new Map())
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  // Initialize Pusher connection
  const connect = useCallback(() => {
    if (!session?.user) return

    console.log('🔌 Connecting to Pusher...')
    console.log('🔑 Pusher config:', {
      key: process.env.NEXT_PUBLIC_PUSHER_KEY?.substring(0, 8) + '...',
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      hasKey: !!process.env.NEXT_PUBLIC_PUSHER_KEY
    })

    // Marquer l'utilisateur comme en ligne dans la base de données
    fetch('/api/messaging/set-online', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'online' }),
    }).catch(error => {
      console.error('❌ Failed to set user online:', error)
    })

    try {
      // Check if already connected
      if (pusherClient.connection.state === 'connected') {
        console.log('✅ Pusher already connected, socket ID:', pusherClient.connection.socket_id)
        setIsConnected(true)
      }

      // Connection state events
      pusherClient.connection.bind('connected', () => {
        console.log('✅ Pusher connected, socket ID:', pusherClient.connection.socket_id)
        setIsConnected(true)
      })

      pusherClient.connection.bind('disconnected', () => {
        console.log('❌ Pusher disconnected, reason:', arguments)
        setIsConnected(false)
      })

      pusherClient.connection.bind('error', (error: any) => {
        console.error('❌ Pusher connection error:', error)
        console.error('❌ Error details:', JSON.stringify(error, null, 2))
        setIsConnected(false)
      })

      pusherClient.connection.bind('state_change', (states: any) => {
        console.log('🔄 Pusher state change:', states.previous, '->', states.current)
        const isConnectedState = states.current === 'connected'
        setIsConnected(isConnectedState)
        
        if (isConnectedState) {
          console.log('🎯 Pusher connection established - ready for messaging!')
        }
      })

      // Subscribe to user's personal channel for notifications
      const userChannel = pusherClient.subscribe(PUSHER_CHANNELS.USER(session.user.id))
      
      userChannel.bind(PUSHER_EVENTS.NOTIFICATION, (data: any) => {
        console.log('📧 Notification received:', data)
        // Handle notifications
      })

      // Subscribe to presence channel for online users tracking
      console.log('👥 Subscribing to presence channel...')
      const presenceChannel = pusherClient.subscribe(PUSHER_CHANNELS.PRESENCE)
      
      presenceChannel.bind('pusher:subscription_succeeded', (members: any) => {
        console.log('👥 Presence channel subscription succeeded, members:', members)
        const memberIds = Object.keys(members.members || {})
        console.log('👥 Online users found:', memberIds)
        setOnlineUsers(new Set(memberIds))
        
        // Update user statuses
        const statusUpdates: Record<string, UserStatus> = {}
        memberIds.forEach(memberId => {
          statusUpdates[memberId] = { isOnline: true, lastSeen: new Date() }
        })
        setUserStatuses(statusUpdates)
      })

      presenceChannel.bind('pusher:member_added', (member: any) => {
        console.log('👤 User came online:', member)
        const memberId = member.id || member.user_id
        if (memberId) {
          setOnlineUsers(prev => {
            const newSet = new Set([...prev, memberId])
            console.log('👥 Updated online users (added):', Array.from(newSet))
            return newSet
          })
          setUserStatuses(prev => ({
            ...prev,
            [memberId]: { isOnline: true, lastSeen: new Date() }
          }))
        }
      })

      presenceChannel.bind('pusher:member_removed', (member: any) => {
        console.log('👤 User went offline:', member)
        const memberId = member.id || member.user_id
        if (memberId) {
          setOnlineUsers(prev => {
            const newSet = new Set(prev)
            newSet.delete(memberId)
            console.log('👥 Updated online users (removed):', Array.from(newSet))
            return newSet
          })
          setUserStatuses(prev => ({
            ...prev,
            [memberId]: { isOnline: false, lastSeen: new Date() }
          }))
        }
      })

      presenceChannel.bind('pusher:subscription_error', (error: any) => {
        console.error('❌ Presence channel subscription error:', error)
      })

    } catch (error) {
      console.error('❌ Pusher connection error:', error)
      setIsConnected(false)
    }
  }, [session])

  // Disconnect Pusher
  const disconnect = useCallback(() => {
    console.log('🔌 Disconnecting from Pusher...')
    
    // Marquer l'utilisateur comme hors ligne
    if (session?.user) {
      fetch('/api/messaging/set-online', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'offline' }),
      }).catch(error => {
        console.error('❌ Failed to set user offline:', error)
      })
    }
    
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
  }, [session])

  // Load online users from API as fallback
  const loadOnlineUsers = useCallback(async () => {
    if (!session?.user) return
    
    try {
      console.log('📋 Loading online users from API...')
      const response = await fetch('/api/messaging/online-users')
      const data = await response.json()
      
      if (data.success && data.users) {
        console.log('👥 API online users:', data.users)
        const userIds = data.users.map((u: any) => u._id)
        setOnlineUsers(new Set(userIds))
        
        const statusUpdates: Record<string, UserStatus> = {}
        data.users.forEach((user: any) => {
          statusUpdates[user._id] = {
            isOnline: user.isOnline,
            lastSeen: new Date(user.lastActive || Date.now())
          }
        })
        setUserStatuses(statusUpdates)
      }
    } catch (error) {
      console.error('❌ Error loading online users:', error)
    }
  }, [session])

  // Auto connect/disconnect based on session
  useEffect(() => {
    if (session?.user) {
      connect()
      // Load online users as fallback - only once per session
      const fallbackTimeout = setTimeout(() => {
        loadOnlineUsers()
      }, 2000)
      
      return () => {
        clearTimeout(fallbackTimeout)
        disconnect()
      }
    } else {
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

  // Join channel (version simplifiée pour debug)
  const joinChannel = useCallback(
    (channelId: string) => {
      if (!session?.user || activeChannelsRef.current.has(channelId)) {
        console.log(`⏭️ Skipping channel join for ${channelId}:`, {
          hasUser: !!session?.user,
          alreadyActive: activeChannelsRef.current.has(channelId)
        })
        return
      }

      console.log(`📺 Joining channel: ${channelId}`)
      console.log(`🔗 Pusher connection state:`, pusherClient.connection.state)

      // Pour l'instant, on utilise des canaux publics pour simplifier
      const channelName = PUSHER_CHANNELS.PUBLIC(channelId)
      console.log(`🌐 Subscribing to public channel: ${channelName}`)
      
      try {
        const channel = pusherClient.subscribe(channelName)

        // Add subscription success/error handlers
        channel.bind('pusher:subscription_succeeded', () => {
          console.log(`✅ Successfully subscribed to channel: ${channelName}`)
          console.log(`🔗 Channel ready for messaging!`)
          console.log(`📋 Active channels:`, Array.from(activeChannelsRef.current))
          console.log(`💾 Channel instances:`, channelInstancesRef.current.keys())
          // Set connected when any channel is successfully subscribed
          setIsConnected(true)
        })

        channel.bind('pusher:subscription_error', (error: any) => {
          console.error(`❌ Failed to subscribe to channel: ${channelName}`, error)
          console.error(`❌ Subscription error details:`, error)
          // Don't set disconnected immediately - maybe other channels work
          console.log('⚠️ Channel subscription failed but keeping connection status')
        })

        console.log(`🎧 Binding MESSAGE_SENT event to channel: ${channelName}`)
        console.log(`🎧 Event name: ${PUSHER_EVENTS.MESSAGE_SENT}`)
        
        // Bind channel events
        channel.bind(PUSHER_EVENTS.MESSAGE_SENT, (data: PusherMessage) => {
          console.log('🎯 MESSAGE_SENT event received from Pusher!')
          console.log('📨 New message received:', data)
          console.log('📨 Channel name:', channelName)
          console.log('📨 Event name:', PUSHER_EVENTS.MESSAGE_SENT)
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

        channel.bind(PUSHER_EVENTS.USER_TYPING, (data: { userId: string; userName: string; channelId: string }) => {
          console.log('⌨️ User typing:', data)
          if (data.userId !== session?.user?.id) {
            setTypingUsers(prev => ({
              ...prev,
              [data.channelId]: [
                ...(prev[data.channelId] || []).filter(user => user.userId !== data.userId),
                { userId: data.userId, userName: data.userName }
              ]
            }))
          }
        })

        channel.bind(PUSHER_EVENTS.USER_STOP_TYPING, (data: { userId: string; userName: string; channelId: string }) => {
          console.log('⌨️ User stopped typing:', data)
          if (data.userId !== session?.user?.id) {
            setTypingUsers(prev => ({
              ...prev,
              [data.channelId]: (prev[data.channelId] || []).filter(user => user.userId !== data.userId)
            }))
          }
        })

        channelInstancesRef.current.set(channelName, channel)
        activeChannelsRef.current.add(channelId)

        // Load channel history
        loadMessages(channelId)

      } catch (error) {
        console.error(`❌ Error joining channel ${channelId}:`, error)
        setIsConnected(false)
      }
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

  // Helper function to check online status
  const getUserOnlineStatus = useCallback(
    (userId: string): boolean => {
      return onlineUsers.has(userId)
    },
    [onlineUsers]
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
    typingUsers,

    // User presence
    onlineUsers,
    userStatuses: Object.entries(userStatuses).map(([_id, status]) => ({
      _id,
      ...status,
    })),
    getUserOnlineStatus,

    // Message status
    markMessagesAsRead,

    // Connection management
    connect,
    disconnect,
  }
}