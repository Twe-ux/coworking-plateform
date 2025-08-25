'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Euro,
  Calendar,
  Users,
  Building,
  RefreshCw,
  Download,
  Filter,
} from 'lucide-react'
import { format, subMonths, subDays, startOfMonth, endOfMonth } from 'date-fns'
import { fr } from 'date-fns/locale'

interface RevenueData {
  date: string
  revenue: number
  bookings: number
  averagePrice: number
}

interface SpaceRevenue {
  spaceName: string
  revenue: number
  bookings: number
  occupancyRate: number
  color: string
}

interface Analytics {
  totalRevenue: number
  monthlyRevenueTotal: number
  averageBookingValue: number
  totalBookings: number
  monthlyGrowth: number
  topSpaces: SpaceRevenue[]
  dailyRevenue: RevenueData[]
  monthlyRevenue: RevenueData[]
  revenueByStatus: Array<{
    status: string
    revenue: number
    count: number
    color: string
  }>
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1']

const statusColors = {
  confirmed: '#10b981',
  pending: '#f59e0b',
  completed: '#3b82f6',
  cancelled: '#ef4444',
}

export function RevenueAnalytics() {
  const { toast } = useToast()
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [selectedMetric, setSelectedMetric] = useState<
    'revenue' | 'bookings' | 'average'
  >('revenue')

  const loadAnalytics = async () => {
    try {
      setLoading(true)

      const endDate = new Date()
      let startDate = new Date()

      switch (period) {
        case '7d':
          startDate = subDays(endDate, 7)
          break
        case '30d':
          startDate = subDays(endDate, 30)
          break
        case '90d':
          startDate = subDays(endDate, 90)
          break
        case '1y':
          startDate = subDays(endDate, 365)
          break
      }

      const response = await fetch(
        `/api/dashboard/admin/analytics/revenue?start=${startDate.toISOString()}&end=${endDate.toISOString()}&period=${period}`
      )

      const data = await response.json()

      if (data.success) {
        setAnalytics(data.data)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Erreur chargement analytics:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les analytics',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period])

  const formatCurrency = useMemo(() => {
    return (value: number) => {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
      }).format(value)
    }
  }, [])

  const formatPercentage = useMemo(() => {
    return (value: number) => {
      return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
    }
  }, [])

  const exportReport = async () => {
    try {
      const response = await fetch('/api/dashboard/admin/analytics/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period, type: 'revenue' }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `rapport-revenus-${period}.xlsx`
        a.click()
        window.URL.revokeObjectURL(url)

        toast({
          title: 'Export réussi',
          description: 'Le rapport a été téléchargé',
        })
      } else {
        throw new Error('Erreur export')
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible d&apos;exporter le rapport',
        variant: 'destructive',
      })
    }
  }

  const debugData = async () => {
    try {
      // Debug des collections MongoDB
      const collectionsResponse = await fetch('/api/debug/collections')
      const collectionsData = await collectionsResponse.json()
      console.log('🐛 DEBUG COLLECTIONS:', collectionsData)

      // Debug des bookings
      const response = await fetch('/api/debug/bookings')
      const data = await response.json()
      console.log('🐛 DEBUG BOOKINGS:', data)

      if (collectionsData.success && data.success) {
        const collections = collectionsData.debug.collections.join(', ')
        const bookingsInfo = collectionsData.debug.bookings_info || {}
        const bookingsDebug = data.debug

        alert(
          `🐛 DEBUG MONGODB:\n\n` +
            `Collections: ${collections}\n\n` +
            `Total bookings dans DB: ${bookingsDebug.totalBookingsEver}\n` +
            `Bookings dans période (30j): ${bookingsDebug.totalBookingsInPeriod}\n` +
            `Période: ${bookingsDebug.period}\n\n` +
            `Dates des réservations:\n${bookingsDebug.allBookingsDates.map((b: any) => `- ${new Date(b.date).toLocaleDateString()}: ${b.status} (${b.totalPrice}€)`).join('\n')}\n\n` +
            `Voir console pour détails`
        )
      }
    } catch (error) {
      console.error('Erreur debug:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Aucune donnée disponible</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* En-tête avec contrôles - Mobile optimisé */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 md:text-2xl">
            Analytics Revenus
          </h2>
          <p className="text-sm text-gray-600 md:text-base">
            Performance financière et tendances des réservations
          </p>
        </div>

        {/* Contrôles responsive */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Sélecteur de période */}
          <div className="grid grid-cols-4 gap-1 md:flex md:space-x-1">
            {(['7d', '30d', '90d', '1y'] as const).map((p) => (
              <Button
                key={p}
                size="sm"
                variant={period === p ? 'default' : 'outline'}
                onClick={() => setPeriod(p)}
                className="min-h-10 touch-manipulation text-xs"
              >
                {p === '7d'
                  ? '7j'
                  : p === '30d'
                    ? '30j'
                    : p === '90d'
                      ? '90j'
                      : '1an'}
              </Button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportReport}
              className="flex min-h-10 touch-manipulation items-center space-x-1"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:block">Export</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={debugData}
              className="flex min-h-10 touch-manipulation items-center space-x-1 border-red-200 bg-red-50"
            >
              <span>🐛</span>
              <span className="hidden sm:block">Debug</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={loadAnalytics}
              disabled={loading}
              className="flex min-h-10 touch-manipulation items-center space-x-1"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
              />
              <span className="hidden sm:block">Actualiser</span>
            </Button>
          </div>
        </div>
      </div>

      {/* KPIs principaux - Responsive mobile-first */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-4">
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-gray-600 md:text-sm">
                  Revenus totaux
                </p>
                <p className="truncate text-lg font-bold text-green-600 md:text-2xl">
                  {formatCurrency(analytics.totalRevenue)}
                </p>
                <div className="mt-1 flex items-center space-x-1">
                  {analytics.monthlyGrowth >= 0 ? (
                    <TrendingUp className="h-3 w-3 flex-shrink-0 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 flex-shrink-0 text-red-500" />
                  )}
                  <span
                    className={`truncate text-xs ${
                      analytics.monthlyGrowth >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {formatPercentage(analytics.monthlyGrowth)}
                  </span>
                </div>
              </div>
              <Euro className="h-6 w-6 flex-shrink-0 text-gray-400 md:h-8 md:w-8" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-gray-600 md:text-sm">
                  Réservations
                </p>
                <p className="text-lg font-bold text-blue-600 md:text-2xl">
                  {analytics.totalBookings}
                </p>
                <p className="mt-1 truncate text-xs text-gray-500">
                  {period === '30d' ? 'Ce mois' : 'Période'}
                </p>
              </div>
              <Calendar className="h-6 w-6 flex-shrink-0 text-gray-400 md:h-8 md:w-8" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-gray-600 md:text-sm">
                  Panier moyen
                </p>
                <p className="truncate text-lg font-bold text-purple-600 md:text-2xl">
                  {formatCurrency(analytics.averageBookingValue)}
                </p>
                <p className="mt-1 truncate text-xs text-gray-500">Par résa</p>
              </div>
              <Users className="h-6 w-6 flex-shrink-0 text-gray-400 md:h-8 md:w-8" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-gray-600 md:text-sm">
                  Taux occupation
                </p>
                <p className="text-lg font-bold text-amber-600 md:text-2xl">
                  {analytics.topSpaces.length > 0
                    ? Math.round(
                        analytics.topSpaces.reduce(
                          (acc, s) => acc + s.occupancyRate,
                          0
                        ) / analytics.topSpaces.length
                      )
                    : 0}
                  %
                </p>
                <p className="mt-1 truncate text-xs text-gray-500">Moyenne</p>
              </div>
              <Building className="h-6 w-6 flex-shrink-0 text-gray-400 md:h-8 md:w-8" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphique principal - Responsive avec hauteur adaptive */}
      <Card>
        <CardHeader>
          <div className="space-y-3 md:flex md:items-center md:justify-between md:space-y-0">
            <div>
              <CardTitle className="text-base md:text-lg">
                Évolution des revenus
              </CardTitle>
              <CardDescription className="text-sm">
                Tendance sur la période sélectionnée
              </CardDescription>
            </div>

            {/* Sélecteur de métrique responsive */}
            <div className="grid grid-cols-3 gap-1 md:flex md:space-x-1">
              {(['revenue', 'bookings', 'average'] as const).map((metric) => (
                <Button
                  key={metric}
                  size="sm"
                  variant={selectedMetric === metric ? 'default' : 'outline'}
                  onClick={() => setSelectedMetric(metric)}
                  className="min-h-10 touch-manipulation text-xs"
                >
                  {metric === 'revenue'
                    ? 'Revenus'
                    : metric === 'bookings'
                      ? 'Résa'
                      : 'Panier'}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Hauteur adaptive pour mobile */}
          <div className="h-64 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.dailyRevenue}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => format(new Date(date), 'dd/MM')}
                  fontSize={12}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickFormatter={(value) =>
                    selectedMetric === 'revenue' || selectedMetric === 'average'
                      ? `${value}€`
                      : value.toString()
                  }
                  fontSize={12}
                  width={60}
                />
                <Tooltip
                  formatter={(value: number) => [
                    selectedMetric === 'revenue'
                      ? formatCurrency(value)
                      : selectedMetric === 'bookings'
                        ? value
                        : formatCurrency(value),
                    selectedMetric === 'revenue'
                      ? 'Revenus'
                      : selectedMetric === 'bookings'
                        ? 'Réservations'
                        : 'Panier moyen',
                  ]}
                  labelFormatter={(date) =>
                    format(new Date(date), 'dd MMM yyyy', { locale: fr })
                  }
                  contentStyle={{
                    fontSize: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey={selectedMetric}
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Graphiques secondaires - Mobile stacked */}
      <div className="space-y-4 md:space-y-6 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
        {/* Top espaces */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">
              Top espaces par revenus
            </CardTitle>
            <CardDescription className="text-sm">
              Espaces les plus rentables
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48 md:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.topSpaces}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="spaceName"
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    fontSize={10}
                    interval={0}
                  />
                  <YAxis
                    tickFormatter={(value) => `${value}€`}
                    fontSize={10}
                    width={50}
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      formatCurrency(value),
                      'Revenus',
                    ]}
                    contentStyle={{
                      fontSize: '12px',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                    }}
                  />
                  <Bar dataKey="revenue" fill="#10b981" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenus par statut */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">
              Revenus par statut
            </CardTitle>
            <CardDescription className="text-sm">
              Répartition des revenus selon le statut
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48 md:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.revenueByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={60}
                    dataKey="revenue"
                    label={false} // Supprimer les labels sur le graphique pour mobile
                  >
                    {analytics.revenueByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [
                      formatCurrency(value),
                      'Revenus',
                    ]}
                    contentStyle={{
                      fontSize: '12px',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Légende responsive */}
            <div className="mt-4 grid grid-cols-1 gap-2 md:space-y-2">
              {analytics.revenueByStatus.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex min-w-0 flex-1 items-center space-x-2">
                    <div
                      className="h-3 w-3 flex-shrink-0 rounded"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="truncate text-sm capitalize">
                      {item.status}
                    </span>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-sm font-medium">
                      {formatCurrency(item.revenue)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.count} résa
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
