'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { usePusherMessaging } from './use-pusher-messaging'

interface NotificationCounts {
  totalUnread: number
  messagesDMs: number
  channels: number
  channelBreakdown: Record<string, number>
}

export function useNotifications() {
  const { data: session } = useSession()
  const { isConnected, markMessagesAsRead, messages } = usePusherMessaging()

  const [notificationCounts, setNotificationCounts] =
    useState<NotificationCounts>({
      totalUnread: 0,
      messagesDMs: 0,
      channels: 0,
      channelBreakdown: {},
    })

  // Charger les compteurs initiaux
  const loadNotificationCounts = useCallback(async () => {
    if (!session?.user?.id) return

    try {
      const response = await fetch('/api/messaging/notifications/counts')
      const data = await response.json()

      if (data.success) {
        setNotificationCounts(data.counts)
      }
    } catch (error) {
      console.error('Erreur chargement notifications:', error)
    }
  }, [session?.user?.id])

  // FIXME: Calculer les notifications en temps réel avec débounce pour éviter les mises à jour trop fréquentes
  useEffect(() => {
    if (!session?.user?.id) return
    
    // Toujours calculer même si pas connecté (utiliser les messages en cache)
    console.log('🔔 Recalculating notifications from', messages.length, 'messages')
    
    const userId = session.user.id
    const channelBreakdown: Record<string, number> = {}
    let totalUnread = 0
    let messagesDMs = 0
    let channels = 0
    
    // Compter les messages non lus par channel
    messages.forEach(message => {
      // Ignorer mes propres messages
      if (message.sender._id === userId) return
      
      // Vérifier si je l'ai lu - IMPORTANT: vérifier readBy correctement
      const isReadByMe = message.readBy?.some(read => {
        // Essayer plusieurs formats d'ID au cas où
        return read.user === userId || read.user.toString() === userId
      }) ?? false
      
      if (isReadByMe) {
        console.log('💭 Message', message._id, 'already read by', userId)
        return
      }
      
      // C'est un message non lu
      console.log('🔔 Unread message in channel', message.channel, ':', message.content.substring(0, 50))
      const channelId = message.channel
      channelBreakdown[channelId] = (channelBreakdown[channelId] || 0) + 1
      totalUnread++
      
      // Déterminer le type de channel de manière plus robuste
      // Utiliser une requête API pour obtenir le type exact si nécessaire
      if (channelId.toLowerCase().includes('direct') || channelId.toLowerCase().includes('dm')) {
        messagesDMs++
      } else {
        channels++
      }
    })
    
    const newCounts = {
      totalUnread,
      messagesDMs, 
      channels,
      channelBreakdown,
    }
    
    // Ne mettre à jour que si les counts ont changé
    setNotificationCounts(prevCounts => {
      const hasChanged = JSON.stringify(prevCounts) !== JSON.stringify(newCounts)
      if (hasChanged) {
        console.log('🔔 Notification counts changed:', {
          from: prevCounts,
          to: newCounts
        })
        return newCounts
      }
      return prevCounts
    })
    
  }, [messages, session?.user?.id])

  // Charger les compteurs au démarrage
  useEffect(() => {
    loadNotificationCounts()
  }, [loadNotificationCounts])

  // Fonction pour marquer un channel comme lu avec synchronisation serveur améliorée
  const markChannelAsRead = useCallback(
    async (channelId: string, channelType?: string) => {
      console.log('🔔 markChannelAsRead called:', { channelId, channelType })

      if (!session?.user?.id) {
        console.log('❌ Cannot mark channel as read: no user session')
        return
      }

      const userId = session.user.id
      
      // 1. Trouver les messages non lus de ce channel dans notre state local
      const unreadMessages = messages.filter(msg => {
        if (msg.channel !== channelId) return false
        if (msg.sender._id === userId) return false // Mes propres messages
        
        const isReadByMe = msg.readBy?.some(read => 
          read.user === userId || read.user.toString() === userId
        ) ?? false
        
        return !isReadByMe
      })
      
      console.log('📧 Found', unreadMessages.length, 'unread messages in channel', channelId)
      
      if (unreadMessages.length > 0) {
        const messageIds = unreadMessages.map(msg => msg._id)
        console.log('📧 Marking messages as read:', messageIds)
        
        // 2. Marquer via l'API - cela déclenchera l'event Pusher
        markMessagesAsRead(channelId, messageIds)
      }
      
      // 3. Mise à jour locale immédiate pour les badges (optimiste)
      setNotificationCounts(prev => {
        const channelCount = prev.channelBreakdown[channelId] || 0
        if (channelCount === 0) {
          console.log('💭 Channel', channelId, 'already has 0 unread messages')
          return prev
        }
        
        console.log('🔔 Optimistically clearing', channelCount, 'notifications for channel', channelId)
        
        const newCounts = { ...prev }
        newCounts.channelBreakdown = {
          ...prev.channelBreakdown,
          [channelId]: 0,
        }

        // Réduire le bon compteur selon le type
        if (channelType === 'direct' || channelType === 'dm') {
          newCounts.messagesDMs = Math.max(0, prev.messagesDMs - channelCount)
        } else {
          newCounts.channels = Math.max(0, prev.channels - channelCount)
        }

        newCounts.totalUnread = newCounts.messagesDMs + newCounts.channels

        console.log('🔔 New notification counts:', newCounts)
        return newCounts
      })
    },
    [session?.user?.id, markMessagesAsRead, messages]
  )

  return {
    notificationCounts,
    loadNotificationCounts,
    markChannelAsRead,
  }
}
