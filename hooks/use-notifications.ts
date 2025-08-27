'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useMessaging } from './use-messaging-nextws'

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

  // Recharger les notifications périodiquement (réduit avec WebSocket)
  useEffect(() => {
    if (!session?.user?.id) return

    // Charger initialement
    loadNotificationCounts()

    // Si WebSocket n'est pas connecté, faire du polling réduit
    if (!isConnected) {
      const interval = setInterval(() => {
        loadNotificationCounts()
      }, 30000) // 30 secondes au lieu de 15 quand WebSocket fonctionne

      return () => clearInterval(interval)
    }
  }, [session?.user?.id, loadNotificationCounts, isConnected])

  // Logique WebSocket next-ws pour les notifications
  useEffect(() => {
    if (!socket || !isConnected) return

    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data)
        
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

        if (message.type === 'notifications_read') {
          const data = message.data
          console.log('🔔 Notification read event received:', data)
          setNotificationCounts((prev) => {
            const channelCount = prev.channelBreakdown[data.channelId] || 0
            if (channelCount === 0) return prev // Pas de changement nécessaire

            const newCounts = { ...prev }

            // Réinitialiser le compteur du channel
            newCounts.channelBreakdown = {
              ...prev.channelBreakdown,
              [data.channelId]: 0,
            }

            // Déterminer si c'est un DM ou un channel et réduire le bon compteur
            if (data.channelType === 'direct' || data.channelType === 'dm') {
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
        console.error('Erreur parsing message WebSocket notifications:', error)
      }
    }

    socket.addEventListener('message', handleMessage)

    return () => {
      socket.removeEventListener('message', handleMessage)
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

      // Approche WebSocket-first : faire une mise à jour locale immédiate
      // Le WebSocket se charge de synchroniser les messages lus côté serveur
      console.log('🔔 Marking channel as read via local update (WebSocket-first approach)')
      
      // Mise à jour locale immédiate
      setNotificationCounts((prev) => {
        const channelCount = prev.channelBreakdown[channelId] || 0
        if (channelCount === 0) {
          console.log('✅ No unread messages in channel', channelId)
          return prev
        }

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

        console.log('🔔 Local update: new counts', newCounts, `(cleared ${channelCount} notifications)`)
        return newCounts
      })

      // Le marquage des messages individuels est géré par le composant ChatWindow
      // qui utilise markMessagesAsRead via WebSocket quand il reçoit les messages
    },
    [session?.user?.id, markMessagesAsRead]
  )

  return {
    notificationCounts,
    loadNotificationCounts,
    markChannelAsRead,
  }
}
