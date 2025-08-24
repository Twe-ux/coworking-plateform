'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useMessaging } from './use-messaging'

interface NotificationCounts {
  totalUnread: number
  messagesDMs: number
  channels: number
  channelBreakdown: Record<string, number>
}

export function useNotifications() {
  const { data: session } = useSession()
  const { socket, isConnected, markMessagesAsRead } = useMessaging()

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

  // Écouter les mises à jour en temps réel via WebSocket
  useEffect(() => {
    if (!socket || !isConnected) return

    const handleWebSocketMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data)
        
        // Gérer les notifications d'incrémentation
        if (message.type === 'notification_increment') {
          const data = message.data
          setNotificationCounts((prev) => {
            const newCounts = { ...prev }

            // Mettre à jour le compteur par channel
            newCounts.channelBreakdown = {
              ...prev.channelBreakdown,
              [data.channelId]: Math.max(
                0,
                (prev.channelBreakdown[data.channelId] || 0) + data.increment
              ),
            }

            // Mettre à jour les totaux
            if (data.channelType === 'direct' || data.channelType === 'dm') {
              newCounts.messagesDMs = Math.max(0, prev.messagesDMs + data.increment)
            } else {
              newCounts.channels = Math.max(0, prev.channels + data.increment)
            }

            newCounts.totalUnread = newCounts.messagesDMs + newCounts.channels
            return newCounts
          })
        }
        
        // Gérer les événements de lecture
        if (message.type === 'messages_read') {
          console.log('🔔 Notification read event received:', message)
          setNotificationCounts((prev) => {
            const channelId = message.channelId
            const channelCount = prev.channelBreakdown[channelId] || 0
            if (channelCount === 0) return prev // Pas de changement nécessaire

            const newCounts = { ...prev }

            // Réinitialiser le compteur du channel
            newCounts.channelBreakdown = {
              ...prev.channelBreakdown,
              [channelId]: 0,
            }

            // Déterminer si c'est un DM ou un channel et réduire le bon compteur
            const channelType = message.channelType
            if (channelType === 'direct' || channelType === 'dm') {
              newCounts.messagesDMs = Math.max(0, prev.messagesDMs - channelCount)
            } else {
              newCounts.channels = Math.max(0, prev.channels - channelCount)
            }

            newCounts.totalUnread = newCounts.messagesDMs + newCounts.channels

            console.log('🔔 Notifications updated:', {
              before: prev,
              after: newCounts,
              channelCount,
            })

            return newCounts
          })
        }
      } catch (error) {
        // Ignore non-JSON messages or parsing errors
      }
    }

    socket.addEventListener('message', handleWebSocketMessage)

    return () => {
      socket.removeEventListener('message', handleWebSocketMessage)
    }
  }, [socket, isConnected])

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
