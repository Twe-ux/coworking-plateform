'use client'

import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useRef, useState } from 'react'

// Types pour next-ws
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
  socket: WebSocket | null
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
  
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  // Fonction de connexion WebSocket
  const connectWebSocket = useCallback(() => {
    if (!session?.user || wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    if (reconnectAttempts.current >= maxReconnectAttempts) {
      console.error('❌ Nombre maximum de tentatives de reconnexion atteint')
      setConnectionStatus('error')
      return
    }

    console.log('🚀 Connexion WebSocket next-ws...', {
      user: session.user.email,
      userId: session.user.id,
      attempt: reconnectAttempts.current + 1
    })

    try {
      setConnectionStatus('connecting')
      
      // Créer une nouvelle connexion WebSocket
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${protocol}//${window.location.host}/api/ws`
      
      const ws = new WebSocket(wsUrl)
      
      // Définir les headers d'authentification via le protocole WebSocket
      // Note: Les headers doivent être envoyés différemment avec next-ws
      ws.addEventListener('open', () => {
        console.log('✅ WebSocket connecté!')
        setIsConnected(true)
        setConnectionStatus('connected')
        reconnectAttempts.current = 0
        
        // Envoyer les données d'authentification
        ws.send(JSON.stringify({
          type: 'auth',
          data: {
            userId: session.user.id,
            userName: session.user.name,
            userEmail: session.user.email,
            userRole: session.user.role
          }
        }))

        // Demander la liste des utilisateurs en ligne
        ws.send(JSON.stringify({
          type: 'request_online_users',
          data: {}
        }))
      })

      ws.addEventListener('close', (event) => {
        console.log('❌ WebSocket fermé:', event.code, event.reason)
        setIsConnected(false)
        setConnectionStatus('disconnected')
        setCurrentTypingUsers([])
        
        // Tentative de reconnexion automatique
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
          console.log(`🔄 Reconnexion dans ${delay}ms...`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++
            connectWebSocket()
          }, delay)
        }
      })

      ws.addEventListener('error', (error) => {
        console.error('❌ Erreur WebSocket:', error)
        setConnectionStatus('error')
      })

      ws.addEventListener('message', (event) => {
        try {
          const message = JSON.parse(event.data)
          handleWebSocketMessage(message)
        } catch (error) {
          console.error('❌ Erreur parsing message WebSocket:', error)
        }
      })

      wsRef.current = ws

    } catch (error) {
      console.error('❌ Erreur création WebSocket:', error)
      setConnectionStatus('error')
    }
  }, [session])

  // Gestionnaire des messages WebSocket
  const handleWebSocketMessage = useCallback((message: any) => {
    console.log('📥 Message WebSocket reçu:', message.type)

    switch (message.type) {
      case 'new_message':
        console.log('📨 Nouveau message:', message.data._id, 'pour channel:', message.data.channel)
        setMessages(prev => {
          // Éviter les doublons
          const exists = prev.find(m => m._id === message.data._id)
          if (exists) {
            console.log('⚠️ Message déjà présent, ignoré:', message.data._id)
            return prev
          }
          const updated = [...prev, message.data]
          console.log('✅ Message ajouté, total messages:', updated.length)
          return updated
        })
        break

      case 'channel_history':
        console.log('📚 Historique channel:', message.data.messages.length, 'messages pour channel:', message.data.channelId)
        setMessages(message.data.messages || [])
        break

      case 'user_typing':
        console.log('⌨️ Indicateur frappe:', message.data)
        if (message.data.isTyping) {
          setCurrentTypingUsers(prev => {
            if (!prev.includes(message.data.userName)) {
              return [...prev, message.data.userName]
            }
            return prev
          })
        } else {
          setCurrentTypingUsers(prev => 
            prev.filter(user => user !== message.data.userName)
          )
        }
        break

      case 'user_presence':
        console.log('👤 Présence utilisateur:', message.data)
        if (message.data.status === 'online') {
          setOnlineUsers(prev => new Set([...prev, message.data.userId]))
        } else {
          setOnlineUsers(prev => {
            const newSet = new Set(prev)
            newSet.delete(message.data.userId)
            return newSet
          })
        }
        break

      case 'online_users_list':
        console.log('👥 Liste utilisateurs en ligne:', message.data.users.length)
        const userIds = message.data.users.map((u: any) => u.userId)
        setOnlineUsers(new Set(userIds))
        break

      case 'messages_read':
        console.log('✅ Messages lus par:', message.data.userId)
        setMessages(prev => prev.map(msg => {
          if (message.data.messageIds.includes(msg._id)) {
            const updatedReadBy = [...(msg.readBy || [])]
            if (!updatedReadBy.some(r => r.user === message.data.userId)) {
              updatedReadBy.push({ 
                user: message.data.userId, 
                readAt: new Date(message.data.readAt) 
              })
            }
            return { ...msg, readBy: updatedReadBy }
          }
          return msg
        }))
        break

      case 'notification_increment':
        console.log('🔔 Notification reçue:', message.data)
        // Les notifications sont gérées par le hook use-notifications
        break

      case 'notifications_read':
        console.log('👁️ Notifications marquées comme lues:', message.data)
        // Les notifications sont gérées par le hook use-notifications
        break

      case 'error':
        console.error('🚫 Erreur serveur WebSocket:', message.data.message)
        break

      default:
        console.warn('⚠️ Type de message WebSocket inconnu:', message.type)
    }
  }, [])

  // Auto-connexion
  useEffect(() => {
    if (session?.user && connectionStatus === 'disconnected') {
      connectWebSocket()
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [session, connectWebSocket, connectionStatus])

  // Nettoyage à la fermeture
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [])

  // Fonctions WebSocket
  const sendWebSocketMessage = useCallback((type: string, data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, data }))
      return true
    }
    console.error('❌ WebSocket non connecté')
    return false
  }, [])

  const sendMessage = useCallback((channelId: string, content: string, messageType: string = 'text', attachments: any[] = []) => {
    if (!content.trim()) return

    console.log('📤 Envoi message via WebSocket:', { 
      channelId, 
      content, 
      isConnected: wsRef.current?.readyState === WebSocket.OPEN,
      readyState: wsRef.current?.readyState 
    })
    
    const success = sendWebSocketMessage('send_message', {
      channelId,
      content: content.trim(),
      messageType,
      attachments
    })
    
    if (success) {
      console.log('✅ Message envoyé avec succès via WebSocket')
    } else {
      console.error('❌ Échec envoi message WebSocket')
    }
  }, [sendWebSocketMessage])

  const loadMessages = useCallback((channelId: string) => {
    console.log('📥 Chargement messages via WebSocket:', channelId)
    sendWebSocketMessage('join_channel', { channelId })
  }, [sendWebSocketMessage])

  const joinChannel = useCallback((channelId: string) => {
    console.log('🚪 Rejoindre channel:', channelId)
    sendWebSocketMessage('join_channel', { channelId })
  }, [sendWebSocketMessage])

  const leaveChannel = useCallback((channelId: string) => {
    console.log('🚪 Quitter channel:', channelId)
    // next-ws n'a pas de concept de "room", pas d'action nécessaire
  }, [])

  const startTyping = useCallback((channelId: string) => {
    sendWebSocketMessage('typing_start', { channelId })
  }, [sendWebSocketMessage])

  const stopTyping = useCallback((channelId: string) => {
    sendWebSocketMessage('typing_stop', { channelId })
  }, [sendWebSocketMessage])

  const markMessagesAsRead = useCallback((channelId: string, messageIds: string[]) => {
    console.log('👁️ Marquer messages comme lus:', { channelId, count: messageIds.length })
    sendWebSocketMessage('mark_read', { channelId, messageIds })
  }, [sendWebSocketMessage])

  const reconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setIsConnected(false)
    setConnectionStatus('disconnected')
    reconnectAttempts.current = 0
    
    setTimeout(() => {
      connectWebSocket()
    }, 1000)
  }, [connectWebSocket])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setIsConnected(false)
    setConnectionStatus('disconnected')
    setCurrentTypingUsers([])
    reconnectAttempts.current = maxReconnectAttempts // Empêcher la reconnexion auto
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  // Stubs pour compatibilité
  const loadMoreMessages = useCallback(() => {
    console.log('📄 Load more messages pas encore implémenté')
  }, [])

  const createDirectMessage = useCallback(async (targetUserId: string) => {
    console.log('💬 Création DM via API REST (WebSocket ne gère pas la création de channels)')
    
    try {
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
  }, [])

  const createChannel = useCallback(async () => {
    console.log('🏗️ Création channel pas implémentée')
    return false
  }, [])

  const updateChannel = useCallback(() => {
    console.log('✏️ Mise à jour channel pas implémentée')
  }, [])

  return {
    isConnected,
    socket: wsRef.current,
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