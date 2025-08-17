'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu, X } from 'lucide-react'
import { MessagingSidebarContextual } from './messaging-sidebar-contextual'

interface MessagingMobileOptimizationsProps {
  activeNav: string
  children: React.ReactNode
}

export function MessagingMobileOptimizations({
  activeNav,
  children,
}: MessagingMobileOptimizationsProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (!isMobile) {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Mobile Header */}
      <div className="border-coffee-primary bg-background flex items-center justify-between border-b p-4">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0">
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="font-semibold">{activeNav}</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <MessagingSidebarContextual
              activeNav={activeNav}
              isVisible={true}
              className="h-full"
            />
          </SheetContent>
        </Sheet>
        <h1 className="text-lg font-semibold">CoWork Chat</h1>
        <div className="w-10" /> {/* Spacer for alignment */}
      </div>

      {/* Mobile Content */}
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  )
}
