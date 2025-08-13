'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/components/dashboard/admin/advanced/ui/sidebar'
import { Button } from '@/components/dashboard/admin/advanced/ui/button'
import { useMobile, useTouch } from '@/hooks/use-mobile'

/**
 * Mobile Test Component
 * Use this component to test and demonstrate mobile sidebar functionality
 */
export function MobileTest() {
  const { isMobile, openMobile, setOpenMobile, toggleSidebar } = useSidebar()
  const { isMobile: hookMobile, isTablet, orientation } = useMobile()
  const { isTouch } = useTouch()
  const [touchStartX, setTouchStartX] = React.useState<number>(0)
  const [touchEvents, setTouchEvents] = React.useState<string[]>([])

  // Debug touch events
  const addTouchEvent = (event: string) => {
    setTouchEvents(prev => [...prev.slice(-4), event])
  }

  React.useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      setTouchStartX(e.touches[0].clientX)
      addTouchEvent(`TouchStart: ${Math.round(e.touches[0].clientX)}px`)
    }

    const handleTouchEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0].clientX
      const deltaX = endX - touchStartX
      addTouchEvent(`TouchEnd: ${Math.round(deltaX)}px delta`)
    }

    document.addEventListener('touchstart', handleTouchStart)
    document.addEventListener('touchend', handleTouchEnd)

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [touchStartX])

  if (!isMobile) {
    return (
      <div className="hidden md:block p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          Mobile test component - only visible on mobile devices
        </p>
      </div>
    )
  }

  return (
    <div className="md:hidden fixed bottom-20 left-4 right-4 z-50 p-4 bg-white border border-gray-200 rounded-lg shadow-lg">
      <h3 className="font-semibold text-sm mb-3">Mobile Debug Panel</h3>
      
      <div className="space-y-2 text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <strong>Device:</strong>
            <div>Mobile: {hookMobile ? '✅' : '❌'}</div>
            <div>Tablet: {isTablet ? '✅' : '❌'}</div>
            <div>Touch: {isTouch ? '✅' : '❌'}</div>
          </div>
          <div>
            <strong>Sidebar:</strong>
            <div>Context Mobile: {isMobile ? '✅' : '❌'}</div>
            <div>Open: {openMobile ? '✅' : '❌'}</div>
            <div>Orientation: {orientation}</div>
          </div>
        </div>

        <div>
          <strong>Recent Touch Events:</strong>
          <div className="bg-gray-50 p-2 rounded text-xs font-mono">
            {touchEvents.map((event, i) => (
              <div key={i}>{event}</div>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            size="sm" 
            onClick={toggleSidebar}
            className="flex-1"
          >
            Toggle Sidebar
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setOpenMobile(!openMobile)}
            className="flex-1"
          >
            Force {openMobile ? 'Close' : 'Open'}
          </Button>
        </div>

        <div className="text-xs text-gray-600">
          <p><strong>Test Gestures:</strong></p>
          <p>• Swipe right from left edge to open</p>
          <p>• Swipe left on sidebar to close</p>
          <p>• Tap overlay to close</p>
          <p>• Use hamburger button</p>
        </div>
      </div>
    </div>
  )
}

/**
 * Performance Monitor Component
 * Monitors frame rates and touch responsiveness
 */
export function MobilePerformanceMonitor() {
  const [fps, setFps] = React.useState<number>(0)
  const [touchLatency, setTouchLatency] = React.useState<number>(0)
  const { isMobile } = useSidebar()

  React.useEffect(() => {
    if (!isMobile) return

    let frameCount = 0
    let startTime = Date.now()
    let animationFrame: number

    const measureFPS = () => {
      frameCount++
      const currentTime = Date.now()
      
      if (currentTime - startTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (currentTime - startTime)))
        frameCount = 0
        startTime = currentTime
      }
      
      animationFrame = requestAnimationFrame(measureFPS)
    }

    animationFrame = requestAnimationFrame(measureFPS)

    // Measure touch latency
    let touchStart = 0
    const handleTouchStart = () => {
      touchStart = performance.now()
    }

    const handleTouchEnd = () => {
      if (touchStart) {
        setTouchLatency(Math.round(performance.now() - touchStart))
        touchStart = 0
      }
    }

    document.addEventListener('touchstart', handleTouchStart)
    document.addEventListener('touchend', handleTouchEnd)

    return () => {
      cancelAnimationFrame(animationFrame)
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isMobile])

  if (!isMobile) return null

  return (
    <div className="md:hidden fixed top-4 right-4 z-50 p-2 bg-black/80 text-white text-xs rounded">
      <div>FPS: {fps}</div>
      <div>Touch: {touchLatency}ms</div>
    </div>
  )
}