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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  RadialBarChart,
  RadialBar,
  Legend,
} from 'recharts'
import {
  Building,
  Users,
  Clock,
  Calendar,
  RefreshCw,
  TrendingUp,
  MapPin,
  Activity,
} from 'lucide-react'
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns'
import { fr } from 'date-fns/locale'

interface SpaceOccupancy {
  spaceId: string
  spaceName: string
  capacity: number
  totalBookings: number
  totalHours: number
  occupancyRate: number
  avgDuration: number
  peakHours: string[]
  weeklyTrend: Array<{
    day: string
    bookings: number
    occupancyRate: number
  }>
  color: string
}

interface TimeSlotUsage {
  hour: string
  totalBookings: number
  occupancyRate: number
  spaces: Array<{
    spaceName: string
    bookings: number
  }>
}

interface OccupancyAnalytics {
  averageOccupancyRate: number
  totalCapacityHours: number
  totalBookedHours: number
  mostPopularSpace: string
  peakTime: string
  spaces: SpaceOccupancy[]
  hourlyUsage: TimeSlotUsage[]
  weeklyComparison: Array<{
    week: string
    occupancyRate: number
    bookings: number
  }>
  capacityUtilization: Array<{
    spaceName: string
    capacity: number
    avgGuests: number
    utilizationRate: number
    color: string
  }>
}

const COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#84cc16',
]

