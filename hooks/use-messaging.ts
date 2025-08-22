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

interface UserStatus {
  isOnline: boolean
  lastSeen: Date
}

interface UseMessagingReturn {
  // Socket connection
  socket: Socket | null
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

export function useMessaging(): UseMessagingReturn {
  const { data: session } = useSession()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([])
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const [userStatuses, setUserStatuses] = useState<Record<string, UserStatus>>(
    {}
  )

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
        userName:
          session.user.firstName && session.user.lastName
            ? `${session.user.firstName} ${session.user.lastName}`
            : session.user.name || 'Utilisateur',
        userEmail: session.user.email,
      },
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

      // Demander les utilisateurs en ligne au serveur
      newSocket.emit('request_online_users')
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

    // Liste complète des utilisateurs en ligne
    newSocket.on(
      'online_users_list',
      (data: { users: any[]; timestamp: Date }) => {
        const timestamp = new Date().toLocaleTimeString()
        console.log(`📋 [${timestamp}] Online users list received:`, {
          count: data.users.length,
          users: data.users.map((u) => `${u.userName} (${u.userRole})`),
          currentUser: session?.user?.email,
          currentRole: (session?.user as any)?.role,
        })

        // FUSION au lieu de remplacement complet pour éviter les conflits
        if (data.users && data.users.length >= 0) {
          setOnlineUsers((prev) => {
            const newOnlineUsers = new Set(prev) // Commencer avec l'état existant

            // Ajouter les nouveaux utilisateurs en ligne
            data.users.forEach((u) => {
              newOnlineUsers.add(u.userId)
            })

            console.log(
              `🔄 [${timestamp}] Merging onlineUsers: from ${prev.size} to ${newOnlineUsers.size} users`
            )
            console.log(`📊 [${timestamp}] Previous:`, Array.from(prev))
            console.log(`📊 [${timestamp}] Merged:`, Array.from(newOnlineUsers))
            return newOnlineUsers
          })

          // Mettre à jour les statuts (fusion aussi)
          setUserStatuses((prev) => {
            const newUserStatuses = { ...prev } // Conserver les statuts existants
            data.users.forEach((u) => {
              newUserStatuses[u.userId] = {
                isOnline: true,
                lastSeen: u.lastSeen,
              }
            })
            console.log(
              `📊 [${timestamp}] Merging userStatuses:`,
              newUserStatuses
            )
            return newUserStatuses
          })
        } else {
          console.warn(
            `⚠️ [${timestamp}] Received empty or invalid users list, not updating`
          )
        }
      }
    )

    // Presence events individuels (synchroniser avec le serveur)
    newSocket.on(
      'user_presence',
      (data: {
        userId: string
        status: 'online' | 'offline'
        lastSeen: Date
      }) => {
        const timestamp = new Date().toLocaleTimeString()
        console.log(`👤 [${timestamp}] User presence update received:`, {
          userId: data.userId,
          status: data.status,
          currentUser: session?.user?.email,
          currentRole: (session?.user as any)?.role,
          lastSeen: data.lastSeen,
        })

        if (data.status === 'online') {
          setOnlineUsers((prev) => {
            const newSet = new Set([...prev, data.userId])
            console.log(
              `🟢 [${timestamp}] Added to onlineUsers:`,
              data.userId,
              'Total online:',
              newSet.size,
              'All:',
              Array.from(newSet)
            )
            return newSet
          })
          setUserStatuses((prev) => ({
            ...prev,
            [data.userId]: { isOnline: true, lastSeen: data.lastSeen },
          }))
        } else {
          // PROTECTION: Retarder la suppression d'utilisateurs offline pour éviter les faux positifs
          console.log(
            `🔴 [${timestamp}] User ${data.userId} marked offline - scheduling delayed removal`
          )

          setTimeout(() => {
            setOnlineUsers((prev) => {
              const newSet = new Set(prev)
              const wasOnline = newSet.has(data.userId)

              // Double check si l'utilisateur est toujours supposé être offline
              if (wasOnline) {
                newSet.delete(data.userId)
                console.log(
                  `🔴 [${timestamp}] Delayed removal of ${data.userId} from onlineUsers after verification`
                )
                console.warn(
                  `⚠️ [${timestamp}] CONTACT DISAPPEARED! User ${data.userId} was marked offline after delay. This might be the issue!`
                )
              } else {
                console.log(
                  `✅ [${timestamp}] User ${data.userId} already removed or came back online`
                )
              }

              return newSet
            })

            setUserStatuses((prev) => ({
              ...prev,
              [data.userId]: { isOnline: false, lastSeen: data.lastSeen },
            }))
          }, 3000) // Délai de 3 secondes pour vérifier la persistance
        }
      }
    )

    // Message events
    newSocket.on('new_message', (message: Message) => {
      console.log('📨 New message received:', message)
      setMessages((prev) => {
        // Avoid duplicates
        const exists = prev.find((m) => m._id === message._id)
        if (exists) return prev
        return [...prev, message]
      })
    })

