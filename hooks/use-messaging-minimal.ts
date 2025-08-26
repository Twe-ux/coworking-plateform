'use client'

import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useRef, useState } from 'react'

// Minimal types for deployment
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
  socket: any | null
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

// Minimal hook with basic presence management
export function useMessaging(): UseMessagingReturn {
  const { data: session } = useSession()
  
  // States
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([])
  const [userStatuses, setUserStatuses] = useState<UserStatus[]>([])
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())

  // Update user presence on session change
  useEffect(() => {
    const updatePresence = async (status: 'online' | 'offline') => {
      if (!session?.user?.id) return
      
      try {
        const response = await fetch('/api/messaging/presence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        })
        
        if (response.ok) {
          console.log(`✅ Statut mis à jour: ${status}`)
          setIsConnected(status === 'online')
        } else {
          console.error(`❌ Erreur mise à jour statut: ${response.status}`)
        }
      } catch (error) {
        console.error('❌ Erreur mise à jour présence:', error)
      }
    }

    if (session?.user) {
      // Set user as online when session is active
      updatePresence('online')

      // Set user as offline when page unloads
      const handleBeforeUnload = () => {
        navigator.sendBeacon('/api/messaging/presence', JSON.stringify({ status: 'offline' }))
      }

      // Set user as offline when page becomes hidden
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
          updatePresence('offline')
        } else if (document.visibilityState === 'visible') {
          updatePresence('online')
        }
      }

      window.addEventListener('beforeunload', handleBeforeUnload)
      document.addEventListener('visibilitychange', handleVisibilityChange)

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload)
        document.removeEventListener('visibilitychange', handleVisibilityChange)
        // Set offline on cleanup
        updatePresence('offline')
      }
    }
  }, [session])

  // Periodic presence update to keep user online
  useEffect(() => {
    if (!session?.user?.id) return

    const keepAlive = setInterval(async () => {
      if (document.visibilityState === 'visible') {
        try {
          await fetch('/api/messaging/presence', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'online' })
          })
        } catch (error) {
          console.error('❌ Erreur keep-alive présence:', error)
        }
      }
    }, 30000) // Every 30 seconds

    return () => clearInterval(keepAlive)
  }, [session])

  // Placeholder functions that do nothing
  const sendMessage = useCallback(() => {
    console.log('Messaging temporarily disabled for deployment')
  }, [])

  const loadMessages = useCallback(() => {}, [])
  const loadMoreMessages = useCallback(() => {}, [])
  const joinChannel = useCallback(() => {}, [])
  const leaveChannel = useCallback(() => {}, [])
  const startTyping = useCallback(() => {}, [])
  const stopTyping = useCallback(() => {}, [])
  const markMessagesAsRead = useCallback(() => {}, [])
  const clearMessages = useCallback(() => {}, [])
  const disconnect = useCallback(() => {}, [])
  const reconnect = useCallback(() => {}, [])
  const updateChannel = useCallback(() => {}, [])

  const createDirectMessage = useCallback(async () => {
    return null
  }, [])

  const createChannel = useCallback(async () => {
    return false
  }, [])

  return {
    isConnected,
    socket: null,
    connectionStatus: 'disconnected',
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