export function OccupancyAnalytics() {
  const { toast } = useToast()
  const [analytics, setAnalytics] = useState<OccupancyAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d')
  const [selectedSpace, setSelectedSpace] = useState<string>('all')

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
      }

      const response = await fetch(
        `/api/dashboard/admin/analytics/occupancy?start=${startDate.toISOString()}&end=${endDate.toISOString()}&period=${period}&space=${selectedSpace}`
      )

      const data = await response.json()

      if (data.success) {
        setAnalytics(data.data)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Erreur chargement analytics occupation:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les analytics d&apos;occupation',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, selectedSpace])

  const formatPercentage = useMemo(() => {
    return (value: number) => `${value.toFixed(1)}%`
  }, [])

  const formatHours = useMemo(() => {
    return (value: number) => `${value.toFixed(1)}h`
  }, [])

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
            Analytics d&apos;occupation
          </h2>
          <p className="text-sm text-gray-600 md:text-base">
            Utilisation et performance des espaces de travail
          </p>
        </div>

        {/* Contrôles responsive */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Sélecteur d'espace - Pleine largeur sur mobile */}
          <select
            value={selectedSpace}
            onChange={(e) => setSelectedSpace(e.target.value)}
            className="min-h-10 touch-manipulation rounded-md border p-2 text-sm md:min-w-48"
          >
            <option value="all">Tous les espaces</option>
            {analytics.spaces.map((space) => (
              <option key={space.spaceId} value={space.spaceId}>
                {space.spaceName.length > 30
                  ? space.spaceName.substring(0, 30) + '...'
                  : space.spaceName}
              </option>
            ))}
          </select>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Période */}
            <div className="flex space-x-1">
              {(['7d', '30d', '90d'] as const).map((p) => (
                <Button
                  key={p}
                  size="sm"
                  variant={period === p ? 'default' : 'outline'}
                  onClick={() => setPeriod(p)}
                  className="min-h-10 touch-manipulation text-xs"
                >
                  {p === '7d' ? '7j' : p === '30d' ? '30j' : '90j'}
                </Button>
              ))}
            </div>

            {/* Actualiser */}
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

      {/* KPIs d'occupation - Mobile responsive */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-4">
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-gray-600 md:text-sm">
                  Taux d&apos;occupation
                </p>
                <p className="text-lg font-bold text-blue-600 md:text-2xl">
                  {formatPercentage(analytics.averageOccupancyRate)}
                </p>
                <p className="mt-1 truncate text-xs text-gray-500">
                  Tous espaces
                </p>
              </div>
              <Activity className="h-6 w-6 flex-shrink-0 text-gray-400 md:h-8 md:w-8" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-gray-600 md:text-sm">
                  Heures réservées
                </p>
                <p className="text-lg font-bold text-green-600 md:text-2xl">
                  {Math.round(analytics.totalBookedHours)}h
                </p>
                <p className="mt-1 truncate text-xs text-gray-500">
                  Sur {Math.round(analytics.totalCapacityHours)}h
                </p>
              </div>
              <Clock className="h-6 w-6 flex-shrink-0 text-gray-400 md:h-8 md:w-8" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-gray-600 md:text-sm">
                  Espace populaire
                </p>
                <p className="truncate text-lg font-bold text-purple-600 md:text-2xl">
                  {analytics.mostPopularSpace
                    ? analytics.mostPopularSpace.length > 12
                      ? analytics.mostPopularSpace.substring(0, 12) + '...'
                      : analytics.mostPopularSpace
                    : 'N/A'}
                </p>
                <p className="mt-1 truncate text-xs text-gray-500">
                  Le plus réservé
                </p>
              </div>
              <MapPin className="h-6 w-6 flex-shrink-0 text-gray-400 md:h-8 md:w-8" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-gray-600 md:text-sm">
                  Créneau de pointe
                </p>
                <p className="text-lg font-bold text-amber-600 md:text-2xl">
                  {analytics.peakTime || 'N/A'}
                </p>
                <p className="mt-1 truncate text-xs text-gray-500">
                  Heure demandée
                </p>
              </div>
              <TrendingUp className="h-6 w-6 flex-shrink-0 text-gray-400 md:h-8 md:w-8" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance des espaces - Mobile responsive */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">
            Performance par espace
          </CardTitle>
          <CardDescription className="text-sm">
            Taux d&apos;occupation et utilisation de chaque espace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.spaces}>
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
                  yAxisId="left"
                  orientation="left"
                  tickFormatter={formatPercentage}
                  fontSize={10}
                  width={40}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickFormatter={(value) => value.toString()}
                  fontSize={10}
                  width={30}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    name === 'occupancyRate' ? formatPercentage(value) : value,
                    name === 'occupancyRate'
                      ? 'Taux d&apos;occupation'
                      : 'Réservations',
                  ]}
                  contentStyle={{
                    fontSize: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                  }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="occupancyRate"
                  fill="#3b82f6"
                  name="occupancyRate"
                  radius={[2, 2, 0, 0]}
                />
                <Bar
                  yAxisId="right"
                  dataKey="totalBookings"
                  fill="#10b981"
                  name="totalBookings"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Utilisation par heure et capacité - Mobile stacked */}
      <div className="space-y-4 md:space-y-6 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
        {/* Usage par créneau horaire */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">
              Usage par créneaux horaires
            </CardTitle>
            <CardDescription className="text-sm">
              Répartition des réservations dans la journée
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48 md:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.hourlyUsage}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="hour" fontSize={10} />
                  <YAxis
                    tickFormatter={(value) => value.toString()}
                    fontSize={10}
                    width={30}
                  />
                  <Tooltip
                    formatter={(value: number) => [value, 'Réservations']}
                    contentStyle={{
                      fontSize: '12px',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="totalBookings"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Utilisation de la capacité - Simplifiée pour mobile */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">
              Utilisation de la capacité
            </CardTitle>
            <CardDescription className="text-sm">
              Ratio personnes/capacité par espace
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Mobile : Liste simple, Desktop : Graphique radial */}
            <div className="block md:hidden">
              <div className="space-y-3">
                {analytics.capacityUtilization.map((item, index) => (
                  <div key={index} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <span className="flex-1 truncate text-sm font-medium">
                        {item.spaceName}
                      </span>
                      <span
                        className="text-lg font-bold"
                        style={{ color: item.color }}
                      >
                        {formatPercentage(item.utilizationRate)}
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full transition-all duration-300"
                          style={{
                            backgroundColor: item.color,
                            width: `${item.utilizationRate}%`,
                          }}
                        />
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {item.avgGuests.toFixed(1)}/{item.capacity} personnes
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop : Graphique radial */}
            <div className="hidden md:block">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    data={analytics.capacityUtilization}
                    cx="50%"
                    cy="50%"
                    innerRadius="20%"
                    outerRadius="90%"
                  >
                    <RadialBar
                      label={false}
                      background={true}
                      dataKey="utilizationRate"
                    />
                    <Tooltip
                      formatter={(value: number) => [
                        formatPercentage(value),
                        'Utilisation',
                      ]}
                      contentStyle={{
                        fontSize: '12px',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                      }}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2">
                {analytics.capacityUtilization.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div className="flex min-w-0 flex-1 items-center space-x-2">
                      <div
                        className="h-3 w-3 flex-shrink-0 rounded"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="truncate text-sm">{item.spaceName}</span>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <div className="text-sm font-medium">
                        {formatPercentage(item.utilizationRate)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.avgGuests.toFixed(1)}/{item.capacity} pers.
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tendance hebdomadaire - Mobile responsive */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">
            Évolution hebdomadaire
          </CardTitle>
          <CardDescription className="text-sm">
            Comparaison des taux d&apos;occupation par semaine
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-48 md:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.weeklyComparison}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="week"
                  fontSize={10}
                  angle={-45}
                  textAnchor="end"
                  height={40}
                />
                <YAxis
                  tickFormatter={formatPercentage}
                  fontSize={10}
                  width={40}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    name === 'occupancyRate' ? formatPercentage(value) : value,
                    name === 'occupancyRate'
                      ? 'Taux d&apos;occupation'
                      : 'Réservations',
                  ]}
                  contentStyle={{
                    fontSize: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                  }}
                />
                <Bar
                  dataKey="occupancyRate"
                  fill="#10b981"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Détails des espaces - Mobile optimisé */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">
            Détails par espace
          </CardTitle>
          <CardDescription className="text-sm">
            Métriques détaillées pour chaque espace de travail
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3">
            {analytics.spaces.map((space) => (
              <Card
                key={space.spaceId}
                className="border-l-4"
                style={{ borderLeftColor: space.color }}
              >
                <CardContent className="p-3 md:p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <h4 className="flex-1 truncate pr-2 text-sm font-medium">
                        {space.spaceName}
                      </h4>
                      <Badge
                        className="flex-shrink-0 text-xs"
                        style={{
                          backgroundColor: `${space.color}20`,
                          color: space.color,
                          borderColor: space.color,
                        }}
                      >
                        {formatPercentage(space.occupancyRate)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Capacité:</span>
                        <div className="font-medium">
                          {space.capacity} pers.
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Réservations:</span>
                        <div className="font-medium">{space.totalBookings}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Heures totales:</span>
                        <div className="font-medium">
                          {formatHours(space.totalHours)}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Durée moyenne:</span>
                        <div className="font-medium">
                          {formatHours(space.avgDuration)}
                        </div>
                      </div>
                    </div>

                    {space.peakHours.length > 0 && (
                      <div>
                        <span className="text-xs text-gray-500">
                          Créneaux populaires:
                        </span>
                        <div className="truncate text-xs font-medium text-blue-600">
                          {space.peakHours.slice(0, 2).join(', ')}
                          {space.peakHours.length > 2 && '...'}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
