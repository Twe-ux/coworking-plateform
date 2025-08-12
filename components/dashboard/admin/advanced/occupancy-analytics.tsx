'use client'

import { useState, useEffect, useCallback } from 'react'
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

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`
  const formatHours = (value: number) => `${value.toFixed(1)}h`

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
    <div className="space-y-6">
      {/* En-tête avec contrôles */}
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Analytics d&apos;occupation
          </h2>
          <p className="text-gray-600">
            Utilisation et performance des espaces de travail
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={selectedSpace}
            onChange={(e) => setSelectedSpace(e.target.value)}
            className="rounded-md border p-2 text-sm"
          >
            <option value="all">Tous les espaces</option>
            {analytics.spaces.map((space) => (
              <option key={space.spaceId} value={space.spaceId}>
                {space.spaceName}
              </option>
            ))}
          </select>

          <div className="flex space-x-1">
            {(['7d', '30d', '90d'] as const).map((p) => (
              <Button
                key={p}
                size="sm"
                variant={period === p ? 'default' : 'outline'}
                onClick={() => setPeriod(p)}
                className="text-xs"
              >
                {p === '7d' ? '7j' : p === '30d' ? '30j' : '90j'}
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadAnalytics}
            disabled={loading}
            className="flex items-center space-x-1"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </Button>
        </div>
      </div>

      {/* KPIs d'occupation */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  Taux d&apos;occupation moyen
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatPercentage(analytics.averageOccupancyRate)}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Tous espaces confondus
                </p>
              </div>
              <Activity className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Heures réservées</p>
                <p className="text-2xl font-bold text-green-600">
                  {Math.round(analytics.totalBookedHours)}h
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Sur {Math.round(analytics.totalCapacityHours)}h disponibles
                </p>
              </div>
              <Clock className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  Espace le plus populaire
                </p>
                <p className="truncate text-2xl font-bold text-purple-600">
                  {analytics.mostPopularSpace || 'N/A'}
                </p>
                <p className="mt-1 text-xs text-gray-500">Le plus réservé</p>
              </div>
              <MapPin className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Créneau de pointe</p>
                <p className="text-2xl font-bold text-amber-600">
                  {analytics.peakTime || 'N/A'}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Heure la plus demandée
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance des espaces */}
      <Card>
        <CardHeader>
          <CardTitle>Performance par espace</CardTitle>
          <CardDescription>
            Taux d&apos;occupation et utilisation de chaque espace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.spaces}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="spaceName"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  tickFormatter={formatPercentage}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickFormatter={(value) => value.toString()}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    name === 'occupancyRate' ? formatPercentage(value) : value,
                    name === 'occupancyRate'
                      ? 'Taux d&apos;occupation'
                      : 'Réservations',
                  ]}
                />
                <Bar
                  yAxisId="left"
                  dataKey="occupancyRate"
                  fill="#3b82f6"
                  name="occupancyRate"
                />
                <Bar
                  yAxisId="right"
                  dataKey="totalBookings"
                  fill="#10b981"
                  name="totalBookings"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Utilisation par heure et utilisation de la capacité */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Usage par créneau horaire */}
        <Card>
          <CardHeader>
            <CardTitle>Usage par créneaux horaires</CardTitle>
            <CardDescription>
              Répartition des réservations dans la journée
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.hourlyUsage}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis tickFormatter={(value) => value.toString()} />
                  <Tooltip
                    formatter={(value: number) => [value, 'Réservations']}
                  />
                  <Line
                    type="monotone"
                    dataKey="totalBookings"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Utilisation de la capacité */}
        <Card>
          <CardHeader>
            <CardTitle>Utilisation de la capacité</CardTitle>
            <CardDescription>
              Ratio personnes/capacité maximale par espace
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                    minAngle={15}
                    label={{
                      position: 'insideStart',
                      fill: '#fff',
                      fontSize: 12,
                    }}
                    background
                    clockWise
                    dataKey="utilizationRate"
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      formatPercentage(value),
                      'Utilisation',
                    ]}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2">
              {analytics.capacityUtilization.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div
                      className="h-3 w-3 rounded"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="truncate text-sm">{item.spaceName}</span>
                  </div>
                  <div className="text-right">
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
          </CardContent>
        </Card>
      </div>

      {/* Tendance hebdomadaire */}
      <Card>
        <CardHeader>
          <CardTitle>Évolution hebdomadaire</CardTitle>
          <CardDescription>
            Comparaison des taux d&apos;occupation par semaine
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.weeklyComparison}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis tickFormatter={formatPercentage} />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    name === 'occupancyRate' ? formatPercentage(value) : value,
                    name === 'occupancyRate'
                      ? 'Taux d&apos;occupation'
                      : 'Réservations',
                  ]}
                />
                <Bar dataKey="occupancyRate" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Détails des espaces */}
      <Card>
        <CardHeader>
          <CardTitle>Détails par espace</CardTitle>
          <CardDescription>
            Métriques détaillées pour chaque espace de travail
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {analytics.spaces.map((space) => (
              <Card
                key={space.spaceId}
                className="border-l-4"
                style={{ borderLeftColor: space.color }}
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <h4 className="truncate pr-2 text-sm font-medium">
                        {space.spaceName}
                      </h4>
                      <Badge
                        className="text-xs"
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
                        <div className="text-xs font-medium text-blue-600">
                          {space.peakHours.slice(0, 3).join(', ')}
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
