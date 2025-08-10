'use client'

import { useState, useEffect } from 'react'
import {
  Calendar,
  Users,
  Building,
  TrendingUp,
  DollarSign,
  Clock,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface DashboardStats {
  totalBookings: number
  totalUsers: number
  activeUsers: number
  totalRevenue: number
  occupancyRate: number
  todayBookings: number
  weeklyGrowth: number
  usersByRole: {
    client: number
    staff: number
    manager: number
    admin: number
  }
  bookingsByStatus: {
    confirmed: number
    pending: number
    total: number
  }
}

/**
 * Page principale du dashboard administrateur
 */
export default function AdminDashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    totalUsers: 0,
    activeUsers: 0,
    totalRevenue: 0,
    occupancyRate: 0,
    todayBookings: 0,
    weeklyGrowth: 0,
    usersByRole: {
      client: 0,
      staff: 0,
      manager: 0,
      admin: 0,
    },
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
          activeUsers: 0,
          totalRevenue: 0,
          occupancyRate: 0,
          todayBookings: 0,
          weeklyGrowth: 0,
          usersByRole: {
            client: 0,
            staff: 0,
            manager: 0,
            admin: 0,
          },
          bookingsByStatus: {
            confirmed: 0,
            pending: 0,
            total: 0,
          },
        })
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error)
      // Fallback sur des données mock en cas d'erreur
      setStats({
        totalBookings: 0,
        totalUsers: 0,
        activeUsers: 0,
        totalRevenue: 0,
        occupancyRate: 0,
        todayBookings: 0,
        weeklyGrowth: 0,
        usersByRole: {
          client: 0,
          staff: 0,
          manager: 0,
          admin: 0,
        },
        bookingsByStatus: {
          confirmed: 0,
          pending: 0,
          total: 0,
        },
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Skeleton cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-lg border border-gray-200 bg-white p-6"
            >
              <div className="mb-4 h-4 w-1/2 rounded bg-gray-200"></div>
              <div className="h-8 w-1/3 rounded bg-gray-200"></div>
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
      suffix: ' réservations',
    },
    {
      title: 'Utilisateurs',
      value: stats.totalUsers,
      secondaryValue: stats.activeUsers,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      suffix: ' total',
      isUserCard: true,
      onClick: () => router.push('/dashboard/admin/users'),
    },
    {
      title: 'Réservations',
      value: stats.totalBookings,
      secondaryValue: stats.bookingsByStatus.pending,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      suffix: ' total',
      isBookingCard: true,
      onClick: () => router.push('/dashboard/admin/bookings'),
    },
    {
      title: 'Chiffre d&apos;affaires',
      value: stats.totalRevenue,
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      prefix: '€',
      suffix: '',
      description: 'Réservations confirmées uniquement',
    },
    {
      title: 'Taux d&apos;occupation',
      value: stats.occupancyRate,
      icon: Building,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      suffix: '%',
    },
    {
      title: "Réservations aujourd'hui",
      value: stats.todayBookings,
      icon: Clock,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      suffix: ' réservations',
    },
    {
      title: 'Croissance hebdomadaire',
      value: stats.weeklyGrowth,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      prefix: '+',
      suffix: '%',
    },
  ]

  return (
    <div className="space-y-8">
      {/* En-tête avec résumé rapide */}
      <div>
        <h2 className="mb-2 text-3xl font-bold text-gray-900">
          Vue d&apos;ensemble
        </h2>
        <p className="text-gray-600">
          Statistiques et métriques clés de votre plateforme de coworking
        </p>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card, index) => {
          const Icon = card.icon
          return (
            <div
              key={index}
              className={`rounded-lg border border-gray-200 bg-white p-6 transition-all ${
                card.onClick
                  ? 'hover:border-coffee-primary/20 transform cursor-pointer hover:scale-[1.02] hover:shadow-lg'
                  : 'hover:shadow-lg'
              }`}
              onClick={card.onClick}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-600">
                  {card.title}
                </h3>
                <div className={`rounded-lg p-2 ${card.bgColor}`}>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </div>

              <div className="flex items-center">
                {card.isUserCard ? (
                  <div className="w-full">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-2xl font-bold text-gray-900">
                        {card.value.toLocaleString()}
                      </span>
                      <div className="text-right">
                        <div className="text-sm font-medium text-green-600">
                          {card.secondaryValue} actifs
                        </div>
                        <div className="text-xs text-gray-500">
                          {((card.secondaryValue! / card.value) * 100).toFixed(
                            0
                          )}
                          % actifs
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {Object.entries(stats.usersByRole).map(
                        ([role, count]) => {
                          if (count === 0) return null
                          const roleConfig = {
                            client: { label: 'Clients', color: 'bg-blue-500' },
                            staff: { label: 'Staff', color: 'bg-green-500' },
                            manager: {
                              label: 'Managers',
                              color: 'bg-orange-500',
                            },
                            admin: { label: 'Admins', color: 'bg-purple-500' },
                          }[role as keyof typeof stats.usersByRole]
                          return (
                            <div
                              key={role}
                              className="flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className={`h-2 w-2 rounded-full ${roleConfig?.color}`}
                                />
                                <span className="text-gray-600">
                                  {roleConfig?.label}
                                </span>
                              </div>
                              <span className="font-medium">{count}</span>
                            </div>
                          )
                        }
                      )}
                    </div>
                  </div>
                ) : (card as any).isBookingCard ? (
                  <div className="w-full">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-2xl font-bold text-gray-900">
                        {card.value.toLocaleString()}
                      </span>
                      <div className="text-right">
                        <div className="text-sm font-medium text-yellow-600">
                          {card.secondaryValue} en attente
                        </div>
                        <div className="text-xs text-gray-500">
                          {card.value > 0
                            ? (
                                (card.secondaryValue! / card.value) *
                                100
                              ).toFixed(0)
                            : 0}
                          % à traiter
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-500" />
                          <span className="text-gray-600">Confirmées</span>
                        </div>
                        <span className="font-medium">
                          {stats.bookingsByStatus.confirmed}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-yellow-500" />
                          <span className="text-gray-600">En attente</span>
                        </div>
                        <span className="font-medium">
                          {stats.bookingsByStatus.pending}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-blue-500" />
                          <span className="text-gray-600">
                            Aujourd&apos;hui
                          </span>
                        </div>
                        <span className="font-medium">
                          {stats.todayBookings}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <span className="text-2xl font-bold text-gray-900">
                    {card.prefix}
                    {card.value.toLocaleString()}
                    {card.suffix}
                  </span>
                )}
              </div>

              {/* Indicateur de tendance pour certaines cartes */}
              {card.title.includes('Croissance') && (
                <div className="mt-2 flex items-center text-sm text-emerald-600">
                  <TrendingUp className="mr-1 h-4 w-4" />
                  <span>Par rapport à la semaine dernière</span>
                </div>
              )}

              {/* Description additionnelle pour le chiffre d'affaires */}
              {(card as any).description && (
                <div className="mt-2 text-xs text-gray-500">
                  ℹ️ {(card as any).description}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Graphiques et tableaux - À implémenter plus tard */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Placeholder pour le graphique des réservations */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Évolution des réservations
          </h3>
          <div className="flex h-64 items-center justify-center rounded-lg bg-gray-50">
            <p className="text-gray-500">Graphique à implémenter</p>
          </div>
        </div>

        {/* Placeholder pour les dernières réservations */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Dernières réservations
          </h3>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between border-b border-gray-100 py-2 last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-coffee-primary/10 flex h-8 w-8 items-center justify-center rounded-full">
                    <Calendar className="text-coffee-primary h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Salle Verrière
                    </p>
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
