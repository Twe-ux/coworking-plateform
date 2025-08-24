'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'

// Types existants (gardés compatibles avec l'ancienne implémentation)
export interface Message {
  _id: string
  content: string
  messageType: 'text' | 'image' | 'file'
  sender: {
    _id: string
    name: string
    avatar?: string
    role: string
  }
  channel: string
  createdAt: string
  reactions: any[]
  attachments: any[]
  readBy: { user: string; readAt: string }[]
}

export interface DirectMessage {
  id: string
  name: string
  participants: string[]
  unreadCount: number
}

export interface TypingUser {
  userId: string
  userName: string
}

// Interface pour les messages WebSocket
interface WSMessage {
  type: string
  channelId?: string
  content?: string
  messageType?: 'text' | 'image' | 'file'
  messageIds?: string[]
  isTyping?: boolean
  message?: Message
  userId?: string
  userName?: string
  readAt?: string
}

// Interface pour les types de retour du hook
interface UseMessagingReturn {
  socket: WebSocket | null
  isConnected: boolean
  messages: Message[]
  sendMessage: (channelId: string, content: string, type?: 'text' | 'image' | 'file') => Promise<void>
  loadMessages: (channelId: string, limit?: number) => Promise<Message[]>
  joinChannel: (channelId: string) => void
  leaveChannel: (channelId: string) => void
  directMessages: DirectMessage[]
  createDirectMessage: (userId: string) => Promise<{ id: string } | null>
  startTyping: (channelId: string) => void
  stopTyping: (channelId: string) => void
  onlineUsers: Set<string>
  userStatuses: Record<string, UserStatus>
  getUserOnlineStatus: (userId: string) => boolean
  markMessagesAsRead: (channelId: string, messageIds: string[]) => void
  connect: () => void
  disconnect: () => void
}

// Interface pour les statuts utilisateur
interface UserStatus {
  isOnline: boolean
  lastSeen?: Date | string
}

