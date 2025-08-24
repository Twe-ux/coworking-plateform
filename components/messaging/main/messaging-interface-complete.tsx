'use client'

import { useState, useEffect } from 'react'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { MessagingSidebarMain } from './messaging-sidebar-main'
import { MessagingSidebarContextual } from './messaging-sidebar-contextual'
// import { ChatArea } from '../modern/chat-area' // Temporairement commenté pour Pusher migration
import { MessagingMobileOptimizations } from './messaging-mobile-optimizations'

interface MessagingInterfaceCompleteProps {
  className?: string
}

export function MessagingInterfaceComplete({
  className = '',
}: MessagingInterfaceCompleteProps) {
  const [activeNav, setActiveNav] = useState('Messages')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleNavChange = (navItem: string) => {
    setActiveNav(navItem)
  }

  // Sur mobile, utiliser le composant d'optimisation mobile
  if (isMobile) {
    return (
      <MessagingMobileOptimizations activeNav={activeNav}>
        <div className="border-coffee-primary bg-background h-full border-r">
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Interface de chat mobile (en développement)</p>
          </div>
        </div>
      </MessagingMobileOptimizations>
    )
  }

  // Interface desktop complète avec structure exacte demandée
  return (
    <div className={`flex h-screen gap-2 ${className}`}>
      {/* Sidebar Navigation (gauche) - Icons seulement avec hover */}
      <SidebarProvider defaultOpen={false} className="min-h-screen">
        <MessagingSidebarMain
          variant="floating"
          collapsible="icon"
          onNavChange={handleNavChange}
          className="z-10"
        />

        {/* Sidebar Contenu (milieu) - Contenu selon sélection navigation */}
        <SidebarInset className="min-h-screen w-80 max-w-80 flex-shrink-0">
          <MessagingSidebarContextual
            activeNav={activeNav}
            isVisible={true}
            className="h-full w-full"
          />
        </SidebarInset>
      </SidebarProvider>

      {/* Chat Area (droite) - Grande fenêtre pour le tchat */}
      <div className="min-w-0 flex-1">
        <div className="border-coffee-primary bg-background h-full rounded-lg border">
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Interface de chat (en développement avec Pusher)</p>
          </div>
        </div>
      </div>
    </div>
  )
}
