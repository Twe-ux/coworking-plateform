'use client'

import * as React from 'react'

/**
 * Enhanced mobile detection hook with performance optimizations
 * Provides accurate mobile/tablet detection with proper SSR handling
 */
export function useMobile() {
  const [isMobile, setIsMobile] = React.useState(false)
  const [isTablet, setIsTablet] = React.useState(false)
  const [orientation, setOrientation] = React.useState<'portrait' | 'landscape'>('portrait')

  React.useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      // Mobile breakpoints (following Tailwind defaults)
      const mobile = width < 768
      const tablet = width >= 768 && width < 1024
      
      setIsMobile(mobile)
      setIsTablet(tablet)
      setOrientation(height > width ? 'portrait' : 'landscape')
    }

    // Initial check
    checkDevice()

    // Debounced resize handler for better performance
    let timeoutId: NodeJS.Timeout
    const debouncedResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(checkDevice, 100)
    }

    // Use passive event listeners for better performance
    window.addEventListener('resize', debouncedResize, { passive: true })
    window.addEventListener('orientationchange', checkDevice, { passive: true })

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', debouncedResize)
      window.removeEventListener('orientationchange', checkDevice)
    }
  }, [])

  return {
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet,
    orientation,
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape',
  }
}

/**
 * Hook for touch device detection
 * Detects if the device supports touch interactions
 */
export function useTouch() {
  const [isTouch, setIsTouch] = React.useState(false)

  React.useEffect(() => {
    const checkTouch = () => {
      setIsTouch(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore - for older browsers
        navigator.msMaxTouchPoints > 0
      )
    }

    checkTouch()
  }, [])

  return { isTouch }
}

/**
 * Hook for safe area insets (iOS notch support)
 * Provides CSS custom properties for safe area handling
 */
export function useSafeArea() {
  const [safeAreaInsets, setSafeAreaInsets] = React.useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  })

  React.useEffect(() => {
    const updateSafeArea = () => {
      const computedStyle = getComputedStyle(document.documentElement)
      
      setSafeAreaInsets({
        top: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-top)') || '0'),
        right: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-right)') || '0'),
        bottom: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
        left: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-left)') || '0'),
      })
    }

    updateSafeArea()
    window.addEventListener('resize', updateSafeArea, { passive: true })
    window.addEventListener('orientationchange', updateSafeArea, { passive: true })

    return () => {
      window.removeEventListener('resize', updateSafeArea)
      window.removeEventListener('orientationchange', updateSafeArea)
    }
  }, [])

  return safeAreaInsets
}