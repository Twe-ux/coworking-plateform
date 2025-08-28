'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useMessaging } from './use-messaging-socketio'

interface NotificationCounts {
  totalUnread: number
  messagesDMs: number
  channels: number
  channelBreakdown: Record<string, number>
}

export function useNotifications() {
  const { data: session } = useSession()
  const { socket, isConnected } = useMessaging()

  const [notificationCounts, setNotificationCounts] =
    useState<NotificationCounts>({
      totalUnread: 0,
      messagesDMs: 0,
      channels: 0,
      channelBreakdown: {},
    })

  // Load initial notification counts ONLY ONCE via REST API
  const loadInitialNotificationCounts = useCallback(async () => {
    if (!session?.user?.id) return

    try {
      console.log('📊 Loading initial notification counts from API (one-time only)')
      const response = await fetch('/api/messaging/notifications/counts')
      const data = await response.json()

      if (data.success) {
        setNotificationCounts(data.counts)
        console.log('✅ Initial notification counts loaded:', data.counts)
      }
    } catch (error) {
      console.error('❌ Error loading initial notification counts:', error)
    }
  }, [session?.user?.id])

  // Socket.IO real-time notification handling - NO POLLING!
  useEffect(() => {
    if (!socket || !isConnected) return

    console.log('🔔 Setting up real-time Socket.IO notification listeners')

    const handleInitialNotificationCounts = (counts: any) => {
      console.log('🔔 Initial notification counts received:', counts)
      setNotificationCounts(counts)
    }

    const handleNotificationIncrement = (data: any) => {
      console.log('🔔 Notification increment received:', data)
      setNotificationCounts((prev) => {
        const newCounts = { ...prev }

        // Update channel-specific counter
        const currentCount = prev.channelBreakdown[data.channelId] || 0
        newCounts.channelBreakdown = {
          ...prev.channelBreakdown,
          [data.channelId]: Math.max(0, currentCount + data.increment),
        }

        // Update totals based on channel type
        if (data.channelType === 'direct' || data.channelType === 'dm') {
          newCounts.messagesDMs = Math.max(0, prev.messagesDMs + data.increment)
        } else {
          newCounts.channels = Math.max(0, prev.channels + data.increment)
        }

        newCounts.totalUnread = newCounts.messagesDMs + newCounts.channels

        console.log('📊 Notification counts updated:', {
          increment: data.increment,
          channelId: data.channelId,
          channelType: data.channelType,
          newCounts
        })

        return newCounts
      })
    }

    const handleNotificationsRead = (data: any) => {
      console.log('👁️ Notifications read event received:', data)
      setNotificationCounts((prev) => {
        const channelCount = prev.channelBreakdown[data.channelId] || 0
        if (channelCount === 0) {
          console.log('ℹ️ No notifications to clear for channel:', data.channelId)
          return prev
        }

        const newCounts = { ...prev }

        // Reset channel-specific counter
        newCounts.channelBreakdown = {
          ...prev.channelBreakdown,
          [data.channelId]: 0,
        }

        // Reduce appropriate counter based on channel type
        if (data.channelType === 'direct' || data.channelType === 'dm') {
          newCounts.messagesDMs = Math.max(0, prev.messagesDMs - channelCount)
        } else {
          newCounts.channels = Math.max(0, prev.channels - channelCount)
        }

        newCounts.totalUnread = newCounts.messagesDMs + newCounts.channels

        console.log('📊 Notifications cleared:', {
          channelId: data.channelId,
          channelType: data.channelType,
          clearedCount: channelCount,
          newCounts
        })

        return newCounts
      })
    }

    // Add Socket.IO event listeners
    socket.on('initial_notification_counts', handleInitialNotificationCounts)
    socket.on('notification_increment', handleNotificationIncrement)
    socket.on('notifications_read', handleNotificationsRead)

    return () => {
      // Remove event listeners on cleanup
      socket.off('initial_notification_counts', handleInitialNotificationCounts)
      socket.off('notification_increment', handleNotificationIncrement)
      socket.off('notifications_read', handleNotificationsRead)
    }
  }, [socket, isConnected])

  // Load initial counts only once when component mounts or session changes
  useEffect(() => {
    if (session?.user?.id) {
      loadInitialNotificationCounts()
    }
  }, [session?.user?.id, loadInitialNotificationCounts])

  // Mark channel as read function with real-time Socket.IO updates
  const markChannelAsRead = useCallback(
    (channelId: string, channelType?: string) => {
      console.log('🔔 markChannelAsRead called:', { channelId, channelType })

      if (!session?.user?.id) {
        console.log('❌ Cannot mark channel as read: no user session')
        return
      }

      // Optimistic UI update - immediately clear notifications for better UX
      setNotificationCounts((prev) => {
        const channelCount = prev.channelBreakdown[channelId] || 0
        if (channelCount === 0) {
          console.log('ℹ️ No unread messages in channel', channelId)
          return prev
        }

        const newCounts = { ...prev }
        newCounts.channelBreakdown = {
          ...prev.channelBreakdown,
          [channelId]: 0,
        }

        // Reduce appropriate counter
        if (channelType === 'direct' || channelType === 'dm') {
          newCounts.messagesDMs = Math.max(0, prev.messagesDMs - channelCount)
        } else {
          newCounts.channels = Math.max(0, prev.channels - channelCount)
        }

        newCounts.totalUnread = newCounts.messagesDMs + newCounts.channels

        console.log('📊 Optimistic notification update:', {
          channelId,
          clearedCount: channelCount,
          newCounts
        })

        return newCounts
      })

      // The actual message read tracking is handled by the ChatWindow component
      // which calls markMessagesAsRead via Socket.IO when messages are viewed
    },
    [session?.user?.id]
  )

  // Removed loadNotificationCounts from return since we no longer need manual refreshing
  return {
    notificationCounts,
    markChannelAsRead,
  }
}
