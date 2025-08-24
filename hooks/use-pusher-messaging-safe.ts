'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

// Import dynamique de usePusherMessaging pour éviter les erreurs SSR
const usePusherMessagingSafe = () => {
  const { data: session } = useSession()
  const [isClient, setIsClient] = useState(false)
  const [messagingHook, setMessagingHook] = useState<any>(null)

  // S'assurer qu'on est côté client
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Import dynamique du hook seulement côté client
  useEffect(() => {
    if (!isClient) return

    const loadMessagingHook = async () => {
      try {
        const { usePusherMessaging } = await import('./use-pusher-messaging')
        setMessagingHook(() => usePusherMessaging)
      } catch (error) {
        console.error('Failed to load messaging hook:', error)
      }
    }

    loadMessagingHook()
  }, [isClient])

  // Retourner les valeurs par défaut si pas encore chargé
  if (!isClient || !messagingHook) {
    return {
      isConnected: false,
      messages: [],
      sendMessage: async () => {},
      loadMessages: async () => [],
      joinChannel: () => {},
      joinChannelAndWait: async () => {},
      leaveChannel: () => {},
      directMessages: [],
      createDirectMessage: async () => null,
      refreshDirectMessages: async () => {},
      startTyping: () => {},
      stopTyping: () => {},
      typingUsers: {},
      onlineUsers: new Set(),
      userStatuses: [],
      getUserOnlineStatus: () => false,
      markMessagesAsRead: () => {},
      connect: () => {},
      disconnect: () => {},
    }
  }

  // Utiliser le hook réel une fois chargé
  return messagingHook()
}

export { usePusherMessagingSafe as usePusherMessaging }