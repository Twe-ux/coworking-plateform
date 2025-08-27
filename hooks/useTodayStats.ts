'use client'

import { useState, useEffect } from 'react'

interface TodayStats {
  peopleWorkingToday: number
  totalBookingsToday: number
  activeBookingsToday: number
  currentHour: number
  isOpenHours: boolean
  lastUpdated: string
  error?: string
}

interface UseTodayStatsReturn {
  stats: TodayStats | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useTodayStats(): UseTodayStatsReturn {
  const [stats, setStats] = useState<TodayStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/stats/today', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Cache for 5 minutes to keep it relatively fresh
        next: { revalidate: 300 }
      })

      const result = await response.json()

      if (result.success) {
        setStats(result.data)
      } else {
        setStats(result.data) // Même en erreur, on utilise les données fallback
        setError('Utilisation des données par défaut')
      }
    } catch (err: any) {
      console.error('Erreur lors de la récupération des stats du jour:', err)
      setError('Erreur de connexion')
      
      // Données fallback en cas d'erreur totale
      const currentHour = new Date().getHours()
      setStats({
        peopleWorkingToday: currentHour >= 9 && currentHour <= 18 ? 15 : 5,
        totalBookingsToday: 0,
        activeBookingsToday: 0,
        currentHour,
        isOpenHours: currentHour >= 8 && currentHour <= 20,
        lastUpdated: new Date().toISOString(),
        error: 'Offline fallback'
      })
    } finally {
      setLoading(false)
    }
  }

  const refetch = () => {
    fetchStats()
  }

  useEffect(() => {
    fetchStats()
    
    // Rafraîchir toutes les 30 minutes pendant les heures d'ouverture (réduit pour économiser DB)
    const interval = setInterval(() => {
      const currentHour = new Date().getHours()
      if (currentHour >= 8 && currentHour <= 20) {
        fetchStats()
      }
    }, 30 * 60 * 1000) // 30 minutes

    return () => clearInterval(interval)
  }, [])

  return {
    stats,
    loading,
    error,
    refetch
  }
}