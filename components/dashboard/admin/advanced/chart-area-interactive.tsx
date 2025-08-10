'use client'

import { Badge } from '@/components/dashboard/admin/advanced/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/dashboard/admin/advanced/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/dashboard/admin/advanced/ui/select'
import {
  BarChart3,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface DashboardData {
  totalBookings: number
  totalRevenue: number
  totalUsers: number
  occupancyRate: number
  todayBookings: number
  weeklyGrowth: number
  bookingsByStatus: {
    confirmed: number
    pending: number
    cancelled: number
    total: number
  }
  usersByRole: {
    client: number
    staff: number
    manager: number
    admin: number
  }
}

interface ChartAreaInteractiveProps {
  data: DashboardData
}

export function ChartAreaInteractive({ data }: ChartAreaInteractiveProps) {
  const [chartType, setChartType] = useState<
    'revenue' | 'bookings' | 'users' | 'occupancy'
  >('revenue')
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')

  // Données temporaires pour les graphiques - TODO: récupérer depuis API chart selon timeRange
  const revenueData = [
    { name: 'Lun', value: 240, bookings: 8 },
    { name: 'Mar', value: 420, bookings: 12 },
    { name: 'Mer', value: 380, bookings: 15 },
    { name: 'Jeu', value: 520, bookings: 18 },
    { name: 'Ven', value: 680, bookings: 22 },
    { name: 'Sam', value: 820, bookings: 28 },
    { name: 'Dim', value: 450, bookings: 16 },
  ]

  const bookingsData = [
    { name: 'Sem 1', confirmed: 45, pending: 12, cancelled: 3 },
    { name: 'Sem 2', confirmed: 52, pending: 8, cancelled: 5 },
    { name: 'Sem 3', confirmed: 48, pending: 15, cancelled: 2 },
    { name: 'Sem 4', confirmed: 61, pending: 9, cancelled: 4 },
  ]

  const usersData = [
    { name: 'Clients', value: data.usersByRole.client, color: '#3b82f6' },
    { name: 'Staff', value: data.usersByRole.staff, color: '#10b981' },
    { name: 'Managers', value: data.usersByRole.manager, color: '#f59e0b' },
    { name: 'Admins', value: data.usersByRole.admin, color: '#ef4444' },
  ]

  const occupancyData = [
    { name: 'Salle Verrière', value: 85 },
    { name: 'Espace Co-Lab', value: 72 },
    { name: 'Bureau Privé', value: 90 },
    { name: 'Salle de Réunion', value: 65 },
    { name: 'Open Space', value: 78 },
    { name: 'Cabine Phone', value: 45 },
  ]

  const chartConfigs = {
    revenue: {
      title: 'Évolution des Revenus',
      description: 'Revenus journaliers des 7 derniers jours',
      icon: DollarSign,
      color: '#10b981',
    },
    bookings: {
      title: 'Réservations par Semaine',
      description: 'Statut des réservations sur 4 semaines',
      icon: Calendar,
      color: '#3b82f6',
    },
    users: {
      title: 'Répartition des Utilisateurs',
      description: 'Distribution par rôle',
      icon: Users,
      color: '#8b5cf6',
    },
    occupancy: {
      title: 'Taux d&apos;Occupation par Espace',
      description: 'Utilisation moyenne des espaces',
      icon: BarChart3,
      color: '#f59e0b',
    },
  }

  const currentConfig = chartConfigs[chartType]
  const Icon = currentConfig.icon

  const renderChart = () => {
    switch (chartType) {
      case 'revenue':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="name"
                className="fill-muted-foreground text-xs"
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                className="fill-muted-foreground text-xs"
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `€${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
                formatter={(value: any, name: string) => [
                  name === 'value' ? `€${value}` : value,
                  name === 'value' ? 'Revenus' : 'Réservations',
                ]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={currentConfig.color}
                fill={currentConfig.color}
                fillOpacity={0.1}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="bookings"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            </AreaChart>
          </ResponsiveContainer>
        )

      case 'bookings':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={bookingsData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="name"
                className="fill-muted-foreground text-xs"
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                className="fill-muted-foreground text-xs"
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
              />
              <Bar dataKey="confirmed" stackId="a" fill="#10b981" />
              <Bar dataKey="pending" stackId="a" fill="#f59e0b" />
              <Bar dataKey="cancelled" stackId="a" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        )

      case 'users':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={usersData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {usersData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
                formatter={(value: any, name: string) => [value, name]}
              />
            </PieChart>
          </ResponsiveContainer>
        )

      case 'occupancy':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={occupancyData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                type="number"
                domain={[0, 100]}
                className="fill-muted-foreground text-xs"
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `${value}%`}
              />
              <YAxis
                type="category"
                dataKey="name"
                className="fill-muted-foreground text-xs"
                axisLine={false}
                tickLine={false}
                width={120}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
                formatter={(value: any) => [`${value}%`, 'Occupation']}
              />
              <Bar dataKey="value" fill={currentConfig.color} />
            </BarChart>
          </ResponsiveContainer>
        )

      default:
        return null
    }
  }

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
        <div className="flex items-center space-x-2">
          <div className="bg-muted rounded-lg p-2">
            <Icon className="h-4 w-4" style={{ color: currentConfig.color }} />
          </div>
          <div>
            <CardTitle className="text-lg">{currentConfig.title}</CardTitle>
            <CardDescription>{currentConfig.description}</CardDescription>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Select
            value={chartType}
            onValueChange={(value: any) => setChartType(value)}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="revenue">Revenus</SelectItem>
              <SelectItem value="bookings">Réservations</SelectItem>
              <SelectItem value="users">Utilisateurs</SelectItem>
              <SelectItem value="occupancy">Occupation</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={timeRange}
            onValueChange={(value: any) => setTimeRange(value)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 jours</SelectItem>
              <SelectItem value="30d">30 jours</SelectItem>
              <SelectItem value="90d">90 jours</SelectItem>
              <SelectItem value="1y">1 an</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {renderChart()}

        {chartType === 'bookings' && (
          <div className="mt-4 flex justify-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="h-3 w-3 rounded bg-green-500" />
              <span className="text-muted-foreground text-sm">Confirmées</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-3 w-3 rounded bg-yellow-500" />
              <span className="text-muted-foreground text-sm">En attente</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-3 w-3 rounded bg-red-500" />
              <span className="text-muted-foreground text-sm">Annulées</span>
            </div>
          </div>
        )}

        {chartType === 'users' && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            {usersData.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  <div
                    className="h-3 w-3 rounded"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-muted-foreground text-sm">
                    {item.name}
                  </span>
                </div>
                <Badge variant="outline">{item.value}</Badge>
              </div>
            ))}
          </div>
        )}

        {chartType === 'revenue' && (
          <div className="bg-muted/50 mt-4 flex items-center justify-between rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Tendance positive</span>
            </div>
            <div className="text-right">
              <div className="text-muted-foreground text-sm">
                Revenus moyens/jour
              </div>
              <div className="font-semibold">
                €
                {Math.round(
                  revenueData.reduce((sum, item) => sum + item.value, 0) /
                    revenueData.length
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
