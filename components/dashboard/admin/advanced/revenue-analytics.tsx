'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  Line
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
  Filter
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
  monthlyRevenue: number
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
  cancelled: '#ef4444'
}

export function RevenueAnalytics() {
  const { toast } = useToast()
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'bookings' | 'average'>('revenue')

  const loadAnalytics = useCallback(async () => {
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
        title: "Erreur",
        description: "Impossible de charger les analytics",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [period, toast])

  useEffect(() => {
    loadAnalytics()
  }, [loadAnalytics])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const exportReport = async () => {
    try {
      const response = await fetch('/api/dashboard/admin/analytics/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period, type: 'revenue' })
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
          title: "Export réussi",
          description: "Le rapport a été téléchargé"
        })
      } else {
        throw new Error('Erreur export')
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d&apos;exporter le rapport",
        variant: "destructive"
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
        
        alert(`🐛 DEBUG MONGODB:\n\n` +
              `Collections: ${collections}\n\n` + 
              `Total bookings dans DB: ${bookingsDebug.totalBookingsEver}\n` +
              `Bookings dans période (30j): ${bookingsDebug.totalBookingsInPeriod}\n` +
              `Période: ${bookingsDebug.period}\n\n` +
              `Dates des réservations:\n${bookingsDebug.allBookingsDates.map((b: any) => `- ${new Date(b.date).toLocaleDateString()}: ${b.status} (${b.totalPrice}€)`).join('\n')}\n\n` +
              `Voir console pour détails`)
      }
    } catch (error) {
      console.error('Erreur debug:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">Aucune donnée disponible</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec contrôles */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Revenus</h2>
          <p className="text-gray-600">
            Performance financière et tendances des réservations
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            {(['7d', '30d', '90d', '1y'] as const).map((p) => (
              <Button
                key={p}
                size="sm"
                variant={period === p ? 'default' : 'outline'}
                onClick={() => setPeriod(p)}
                className="text-xs"
              >
                {p === '7d' ? '7j' : p === '30d' ? '30j' : p === '90d' ? '90j' : '1an'}
              </Button>
            ))}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={exportReport}
            className="flex items-center space-x-1"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={debugData}
            className="flex items-center space-x-1 bg-red-50 border-red-200"
          >
            <span>🐛</span>
            <span>Debug</span>
          </Button>
          
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

      {/* KPIs principaux */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Revenus totaux</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(analytics.totalRevenue)}
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  {analytics.monthlyGrowth >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className={`text-xs ${
                    analytics.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatPercentage(analytics.monthlyGrowth)}
                  </span>
                </div>
              </div>
              <Euro className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Réservations</p>
                <p className="text-2xl font-bold text-blue-600">
                  {analytics.totalBookings}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {period === '30d' ? 'Ce mois' : 'Période sélectionnée'}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Panier moyen</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(analytics.averageBookingValue)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Par réservation
                </p>
              </div>
              <Users className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Taux occupation</p>
                <p className="text-2xl font-bold text-amber-600">
                  {analytics.topSpaces.length > 0 
                    ? Math.round(analytics.topSpaces.reduce((acc, s) => acc + s.occupancyRate, 0) / analytics.topSpaces.length)
                    : 0}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Moyenne espaces
                </p>
              </div>
              <Building className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphique principal */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Évolution des revenus</CardTitle>
              <CardDescription>
                Tendance sur la période sélectionnée
              </CardDescription>
            </div>
            
            <div className="flex space-x-1">
              {(['revenue', 'bookings', 'average'] as const).map((metric) => (
                <Button
                  key={metric}
                  size="sm"
                  variant={selectedMetric === metric ? 'default' : 'outline'}
                  onClick={() => setSelectedMetric(metric)}
                  className="text-xs"
                >
                  {metric === 'revenue' ? 'Revenus' : 
                   metric === 'bookings' ? 'Réservations' : 'Panier moyen'}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.dailyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date"
                  tickFormatter={(date) => format(new Date(date), 'dd/MM')}
                />
                <YAxis 
                  tickFormatter={(value) => 
                    selectedMetric === 'revenue' || selectedMetric === 'average'
                      ? `${value}€`
                      : value.toString()
                  }
                />
                <Tooltip 
                  formatter={(value: number) => [
                    selectedMetric === 'revenue' ? formatCurrency(value) :
                    selectedMetric === 'bookings' ? value :
                    formatCurrency(value),
                    selectedMetric === 'revenue' ? 'Revenus' :
                    selectedMetric === 'bookings' ? 'Réservations' : 'Panier moyen'
                  ]}
                  labelFormatter={(date) => format(new Date(date), 'dd MMMM yyyy', { locale: fr })}
                />
                <Area
                  type="monotone"
                  dataKey={selectedMetric}
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Graphiques secondaires */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top espaces */}
        <Card>
          <CardHeader>
            <CardTitle>Top espaces par revenus</CardTitle>
            <CardDescription>
              Espaces les plus rentables
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.topSpaces}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="spaceName"
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tickFormatter={(value) => `${value}€`} />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Revenus']}
                  />
                  <Bar dataKey="revenue" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenus par statut */}
        <Card>
          <CardHeader>
            <CardTitle>Revenus par statut</CardTitle>
            <CardDescription>
              Répartition des revenus selon le statut des réservations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.revenueByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    dataKey="revenue"
                    label={({ status, percent }) => 
                      `${status} (${(percent * 100).toFixed(0)}%)`
                    }
                  >
                    {analytics.revenueByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Revenus']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4 space-y-2">
              {analytics.revenueByStatus.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm capitalize">{item.status}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {formatCurrency(item.revenue)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.count} réservations
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