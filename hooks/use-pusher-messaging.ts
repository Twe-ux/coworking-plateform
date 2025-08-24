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
  joinChannel: (channelId: string, forceRejoin?: boolean) => void
  joinChannelAndWait: (channelId: string) => Promise<void>
  leaveChannel: (channelId: string) => void

  // Direct Messages
  directMessages: DirectMessage[]
  createDirectMessage: (userId: string) => Promise<{ id: string } | null>
  refreshDirectMessages: () => Promise<void>

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

// Clés pour le localStorage
const MESSAGES_STORAGE_KEY = 'pusher_messages_cache'
const LAST_ACTIVITY_KEY = 'pusher_last_activity'

// Charger les messages depuis le localStorage
const loadMessagesFromStorage = (): Message[] => {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(MESSAGES_STORAGE_KEY)
    const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY)
    
    if (!stored || !lastActivity) return []
    
    // Si l'activité est trop ancienne (>30 min), nettoyer le cache
    const timeDiff = Date.now() - parseInt(lastActivity)
    if (timeDiff > 30 * 60 * 1000) { // 30 minutes
      localStorage.removeItem(MESSAGES_STORAGE_KEY)
      localStorage.removeItem(LAST_ACTIVITY_KEY)
      return []
    }
    
    return JSON.parse(stored) || []
  } catch {
    return []
  }
}

// Sauvegarder les messages dans le localStorage
const saveMessagesToStorage = (messages: Message[]) => {
  if (typeof window === 'undefined') return
  
  try {
    // Limiter à 100 messages max pour éviter de surcharger le localStorage
    const limitedMessages = messages.slice(-100)
    localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(limitedMessages))
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString())
  } catch (error) {
    console.warn('⚠️ Failed to save messages to localStorage:', error)
  }
}

