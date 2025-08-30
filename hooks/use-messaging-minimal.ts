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
  loadTypingUsers: (channelId: string) => Promise<void>
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

// Minimal hook with basic presence management
export function useMessaging(): UseMessagingReturn {
  const { data: session } = useSession()
  
  // States
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([])
  const [userStatuses, setUserStatuses] = useState<UserStatus[]>([])
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const [currentTypingUsers, setCurrentTypingUsers] = useState<string[]>([])

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

  const sendMessage = useCallback(async (
    channelId: string, 
    content: string, 
    messageType: string = 'text', 
    attachments: any[] = []
  ) => {
    if (!session?.user?.id || !channelId || !content.trim()) {
      console.error('❌ Données manquantes pour l\'envoi')
      return
    }

    try {
      console.log('📨 Envoi message:', { channelId, content })

      const response = await fetch('/api/messaging/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId,
          content: content.trim(),
          messageType,
          attachments
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Erreur ${response.status}`)
      }

      const data = await response.json()
      console.log('✅ Message envoyé:', data.message._id)

      setMessages(prev => [...prev, data.message])

    } catch (error) {
      console.error('❌ Erreur envoi message:', error)
    }
  }, [session])

  const loadMessages = useCallback(async (channelId: string) => {
    if (!session?.user?.id || !channelId) {
      console.error('❌ Données manquantes pour charger les messages', { session: !!session?.user?.id, channelId })
      return
    }

    try {
      console.log('📥 Chargement messages pour channel:', channelId)
      const url = `/api/messaging/messages?channelId=${encodeURIComponent(channelId)}&limit=50`
      console.log('🔗 URL de requête:', url)

      const response = await fetch(url)
      console.log('📡 Réponse status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Erreur API:', response.status, errorText)
        try {
          const errorData = JSON.parse(errorText)
          throw new Error(errorData.message || `Erreur ${response.status}`)
        } catch {
          throw new Error(`Erreur ${response.status}: ${errorText}`)
        }
      }

      const data = await response.json()
      console.log('✅ Messages chargés:', data.messages?.length || 0)

      setMessages(data.messages || [])

    } catch (error) {
      console.error('❌ Erreur chargement messages:', error)
      setMessages([])
    }
  }, [session])
  const loadMoreMessages = useCallback(() => {}, [])
  const joinChannel = useCallback(() => {}, [])
  const leaveChannel = useCallback(() => {}, [])
  const startTyping = useCallback(async (channelId: string) => {
    if (!session?.user?.id || !channelId) return

    try {
      await fetch('/api/messaging/typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId,
          isTyping: true
        })
      })
    } catch (error) {
      console.error('❌ Erreur start typing:', error)
    }
  }, [session])

  const stopTyping = useCallback(async (channelId: string) => {
    if (!session?.user?.id || !channelId) return

    try {
      await fetch('/api/messaging/typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId,
          isTyping: false
        })
      })
    } catch (error) {
      console.error('❌ Erreur stop typing:', error)
    }
  }, [session])

  const loadTypingUsers = useCallback(async (channelId: string) => {
    if (!session?.user?.id || !channelId) return

    try {
      const response = await fetch(`/api/messaging/typing?channelId=${channelId}`)
      if (response.ok) {
        const data = await response.json()
        setCurrentTypingUsers(data.typingUsers || [])
      }
    } catch (error) {
      console.error('❌ Erreur load typing:', error)
    }
  }, [session])
  const markMessagesAsRead = useCallback(async (channelId: string, messageIds?: string[]) => {
    if (!session?.user?.id || !channelId) {
      console.error('❌ Données manquantes pour marquer comme lus')
      return
    }

    try {
      console.log('👁️ Marquage messages comme lus:', { channelId, messageIds })

      const response = await fetch('/api/messaging/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId,
          messageIds
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Erreur ${response.status}`)
      }

      const data = await response.json()
      console.log('✅ Messages marqués comme lus:', data.markedCount)

    } catch (error) {
      console.error('❌ Erreur marquage lecture:', error)
    }
  }, [session])
  const clearMessages = useCallback(() => {}, [])
  const disconnect = useCallback(() => {}, [])
  const reconnect = useCallback(() => {}, [])
  const updateChannel = useCallback(() => {}, [])

  const createDirectMessage = useCallback(async (targetUserId: string) => {
    if (!session?.user?.id) {
      console.error('❌ Pas de session pour créer un DM')
      return null
    }

    try {
      console.log('🚀 Création DM avec utilisateur:', targetUserId)
      
      const response = await fetch('/api/messaging/simple-create-channel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `DM avec utilisateur ${targetUserId}`,
          type: 'direct',
          targetUserId: targetUserId
        })
      })
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (data.success && data.channel) {
        console.log('✅ DM créé/récupéré:', data.channel)
        return { id: data.channel._id.toString() }
      }
      
      throw new Error('Réponse invalide de l\'API')
      
    } catch (error) {
      console.error('❌ Erreur création DM:', error)
      return null
    }
  }, [session])

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
    loadTypingUsers,
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