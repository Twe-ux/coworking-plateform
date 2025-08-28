'use client'

import React, { createContext, useContext } from 'react'
import { useNotifications as useNotificationsNative } from '@/hooks/use-notifications'

const NotificationsContext = createContext<ReturnType<typeof useNotificationsNative> | null>(null)

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const notificationsData = useNotificationsNative()
  
  return (
    <NotificationsContext.Provider value={notificationsData}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider')
  }
  return context
}