'use client'

import { useState, useEffect } from 'react'

interface MemberStats {
  clients: number
  totalActiveUsers: number
  managers: number
  staff: number
  displayText: string
  lastUpdated: string
  error?: string
}

interface UseMemberStatsReturn {
  stats: MemberStats | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useMemberStats(): UseMemberStatsReturn {
  const [stats, setStats] = useState<MemberStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/stats/members', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Cache for 30 seconds to avoid too many requests
        next: { revalidate: 30 }
      })

      const result = await response.json()

      if (result.success) {
        setStats(result.data)
      } else {
        setStats(result.data) // Même en erreur, on utilise les données fallback
        setError('Utilisation des données par défaut')
      }
    } catch (err: any) {
      console.error('Erreur lors de la récupération des stats membres:', err)
      setError('Erreur de connexion')
      
      // Données fallback en cas d'erreur totale
      setStats({
        clients: 50,
        totalActiveUsers: 50,
        managers: 0,
        staff: 0,
        displayText: '50+',
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
  }, [])

  return {
    stats,
    loading,
    error,
    refetch
  }
}