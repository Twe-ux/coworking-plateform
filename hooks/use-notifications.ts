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

  // FIXME: Calculer les notifications basées sur les messages en temps réel
  useEffect(() => {
    if (!session?.user?.id || !isConnected || messages.length === 0) return
    
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
      
      // Vérifier si je l'ai lu
      const readByMe = message.readBy?.some(read => read.user === userId)
      if (readByMe) return
      
      // C'est un message non lu
      const channelId = message.channel
      channelBreakdown[channelId] = (channelBreakdown[channelId] || 0) + 1
      totalUnread++
      
      // Déterminer le type de channel (à améliorer avec les vraies données)
      if (channelId.includes('Direct') || channelId.includes('dm')) {
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
    
    console.log('🔔 Updated notification counts:', newCounts)
    setNotificationCounts(newCounts)
    
  }, [messages, session?.user?.id, isConnected])

  // Charger les compteurs au démarrage
  useEffect(() => {
    loadNotificationCounts()
  }, [loadNotificationCounts])

  // Fonction pour marquer un channel comme lu avec synchronisation serveur
  const markChannelAsRead = useCallback(
    async (channelId: string, channelType?: string) => {
      console.log('🔔 markChannelAsRead called:', { channelId, channelType })

      if (!session?.user?.id) {
        console.log('❌ Cannot mark channel as read: no user session')
        return
      }

      // Approche simplifiée : récupérer les messages récents du channel
      try {
        const response = await fetch('/api/messaging/messages')
        const data = await response.json()

        if (data.success && data.messages) {
          // Filtrer les messages de ce channel qui ne sont pas lus par l'utilisateur
          const channelMessages = data.messages.filter(
            (msg: any) =>
              msg.channel === channelId &&
              !msg.readBy?.some((r: any) => r.user === session.user.id)
          )

          if (channelMessages.length > 0) {
            const messageIds = channelMessages.map((msg: any) => msg._id)
            console.log(
              '📧 Marking',
              messageIds.length,
              'messages as read via markMessagesAsRead'
            )
            markMessagesAsRead(channelId, messageIds)
          } else {
            console.log('✅ No unread messages in channel', channelId)
          }
        }
      } catch (error) {
        console.error('❌ Error fetching messages:', error)
        console.log('🔄 Using immediate local update')

        // Mise à jour locale immédiate
        setNotificationCounts((prev) => {
          const channelCount = prev.channelBreakdown[channelId] || 0
          if (channelCount === 0) return prev

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

          console.log('🔔 Local update: new counts', newCounts)
          return newCounts
        })
      }
    },
    [session?.user?.id, markMessagesAsRead]
  )

  return {
    notificationCounts,
    loadNotificationCounts,
    markChannelAsRead,
  }
}