export function usePusherMessaging(): UsePusherMessagingReturn {
  const { data: session } = useSession()
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState<Message[]>(() => loadMessagesFromStorage())
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

  // Send message avec vérification que le channel est prêt
  const sendMessage = useCallback(
    async (
      channelId: string,
      content: string,
      type: 'text' | 'image' | 'file' = 'text'
    ) => {
      if (!session?.user) {
        throw new Error('User not authenticated')
      }
      
      // Vérifier que le channel est actif avant d'envoyer
      if (!activeChannelsRef.current.has(channelId)) {
        console.warn(`⚠️ Channel ${channelId} not active, joining first...`)
        try {
          await joinChannelAndWait(channelId)
        } catch (error) {
          console.error(`❌ Failed to join channel before sending:`, error)
          // Continue quand même l'envoi, peut-être que ça marchera
        }
      }

      try {
        console.log(`📤 Sending message to channel ${channelId}:`, content.substring(0, 50) + '...')
        
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

        console.log('✅ Message sent successfully to', channelId, '- should appear via Pusher')
        return data.message
      } catch (error) {
        console.error('❌ Error sending message:', error)
        throw error
      }
    },
    [session, joinChannelAndWait]
  )

  // Load messages for a channel
  const loadMessages = useCallback(
    async (channelId: string, limit: number = 50): Promise<Message[]> => {
      try {
        console.log('📋 Loading messages for channel:', channelId)
        const response = await fetch(
          `/api/messaging/messages?channelId=${channelId}&limit=${limit}`
        )
        const data = await response.json()

        if (data.success) {
          const channelMessages = data.data.messages || []
          console.log('📋 Loaded', channelMessages.length, 'messages for channel:', channelId)
          
          // FIXME: Fusionner avec les messages existants au lieu de remplacer
          setMessages(prev => {
            // Enlever les anciens messages de ce channel
            const otherChannelMessages = prev.filter(msg => msg.channel !== channelId)
            // Ajouter les nouveaux messages du channel
            const uniqueMessages = [...otherChannelMessages, ...channelMessages]
            console.log('📋 Total messages after merge:', uniqueMessages.length)
            
            // Sauvegarder dans le localStorage pour persistance
            saveMessagesToStorage(uniqueMessages)
            
            return uniqueMessages
          })
          
          return channelMessages
        }

        return []
      } catch (error) {
        console.error('Error loading messages:', error)
        return []
      }
    },
    []
  )

  // Join channel avec gestion améliorée pour les nouveaux DM
  const joinChannel = useCallback(
    (channelId: string, forceRejoin = false) => {
      if (!session?.user) {
        console.log(`❌ Cannot join ${channelId}: no user session`)
        return
      }
      
      if (activeChannelsRef.current.has(channelId) && !forceRejoin) {
        console.log(`⏭️ Already joined channel ${channelId}, skipping`)
        return
      }

      console.log(`📺 Joining channel: ${channelId}${forceRejoin ? ' (forced)' : ''}`)
      console.log(`🔗 Pusher connection state:`, pusherClient.connection.state)

      const channelName = PUSHER_CHANNELS.PUBLIC(channelId)
      console.log(`🌐 Subscribing to public channel: ${channelName}`)
      
      try {
        // Si le channel existe déjà, le désabonner d'abord
        const existingChannel = channelInstancesRef.current.get(channelName)
        if (existingChannel && forceRejoin) {
          console.log(`🔄 Unsubscribing from existing channel before rejoining`)
          pusherClient.unsubscribe(channelName)
          channelInstancesRef.current.delete(channelName)
          activeChannelsRef.current.delete(channelId)
        }
        
        const channel = pusherClient.subscribe(channelName)

        // Add subscription success/error handlers
        channel.bind('pusher:subscription_succeeded', () => {
          console.log(`✅ Successfully subscribed to channel: ${channelName}`)
          console.log(`🔗 Channel ready for messaging!`)
          console.log(`📋 Active channels:`, Array.from(activeChannelsRef.current))
          console.log(`💾 Channel instances:`, Array.from(channelInstancesRef.current.keys()))
          setIsConnected(true)
        })

        channel.bind('pusher:subscription_error', (error: any) => {
          console.error(`❌ Failed to subscribe to channel: ${channelName}`, error)
          console.error(`❌ Subscription error details:`, error)
          console.log('⚠️ Channel subscription failed but keeping connection status')
        })

        console.log(`🎧 Binding MESSAGE_SENT event to channel: ${channelName}`)
        console.log(`🎧 Event name: ${PUSHER_EVENTS.MESSAGE_SENT}`)
        
        // Bind channel events avec logging amélioré
        channel.bind(PUSHER_EVENTS.MESSAGE_SENT, (data: PusherMessage) => {
          console.log('🎯 MESSAGE_SENT event received from Pusher!')
          console.log('📨 New message data:', {
            id: data.id,
            content: data.content?.substring(0, 50) + '...',
            channel: data.channel,
            sender: data.sender.name,
            timestamp: data.createdAt
          })
          
          setMessages(prev => {
            const exists = prev.find(m => m._id === data.id)
            if (exists) {
              console.log('💭 Message already exists, skipping')
              return prev
            }
            
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
            
            console.log('✨ Adding new message to state:', message._id)
            const newMessages = [...prev, message]
            // Sauvegarder les nouveaux messages
            saveMessagesToStorage(newMessages)
            
            return newMessages
          })
        })

        channel.bind('messages_read', (data: { userId: string; messageIds: string[]; readAt: string }) => {
          console.log('👁️ Messages read event received:', data)
          setMessages(prev => {
            const updatedMessages = prev.map(message => {
              if (data.messageIds.includes(message._id)) {
                const readBy = message.readBy || []
                const alreadyRead = readBy.some(read => 
                  read.user === data.userId || read.user.toString() === data.userId
                )

                if (!alreadyRead) {
                  console.log(`👁️ Marking message ${message._id} as read by ${data.userId}`)
                  const newMessage = {
                    ...message,
                    readBy: [...readBy, { user: data.userId, readAt: data.readAt }],
                  }
                  return newMessage
                } else {
                  console.log(`💭 Message ${message._id} already read by ${data.userId}`)
                }
              }
              return message
            })
            
            // Sauvegarder immédiatement les changements
            saveMessagesToStorage(updatedMessages)
            return updatedMessages
          })
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
        console.log(`📋 Loading messages for channel: ${channelId}`)
        loadMessages(channelId).then(messages => {
          console.log(`✅ Loaded ${messages.length} messages for channel ${channelId}`)
          if (messages.length === 0) {
            console.log('💭 No existing messages - channel ready for new messages')
          }
        }).catch(error => {
          console.error(`❌ Error loading messages for ${channelId}:`, error)
        })

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

  // Create direct message avec subscription immédiate au channel Pusher
  const createDirectMessage = useCallback(
    async (userId: string): Promise<{ id: string } | null> => {
      try {
        console.log('📝 Creating DM with user:', userId)
        
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
          const dmId = data.channel._id
          console.log('✅ DM created with ID:', dmId)
          
          const dm = {
            id: dmId,
            name: data.channel.name,
            participants: [session?.user?.id, userId].filter(Boolean) as string[],
            unreadCount: 0,
          }

          // Ajouter à la liste des DM
          setDirectMessages(prev => {
            const exists = prev.find(dm => dm.id === dmId)
            if (exists) {
              console.log('💭 DM already exists in list')
              return prev
            }
            console.log('🆕 Adding new DM to list:', dm)
            return [...prev, dm]
          })
          
          // IMPORTANT: Le channel sera rejoint par l'appelant (handleStartChatWithUser)
          // pour s'éviter les problèmes de synchronisation

          return { id: dmId }
        } else {
          console.error('❌ DM creation failed:', data)
        }

        return null
      } catch (error) {
        console.error('💥 Error creating direct message:', error)
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

  // Function to refresh direct messages list
  const refreshDirectMessages = useCallback(async (): Promise<void> => {
    try {
      console.log('🔄 Refreshing direct messages list...')
      const response = await fetch('/api/messaging/simple-channels')
      const data = await response.json()
      
      if (data.success) {
        const directChats = data.channels.filter(
          (ch: any) => ch.type === 'direct' || ch.type === 'dm'
        )
        
        setDirectMessages(directChats.map((ch: any) => ({
          id: ch._id,
          name: ch.name,
          participants: ch.members?.map((m: any) => m.user._id) || [],
          unreadCount: 0,
        })))
        
        console.log('✅ Refreshed', directChats.length, 'direct messages')
      }
    } catch (error) {
      console.error('❌ Error refreshing direct messages:', error)
    }
  }, [])
  
  // Join channel et attendre que la subscription soit prête
  const joinChannelAndWait = useCallback(
    (channelId: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (!session?.user) {
          console.log(`❌ Cannot join ${channelId}: no user session`)
          reject(new Error('No user session'))
          return
        }
        
        if (activeChannelsRef.current.has(channelId)) {
          console.log(`⏭️ Already joined channel ${channelId}, resolving immediately`)
          resolve()
          return
        }

        console.log(`📺 🕰️ Joining channel and waiting: ${channelId}`)

        const channelName = PUSHER_CHANNELS.PUBLIC(channelId)
        
        try {
          const channel = pusherClient.subscribe(channelName)
          
          // Timeout de sécurité
          const timeout = setTimeout(() => {
            console.warn(`⏰ Subscription timeout for channel ${channelName}`)
            reject(new Error(`Subscription timeout for channel ${channelName}`))
          }, 15000) // 15 secondes

          // Attendre la subscription
          channel.bind('pusher:subscription_succeeded', () => {
            clearTimeout(timeout)
            console.log(`✅ 🕰️ Channel ${channelName} ready for messaging!`)
            
            // Maintenant on peut ajouter les event listeners normalement
            channel.bind(PUSHER_EVENTS.MESSAGE_SENT, (data: PusherMessage) => {
              console.log('🎯 New message in fresh channel:', data.id)
              setMessages(prev => {
                const exists = prev.find(m => m._id === data.id)
                if (exists) return prev
                
                const message: Message = {
                  _id: data.id,
                  content: data.content,
                  messageType: data.messageType,
                  sender: {
                    _id: data.sender.id,
                    name: data.sender.name,
                    avatar: data.sender.image,
                    role: 'user',
                  },
                  channel: data.channel,
                  createdAt: data.createdAt,
                  reactions: data.reactions,
                  attachments: data.attachments,
                  readBy: data.readBy,
                }
                
                console.log('✨ Adding message to NEW channel:', message._id)
                const newMessages = [...prev, message]
                saveMessagesToStorage(newMessages)
                return newMessages
              })
            })
            
            channelInstancesRef.current.set(channelName, channel)
            activeChannelsRef.current.add(channelId)
            
            resolve()
          })

          channel.bind('pusher:subscription_error', (error: any) => {
            clearTimeout(timeout)
            console.error(`❌ Failed to subscribe to channel: ${channelName}`, error)
            reject(error)
          })
          
        } catch (error) {
          console.error(`❌ Error joining channel ${channelId}:`, error)
          reject(error)
        }
      })
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
    joinChannelAndWait,
    leaveChannel,

    // Direct Messages
    directMessages,
    createDirectMessage,
    refreshDirectMessages,

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