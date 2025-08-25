'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'

// Minimal chat interface for deployment (socket.io disabled)
export default function ImprovedChatInterface() {
  const { data: session } = useSession()
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    console.log('🔌 Socket.IO temporarily disabled for deployment')
  }, [])

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-xl font-semibold">Chat Interface</h1>
          <p className="text-sm text-muted-foreground">
            Socket.IO temporarily disabled for deployment
          </p>
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              Real-time messaging is temporarily disabled
            </p>
            <Button disabled>
              Enable Real-time Chat (Coming Soon)
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}