'use client'

import React, { createContext, useContext } from 'react'
import { useMessaging as useMessagingSocketIO } from '@/hooks/use-messaging-socketio'

const MessagingContext = createContext<ReturnType<typeof useMessagingSocketIO> | null>(null)

export function MessagingProvider({ children }: { children: React.ReactNode }) {
  const messagingData = useMessagingSocketIO()
  
  return (
    <MessagingContext.Provider value={messagingData}>
      {children}
    </MessagingContext.Provider>
  )
}

export function useMessaging() {
  const context = useContext(MessagingContext)
  if (!context) {
    throw new Error('useMessaging must be used within a MessagingProvider')
  }
  return context
}