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
        className="min-h-screen bg-gradient-to-br from-orange-50/50 via-amber-50/30 to-yellow-50/50 flex items-center justify-center"
      >
        <div className="text-center space-y-4 p-8 bg-white/80 backdrop-blur-sm rounded-2xl border border-orange-200/50">
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 0.5, repeat: 3 }}
          >
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-red-400 to-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl">⚠</span>
            </div>
          </motion.div>
          <div>
            <h2 className="text-xl font-bold text-orange-900">Erreur de chargement</h2>
            <p className="text-orange-700/70 mt-2">Impossible de charger les données du dashboard</p>
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
          <div className="bg-black/80 backdrop-blur-sm text-white p-3 rounded-lg border border-white/10">
            <p className="text-xs mb-2 font-medium">Dev Controls</p>
            <div className="flex gap-2">
              <button
                onClick={refetch}
                className="text-xs px-2 py-1 bg-orange-500 hover:bg-orange-600 rounded transition-colors"
              >
                Simuler Rechargement
              </button>
              <button
                onClick={() => window.location.reload()}
                className="text-xs px-2 py-1 bg-gray-600 hover:bg-gray-700 rounded transition-colors"
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
  delay = 0 
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