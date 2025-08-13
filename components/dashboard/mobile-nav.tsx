'use client'

import { cn } from '@/lib/utils'
import { useSidebar } from '@/components/dashboard/admin/advanced/ui/sidebar'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import * as React from 'react'
import {
  Home,
  Calendar,
  MapPin,
  Users,
  Settings,
  BarChart3,
  Shield,
  Building,
  UserCheck,
  FileText,
} from 'lucide-react'

interface MobileNavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  roles: string[]
}

const mobileNavItems: MobileNavItem[] = [
  {
    href: '/dashboard',
    label: 'Accueil',
    icon: Home,
    roles: ['client']
  },
  {
    href: '/dashboard/staff',
    label: 'Staff',
    icon: Building,
    roles: ['staff']
  },
  {
    href: '/dashboard/manager',
    label: 'Manager',
    icon: BarChart3,
    roles: ['manager']
  },
  {
    href: '/dashboard/admin',
    label: 'Admin',
    icon: Shield,
    roles: ['admin']
  },
  {
    href: '/reservation',
    label: 'Réserver',
    icon: Calendar,
    roles: ['client', 'staff', 'manager', 'admin']
  },
  {
    href: '/spaces',
    label: 'Espaces',
    icon: MapPin,
    roles: ['client', 'staff', 'manager', 'admin']
  },
  {
    href: '/dashboard/admin/users',
    label: 'Utilisateurs',
    icon: Users,
    roles: ['admin']
  },
  {
    href: '/settings',
    label: 'Paramètres',
    icon: Settings,
    roles: ['client', 'staff', 'manager', 'admin']
  }
]

export function MobileBottomNav() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const { isMobile } = useSidebar()

  if (!session?.user || !isMobile) {
    return null
  }

  const userRole = session.user.role
  const filteredItems = mobileNavItems
    .filter(item => item.roles.includes(userRole))
    .slice(0, 5) // Limit to 5 items for better mobile UX

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-30 md:hidden',
        'bg-background/95 supports-[backdrop-filter]:bg-background/80 backdrop-blur-lg',
        'border-t border-border/50',
        // Safe area support for iOS
        'pb-[env(safe-area-inset-bottom)] px-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]'
      )}
      role="navigation"
      aria-label="Navigation mobile principale"
    >
      <div className="flex items-center justify-around px-2 py-1">
        {filteredItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-1',
                'rounded-lg transition-all duration-200',
                'touch-manipulation select-none',
                // Enhanced touch targets
                'min-h-[48px]',
                // Active/inactive states
                isActive
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 active:bg-gray-100',
                // Focus states for accessibility
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon 
                className={cn(
                  'h-5 w-5 mb-1 transition-transform duration-200',
                  isActive && 'scale-110'
                )} 
              />
              <span className={cn(
                'text-xs font-medium truncate max-w-full',
                isActive && 'text-blue-600'
              )}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

/**
 * Mobile swipe edge area component for edge-to-edge swipe gestures
 * Provides invisible swipe areas on screen edges for sidebar navigation
 */
export function MobileSwipeEdges() {
  const { isMobile, setOpenMobile, openMobile } = useSidebar()
  const startXRef = React.useRef<number>(0)
  const isDraggingRef = React.useRef<boolean>(false)

  const handleTouchStart = React.useCallback((e: TouchEvent) => {
    if (!isMobile) return
    
    const touch = e.touches[0]
    startXRef.current = touch.clientX
    isDraggingRef.current = false
  }, [isMobile])

  const handleTouchMove = React.useCallback((e: TouchEvent) => {
    if (!isMobile || !startXRef.current) return
    
    const touch = e.touches[0]
    const deltaX = touch.clientX - startXRef.current
    
    // Mark as dragging if moved more than 10px
    if (Math.abs(deltaX) > 10) {
      isDraggingRef.current = true
    }
  }, [isMobile])

  const handleTouchEnd = React.useCallback((e: TouchEvent) => {
    if (!isMobile || !startXRef.current) return
    
    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - startXRef.current
    
    // Handle swipe gestures
    if (isDraggingRef.current) {
      // Swipe right from left edge to open sidebar
      if (!openMobile && deltaX > 100 && startXRef.current < 20) {
        setOpenMobile(true)
      }
    }
    
    // Reset tracking
    startXRef.current = 0
    isDraggingRef.current = false
  }, [isMobile, openMobile, setOpenMobile])

  React.useEffect(() => {
    if (!isMobile) return

    // Add touch event listeners to document for edge detection
    document.addEventListener('touchstart', handleTouchStart, { passive: false })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd, { passive: false })

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isMobile, handleTouchStart, handleTouchMove, handleTouchEnd])

  if (!isMobile) return null

  return (
    <>
      {/* Left edge swipe area */}
      <div
        className="fixed left-0 top-0 z-10 h-full w-4 md:hidden"
        style={{ touchAction: 'pan-y' }}
        aria-hidden="true"
      />
      {/* Right edge for closing (when sidebar is open) */}
      {openMobile && (
        <div
          className="fixed right-0 top-0 z-10 h-full w-4 md:hidden"
          style={{ touchAction: 'pan-y' }}
          aria-hidden="true"
        />
      )}
    </>
  )
}