    // Événements de statuts de lecture
    newSocket.on(
      'messages_read',
      (data: { userId: string; messageIds: string[]; readAt: string }) => {
        console.log('👁️ Messages read event:', data)
        setMessages((prev) =>
          prev.map((message) => {
            if (data.messageIds.includes(message._id)) {
              // Ajouter le statut de lecture s'il n'existe pas déjà
              const readBy = message.readBy || []
              const alreadyRead = readBy.some(
                (read) => read.user === data.userId
              )

              if (!alreadyRead) {
                return {
                  ...message,
                  readBy: [
                    ...readBy,
                    { user: data.userId, readAt: data.readAt },
                  ],
                }
              }
            }
            return message
          })
        )
      }
    )

    newSocket.on(
      'channel_history',
      (data: { channelId: string; messages: Message[] }) => {
        console.log(
          `📜 Channel history received: ${data.messages.length} messages`
        )
        setMessages(data.messages || [])
      }
    )

    newSocket.on('error', (error) => {
      console.error('❌ Socket error:', error)
    })

    // User status events
    newSocket.on('user_online', (data: { userId: string; user?: any }) => {
      console.log('👤 User came online:', data)
      setOnlineUsers((prev) => new Set(prev).add(data.userId))
      setUserStatuses((prev) => {
        const existing = prev.find((u) => u._id === data.userId)
        if (existing) {
          return prev.map((u) =>
            u._id === data.userId ? { ...u, isOnline: true } : u
          )
        }
        return [...prev, { _id: data.userId, isOnline: true }]
      })
    })

    newSocket.on(
      'user_offline',
      (data: { userId: string; lastSeen?: string }) => {
        console.log('👤 User went offline:', data)
        setOnlineUsers((prev) => {
          const newSet = new Set(prev)
          newSet.delete(data.userId)
          return newSet
        })
        setUserStatuses((prev) =>
          prev.map((u) =>
            u._id === data.userId
              ? { ...u, isOnline: false, lastSeen: data.lastSeen }
              : u
          )
        )
      }
    )

    newSocket.on('users_status_update', (data: { users: UserStatus[] }) => {
      console.log('👥 Users status batch update:', data.users.length, 'users')
      setUserStatuses(data.users)
      setOnlineUsers(
        new Set(data.users.filter((u) => u.isOnline).map((u) => u._id))
      )
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
  }, [session?.user?.id]) // Only depend on user ID to avoid reconnection loops

  // Resynchronisation périodique et sur focus
  useEffect(() => {
    if (!socket || !isConnected) return

    // Resync sur focus de la fenêtre
    const handleFocus = () => {
      console.log('🔄 Window focused, requesting online users refresh')
      socket.emit('request_online_users')
    }

    // Resync périodique (toutes les 5 minutes pour minimiser les conflits)
    const interval = setInterval(() => {
      if (socket && isConnected) {
        console.log('🔄 Periodic resync, requesting online users')
        socket.emit('request_online_users')
      }
    }, 300000) // 5 minutes pour réduire drastiquement les interférences

    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('focus', handleFocus)
      clearInterval(interval)
    }
  }, [socket, isConnected])

  // Send message
  const sendMessage = useCallback(
    async (
      channelId: string,
      content: string,
      type: 'text' | 'image' | 'file' = 'text'
    ) => {
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
          messageType: type,
        })

        // Consider message sent immediately for optimistic UI
        clearTimeout(timeout)
        resolve()
      })
    },
    [socket, isConnected]
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
      if (!socket || !isConnected) return

      console.log(`📺 Joining channel: ${channelId}`)
      socket.emit('join_channel', { channelId })
    },
    [socket, isConnected]
  )

  // Leave channel
  const leaveChannel = useCallback(
    (channelId: string) => {
      if (!socket || !isConnected) return

      console.log(`📺 Leaving channel: ${channelId}`)
      socket.emit('leave_channel', { channelId })
    },
    [socket, isConnected]
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
            participants: [session?.user?.id, userId].filter(
              Boolean
            ) as string[],
            unreadCount: 0,
          }

          setDirectMessages((prev) => {
            const exists = prev.find((dm) => dm.id === data.channel._id)
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
    },
    [socket, isConnected]
  )

  const stopTyping = useCallback(
    (channelId: string) => {
      if (!socket || !isConnected) return

      socket.emit('typing_stop', { channelId })

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = undefined
      }
    },
    [socket, isConnected]
  )

  // Mark messages as read
  const markMessagesAsRead = useCallback(
    (channelId: string, messageIds: string[]) => {
      if (!socket || !isConnected || messageIds.length === 0) return

      console.log('👁️ Marking messages as read:', { channelId, messageIds })
      socket.emit('mark_read', { channelId, messageIds })
    },
    [socket, isConnected]
  )

  // Helper function to check online status
  const getUserOnlineStatus = useCallback(
    (userId: string): boolean => {
      return onlineUsers.has(userId)
    },
    [onlineUsers]
  )

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

    // User presence
    onlineUsers,
    userStatuses,
    getUserOnlineStatus,

    // Message status
    markMessagesAsRead,

    // Connection management
    connect,
    disconnect,
  }
}
