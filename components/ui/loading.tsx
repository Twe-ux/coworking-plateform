'use client'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { useCallback, useState } from 'react'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'spinner' | 'dots' | 'pulse' | 'skeleton'
  text?: string
  fullScreen?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
}

export function Loading({
  size = 'md',
  variant = 'spinner',
  text,
  fullScreen = false,
  className,
}: LoadingProps) {
  const content = (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3',
        fullScreen && 'min-h-screen',
        className
      )}
    >
      {variant === 'spinner' && (
        <Loader2
          className={cn('text-coffee-accent animate-spin', sizeClasses[size])}
        />
      )}

      {variant === 'dots' && (
        <div className="flex space-x-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className={cn('bg-coffee-primary rounded-full', {
                'h-2 w-2': size === 'sm',
                'h-3 w-3': size === 'md',
                'h-4 w-4': size === 'lg',
                'h-6 w-6': size === 'xl',
              })}
              animate={{
                y: [0, -10, 0],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.1,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      )}

      {variant === 'pulse' && (
        <motion.div
          className={cn('bg-coffee-primary rounded-full', sizeClasses[size])}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {variant === 'skeleton' && (
        <div className="space-y-3">
          <div className="h-4 w-48 animate-pulse rounded bg-gray-300"></div>
          <div className="h-4 w-32 animate-pulse rounded bg-gray-300"></div>
          <div className="h-4 w-40 animate-pulse rounded bg-gray-300"></div>
        </div>
      )}

      {text && (
        <motion.p
          className="text-sm text-gray-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {text}
        </motion.p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        {content}
      </div>
    )
  }

  return content
}

// Hook pour gérer les états de chargement
export function useLoading(initialState = false) {
  const [isLoading, setIsLoading] = useState(initialState)

  const startLoading = useCallback(() => setIsLoading(true), [])
  const stopLoading = useCallback(() => setIsLoading(false), [])
  const toggleLoading = useCallback(() => setIsLoading((prev) => !prev), [])

  return {
    isLoading,
    startLoading,
    stopLoading,
    toggleLoading,
    setIsLoading,
  }
}

// Composant de loading pour les formulaires
export function FormLoading({
  text = 'Traitement en cours...',
}: {
  text?: string
}) {
  return (
    <div className="flex items-center justify-center gap-2 p-4">
      <Loader2 className="text-coffee-accent h-4 w-4 animate-spin" />
      <span className="text-sm text-gray-600">{text}</span>
    </div>
  )
}

// Composant de loading pour les boutons
export function ButtonLoading({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  return (
    <Loader2
      className={cn('animate-spin', {
        'h-3 w-3': size === 'sm',
        'h-4 w-4': size === 'md',
      })}
    />
  )
}

export default Loading