export function useMessaging(): UseMessagingReturn {
  const { data: session } = useSession()
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([])
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const [userStatuses, setUserStatuses] = useState<Record<string, UserStatus>>(
    {}
  )

  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const typingTimeoutRef = useRef<NodeJS.Timeout>()
  
  // Initialize WebSocket connection
  const connect = useCallback(() => {
    if (!session?.user || socket) return

    console.log('🔌 Initializing WebSocket connection...')

    const wsUrl = typeof window !== 'undefined' ? 
      `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/ws` : 
      'ws://localhost:3000/api/ws'
    
    const newSocket = new WebSocket(wsUrl)

    newSocket.onopen = () => {
      console.log('✅ WebSocket connected')
      setIsConnected(true)
      
      // Send authentication once connected
      const authMessage = {
        type: 'auth',
        userId: (session.user as any).id,
        userRole: (session.user as any).role || 'client',
        userName:
          (session.user as any).firstName && (session.user as any).lastName
            ? `${(session.user as any).firstName} ${(session.user as any).lastName}`
            : session.user.name || 'Utilisateur',
        userEmail: session.user.email,
      }
      
      newSocket.send(JSON.stringify(authMessage))
      console.log('✅ Authentication message sent')

      // Request online users list
      newSocket.send(JSON.stringify({ type: 'request_online_users' }))
    }

    newSocket.onclose = (event) => {
      console.log('❌ WebSocket disconnected:', event.code, event.reason)
      setIsConnected(false)
      setSocket(null)
      
      // Auto-reconnect after delay
      if (event.code !== 1000) { // Not normal closure
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Attempting WebSocket reconnection...')
          connect()
        }, 3000)
      }
    }

    newSocket.onerror = (error) => {
      console.error('❌ WebSocket error:', error)
      setIsConnected(false)
    }

    setSocket(newSocket)
  }, [session])

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (!socket) return

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data)
        console.log('📨 WebSocket message received:', data.type, data)

        switch (data.type) {
          case 'connected':
            console.log('✅ WebSocket connected successfully')
            // Request online users list
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify({ type: 'request_online_users' }))
            }
            break

          case 'message_received':
            if (data.message) {
              console.log('📨 New message received:', data.message)
              setMessages((prev) => {
                const exists = prev.find((m) => m._id === data.message._id)
                if (exists) return prev
                return [...prev, data.message]
              })
            }
            break

          case 'messages_read':
            console.log('👁️ Messages read event:', data)
            setMessages((prev) =>
              prev.map((message) => {
                if (data.messageIds?.includes(message._id)) {
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
            break

          case 'channel_history':
            console.log(
              `📜 Channel history received: ${data.messages?.length || 0} messages`
            )
            setMessages(data.messages || [])
            break

          case 'online_users_list':
            const timestamp = new Date().toLocaleTimeString()
            console.log(`📋 [${timestamp}] Online users list received:`, {
              count: data.users?.length || 0,
              users: data.users?.map((u: any) => `${u.userName} (${u.userRole})`) || [],
              currentUser: session?.user?.email,
              currentRole: (session?.user as any)?.role,
            })

            if (data.users && data.users.length >= 0) {
              setOnlineUsers((prev) => {
                const newOnlineUsers = new Set([...prev])
                data.users.forEach((u: any) => {
                  newOnlineUsers.add(u.userId)
                })

                console.log(
                  `🔄 [${timestamp}] Merging onlineUsers: from ${prev.size} to ${newOnlineUsers.size} users`
                )
                return newOnlineUsers
              })

              setUserStatuses((prev) => {
                const newUserStatuses = { ...prev }
                data.users.forEach((u: any) => {
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
            }
            break

          case 'user_presence':
            const presenceTimestamp = new Date().toLocaleTimeString()
            console.log(`👤 [${presenceTimestamp}] User presence update received:`, {
              userId: data.userId,
              status: data.status,
              currentUser: session?.user?.email,
              lastSeen: data.lastSeen,
            })

            if (data.status === 'online') {
              setOnlineUsers((prev) => {
                const newSet = new Set([...prev, data.userId])
                console.log(
                  `🟢 [${presenceTimestamp}] Added to onlineUsers:`,
                  data.userId,
                  'Total online:',
                  newSet.size
                )
                return newSet
              })
              setUserStatuses((prev) => ({
                ...prev,
                [data.userId]: { isOnline: true, lastSeen: data.lastSeen },
              }))
            } else {
              console.log(
                `🔴 [${presenceTimestamp}] User ${data.userId} marked offline - scheduling delayed removal`
              )

              setTimeout(() => {
                setOnlineUsers((prev) => {
                  const newSet = new Set(prev)
                  if (newSet.has(data.userId)) {
                    newSet.delete(data.userId)
                    console.log(
                      `🔴 [${presenceTimestamp}] Delayed removal of ${data.userId} from onlineUsers`
                    )
                  }
                  return newSet
                })

                setUserStatuses((prev) => ({
                  ...prev,
                  [data.userId]: { isOnline: false, lastSeen: data.lastSeen },
                }))
              }, 3000)
            }
            break

          case 'user_online':
            console.log('👤 User came online:', data)
            setOnlineUsers((prev) => new Set(prev).add(data.userId))
            break

          case 'user_offline':
            console.log('👤 User went offline:', data)
            setOnlineUsers((prev) => {
              const newSet = new Set(prev)
              newSet.delete(data.userId)
              return newSet
            })
            break

          case 'error':
            console.error('❌ WebSocket error:', data.message)
            break

          default:
            console.warn('⚠️ Unknown message type:', data.type)
        }
      } catch (error) {
        console.error('❌ Error processing WebSocket message:', error)
      }
    }

    socket.addEventListener('message', handleMessage)

    return () => {
      socket.removeEventListener('message', handleMessage)
    }
  }, [socket, session])

  // Auto connect when session is available
  useEffect(() => {
    if (session?.user) {
      connect()
    } else {
      disconnect()
    }

    return () => {
      disconnect()
    }
  }, [session?.user?.id])

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      console.log('🔌 Disconnecting WebSocket...')
      socket.close()
      setIsConnected(false)
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = undefined
    }
  }, [socket])

  // Resynchronisation périodique et sur focus
  useEffect(() => {
    if (!socket || !isConnected) return

    const handleFocus = () => {
      console.log('🔄 Window focused, requesting online users refresh')
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'request_online_users' }))
      }
    }

    const interval = setInterval(() => {
      if (socket && isConnected && socket.readyState === WebSocket.OPEN) {
        console.log('🔄 Periodic resync, requesting online users')
        socket.send(JSON.stringify({ type: 'request_online_users' }))
      }
    }, 300000) // 5 minutes

    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('focus', handleFocus)
      clearInterval(interval)
    }
  }, [socket, isConnected])

  // Send message via WebSocket
  const sendMessage = useCallback(
    async (
      channelId: string,
      content: string,
      type: 'text' | 'image' | 'file' = 'text'
    ) => {
      if (!socket || !isConnected || socket.readyState !== WebSocket.OPEN) {
        throw new Error('WebSocket not connected')
      }

      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Message send timeout'))
        }, 10000)

        const message = {
          type: 'message',
          channelId,
          content: content.trim(),
          messageType: type,
        }

        socket.send(JSON.stringify(message))
        console.log('📤 Message sent via WebSocket:', message)

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

  // Join channel via WebSocket
  const joinChannel = useCallback(
    (channelId: string) => {
      if (!socket || !isConnected || socket.readyState !== WebSocket.OPEN) return

      console.log(`📺 Joining channel: ${channelId}`)
      socket.send(JSON.stringify({ 
        type: 'join_channel', 
        channelId 
      }))
    },
    [socket, isConnected]
  )

  // Leave channel via WebSocket
  const leaveChannel = useCallback(
    (channelId: string) => {
      if (!socket || !isConnected || socket.readyState !== WebSocket.OPEN) return

      console.log(`📺 Leaving channel: ${channelId}`)
      socket.send(JSON.stringify({ 
        type: 'leave_channel', 
        channelId 
      }))
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

  // Typing indicators via WebSocket
  const startTyping = useCallback(
    (channelId: string) => {
      if (!socket || !isConnected || socket.readyState !== WebSocket.OPEN) return

      socket.send(JSON.stringify({ 
        type: 'typing', 
        channelId, 
        isTyping: true 
      }))

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
      if (!socket || !isConnected || socket.readyState !== WebSocket.OPEN) return

      socket.send(JSON.stringify({ 
        type: 'typing', 
        channelId, 
        isTyping: false 
      }))

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = undefined
      }
    },
    [socket, isConnected]
  )

  // Mark messages as read via WebSocket
  const markMessagesAsRead = useCallback(
    (channelId: string, messageIds: string[]) => {
      if (!socket || !isConnected || messageIds.length === 0 || socket.readyState !== WebSocket.OPEN) return

      console.log('👁️ Marking messages as read:', { channelId, messageIds })
      socket.send(JSON.stringify({ 
        type: 'mark_read', 
        channelId, 
        messageIds 
      }))
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
