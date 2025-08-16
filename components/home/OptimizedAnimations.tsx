'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface BackgroundElementsProps {
  mousePosition: { x: number; y: number }
}

export const OptimizedAnimations = {
  BackgroundElements: ({ mousePosition }: BackgroundElementsProps) => {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
      setIsVisible(true)
    }, [])

    if (!isVisible) return null

    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="bg-coffee-primary/10 absolute -top-40 -right-40 h-80 w-80 rounded-full blur-3xl"
          animate={{
            x: mousePosition.x * 0.01,
            y: mousePosition.y * 0.01,
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="bg-coffee-accent/10 absolute -bottom-40 -left-40 h-80 w-80 rounded-full blur-3xl"
          animate={{
            x: mousePosition.x * -0.01,
            y: mousePosition.y * -0.01,
            scale: [1.1, 1, 1.1],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    )
  }
}