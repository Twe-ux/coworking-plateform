'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { DashboardLoadingSkeleton } from './loading-states'
import DashboardPage from '@/app/dashboard/page'

// Simulate data loading
function useDashboardData() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 3000) // 3 seconds loading time

    return () => clearTimeout(timer)
  }, [])

  const refetch = () => {
    setIsLoading(true)
    setError(null)
    setTimeout(() => {
      setIsLoading(false)
    }, 2000)
  }

  return { isLoading, error, refetch }
}

export default function DashboardWithLoading() {
  const { isLoading, error, refetch } = useDashboardData()

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50/50 via-amber-50/30 to-yellow-50/50"
      >
        <div className="space-y-4 rounded-2xl border border-orange-200/50 bg-white/80 p-8 text-center backdrop-blur-sm">
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 0.5, repeat: 3 }}
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-red-400 to-orange-500">
              <span className="text-2xl text-white">⚠</span>
            </div>
          </motion.div>
          <div>
            <h2 className="text-xl font-bold text-orange-900">
              Erreur de chargement
            </h2>
            <p className="mt-2 text-orange-700/70">
              Impossible de charger les données du dashboard
            </p>
          </div>
          <Button
            onClick={refetch}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
          >
            Réessayer
          </Button>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <DashboardLoadingSkeleton />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <DashboardPage />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Development controls */}
      {process.env.NODE_ENV === 'development' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1 }}
          className="fixed bottom-4 left-4 z-50"
        >
          <div className="rounded-lg border border-white/10 bg-black/80 p-3 text-white backdrop-blur-sm">
            <p className="mb-2 text-xs font-medium">Dev Controls</p>
            <div className="flex gap-2">
              <button
                onClick={refetch}
                className="rounded bg-orange-500 px-2 py-1 text-xs transition-colors hover:bg-orange-600"
              >
                Simuler Rechargement
              </button>
              <button
                onClick={() => window.location.reload()}
                className="rounded bg-gray-600 px-2 py-1 text-xs transition-colors hover:bg-gray-700"
              >
                Recharger Page
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

// Loading state wrapper component for individual sections
export function WithLoadingState({
  children,
  isLoading,
  fallback,
  delay = 0,
}: {
  children: React.ReactNode
  isLoading: boolean
  fallback: React.ReactNode
  delay?: number
}) {
  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, delay }}
        >
          {fallback}
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
