'use client'

import { useState, useEffect } from 'react'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { SidebarProvider } from '@/components/ui/sidebar'
import { MessagingSidebarMain } from './messaging-sidebar-main'
import { MessagingSidebarContextual } from './messaging-sidebar-contextual'
import { ChatArea } from '../modern/chat-area'
import { MessagingMobileOptimizations } from './messaging-mobile-optimizations'

interface MessagingInterfaceCompleteProps {
  className?: string
}

export function MessagingInterfaceComplete({
  className = '',
}: MessagingInterfaceCompleteProps) {
  const [activeNav, setActiveNav] = useState('Messages')
  const [showContextual, setShowContextual] = useState(true)
  const [chatAreaCollapsed, setChatAreaCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      // Sur mobile, masquer par défaut la sidebar contextuelle
      if (mobile) {
        setShowContextual(false)
      } else {
        setShowContextual(true)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleNavChange = (navItem: string) => {
    setActiveNav(navItem)
    // Si la zone de chat est effondrée, réafficher la sidebar contextuelle
    if (chatAreaCollapsed && !isMobile) {
      setShowContextual(true)
    }
  }

  const handleChatAreaResize = (size: number) => {
    // Si la zone de chat devient très petite (< 20%), masquer la sidebar contextuelle
    if (size < 20) {
      setChatAreaCollapsed(true)
      setShowContextual(false)
    } else {
      setChatAreaCollapsed(false)
      if (!isMobile) {
        setShowContextual(true)
      }
    }
  }

  // Sur mobile, utiliser le composant d'optimisation mobile
  if (isMobile) {
    return (
      <MessagingMobileOptimizations activeNav={activeNav}>
        <div className="border-coffee-primary bg-background h-full border-r">
          <ChatArea
            activeChannelId="general"
            onSendMessage={(message) => {
              console.log('Message envoyé:', message)
            }}
          />
        </div>
      </MessagingMobileOptimizations>
    )
  }

  // Interface desktop complète
  return (
    <div className={`flex h-screen ${className}`}>
      {/* Sidebar principale - toujours visible sur desktop */}
      <SidebarProvider defaultOpen={false} className="min-h-screen">
        <MessagingSidebarMain
          variant="floating"
          onNavChange={handleNavChange}
          className="z-10"
        />
      </SidebarProvider>

      {/* Contenu principal avec panels redimensionnables */}
      <div className="flex flex-1">
        <ResizablePanelGroup direction="horizontal" className="min-h-screen">
          {/* Sidebar contextuelle - masquable */}
          {showContextual && (
            <>
              <ResizablePanel
                defaultSize={25}
                minSize={15}
                maxSize={40}
                className="min-w-64"
              >
                <MessagingSidebarContextual
                  activeNav={activeNav}
                  isVisible={showContextual}
                  className="h-full"
                />
              </ResizablePanel>
              <ResizableHandle
                withHandle
                className="border-coffee-primary/20"
              />
            </>
          )}

          {/* Zone de chat principale */}
          <ResizablePanel
            defaultSize={showContextual ? 75 : 100}
            minSize={20}
            onResize={handleChatAreaResize}
          >
            <div className="border-coffee-primary bg-background h-full border-r">
              <ChatArea
                activeChannelId="general"
                onSendMessage={(message) => {
                  console.log('Message envoyé:', message)
                }}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}
