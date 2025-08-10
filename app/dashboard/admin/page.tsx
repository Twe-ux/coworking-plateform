'use client'

import { useState, useEffect } from 'react'
import { Calendar, Users, Building, TrendingUp, DollarSign, Clock } from 'lucide-react'

interface DashboardStats {
  totalBookings: number
  totalUsers: number
  totalRevenue: number
  occupancyRate: number
  todayBookings: number
  weeklyGrowth: number
}

/**
 * Page principale du dashboard administrateur
 */
export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    totalUsers: 0,
    totalRevenue: 0,
    occupancyRate: 0,
    todayBookings: 0,
    weeklyGrowth: 0
  })
  
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/dashboard/admin')
      const result = await response.json()
      
      if (result.success) {
        setStats(result.data)
      } else {
        console.error('Erreur API:', result.error)
        // Fallback sur des données mock en cas d'erreur
        setStats({
          totalBookings: 0,
          totalUsers: 0,
          totalRevenue: 0,
          occupancyRate: 0,
          todayBookings: 0,
          weeklyGrowth: 0
        })
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error)
      // Fallback sur des données mock en cas d'erreur
      setStats({
        totalBookings: 0,
        totalUsers: 0,
        totalRevenue: 0,
        occupancyRate: 0,
        todayBookings: 0,
        weeklyGrowth: 0
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Skeleton cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-6 border border-gray-200 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Réservations totales',
      value: stats.totalBookings,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      suffix: ' réservations'
    },
    {
      title: 'Utilisateurs actifs',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      suffix: ' utilisateurs'
    },
    {
      title: 'Chiffre d\'affaires',
      value: stats.totalRevenue,
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      prefix: '€',
      suffix: ''
    },
    {
      title: 'Taux d\'occupation',
      value: stats.occupancyRate,
      icon: Building,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      suffix: '%'
    },
    {
      title: 'Réservations aujourd\'hui',
      value: stats.todayBookings,
      icon: Clock,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      suffix: ' réservations'
    },
    {
      title: 'Croissance hebdomadaire',
      value: stats.weeklyGrowth,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      prefix: '+',
      suffix: '%'
    }
  ]

  return (
    <div className="space-y-8">
      {/* En-tête avec résumé rapide */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Vue d'ensemble
        </h2>
        <p className="text-gray-600">
          Statistiques et métriques clés de votre plateforme de coworking
        </p>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon
          return (
            <div key={index} className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600">
                  {card.title}
                </h3>
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </div>
              
              <div className="flex items-center">
                <span className="text-2xl font-bold text-gray-900">
                  {card.prefix}{card.value.toLocaleString()}{card.suffix}
                </span>
              </div>
              
              {/* Indicateur de tendance pour certaines cartes */}
              {card.title.includes('Croissance') && (
                <div className="mt-2 flex items-center text-sm text-emerald-600">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span>Par rapport à la semaine dernière</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Graphiques et tableaux - À implémenter plus tard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Placeholder pour le graphique des réservations */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Évolution des réservations
          </h3>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Graphique à implémenter</p>
          </div>
        </div>

        {/* Placeholder pour les dernières réservations */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Dernières réservations
          </h3>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-coffee-primary/10 rounded-full flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-coffee-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Salle Verrière</p>
                    <p className="text-xs text-gray-500">Client #{i + 1}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">€24</p>
                  <p className="text-xs text-gray-500">2h</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}