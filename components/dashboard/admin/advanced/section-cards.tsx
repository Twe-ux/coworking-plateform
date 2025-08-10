'use client'

import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  Building,
  DollarSign,
  Clock,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/dashboard/admin/advanced/ui/card'
import { Badge } from '@/components/dashboard/admin/advanced/ui/badge'
import { cn } from '@/lib/utils'

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

interface SectionCardsProps {
  data: DashboardData
}

export function SectionCards({ data }: SectionCardsProps) {
  const cards = [
    {
      title: 'Revenus Totaux',
      value: data.totalRevenue,
      description: 'Chiffre d&apos;affaires confirmé uniquement',
      icon: DollarSign,
      format: 'currency',
      trend: {
        value: data.weeklyGrowth,
        label: 'vs semaine dernière',
      },
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Réservations',
      value: data.totalBookings,
      description: `${data.bookingsByStatus.pending} en attente de validation`,
      icon: Calendar,
      format: 'number',
      trend: {
        value: data.weeklyGrowth,
        label: 'cette semaine',
      },
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      badge: {
        text: `${data.bookingsByStatus.confirmed} confirmées`,
        variant: 'default' as const,
      },
    },
    {
      title: 'Utilisateurs Actifs',
      value: data.totalUsers,
      description: `${data.usersByRole.client} clients, ${data.usersByRole.staff} staff`,
      icon: Users,
      format: 'number',
      trend: {
        value: Math.round((data.usersByRole.client / data.totalUsers) * 100),
        label: '% clients',
      },
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      badge: {
        text: `${data.usersByRole.admin + data.usersByRole.manager} admins`,
        variant: 'outline' as const,
      },
    },
    {
      title: 'Taux d&apos;Occupation',
      value: data.occupancyRate,
      description: 'Basé sur les réservations confirmées',
      icon: Building,
      format: 'percentage',
      trend: {
        value: data.occupancyRate > 75 ? 5 : -2,
        label: data.occupancyRate > 75 ? 'Très bon' : 'À améliorer',
      },
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Aujourd&apos;hui',
      value: data.todayBookings,
      description: 'Réservations du jour en cours',
      icon: Clock,
      format: 'number',
      trend: {
        value: data.todayBookings > 5 ? 10 : -5,
        label: data.todayBookings > 5 ? 'Journée chargée' : 'Calme',
      },
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      title: 'Performance',
      value: Math.round(
        (data.bookingsByStatus.confirmed / data.totalBookings) * 100
      ),
      description: 'Taux de confirmation des réservations',
      icon: BarChart3,
      format: 'percentage',
      trend: {
        value:
          data.bookingsByStatus.confirmed > data.bookingsByStatus.pending
            ? 8
            : -3,
        label: 'taux de conversion',
      },
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      badge: {
        text: `${data.bookingsByStatus.cancelled} annulées`,
        variant: 'destructive' as const,
      },
    },
  ]

  const formatValue = (value: number, format: string) => {
    switch (format) {
      case 'currency':
        return `€${value.toLocaleString()}`
      case 'percentage':
        return `${value}%`
      default:
        return value.toLocaleString()
    }
  }

  const getTrendIcon = (value: number) => {
    if (value > 0) return ArrowUpRight
    if (value < 0) return ArrowDownRight
    return ArrowUpRight
  }

  const getTrendColor = (value: number) => {
    if (value > 0) return 'text-green-600'
    if (value < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card, index) => {
        const Icon = card.icon
        const TrendIcon = getTrendIcon(card.trend.value)
        const trendColor = getTrendColor(card.trend.value)

        return (
          <Card
            key={card.title}
            className={cn(
              'transition-all duration-200 hover:scale-105 hover:shadow-lg',
              'border-l-4',
              card.color === 'text-green-600' && 'border-l-green-500',
              card.color === 'text-blue-600' && 'border-l-blue-500',
              card.color === 'text-purple-600' && 'border-l-purple-500',
              card.color === 'text-orange-600' && 'border-l-orange-500',
              card.color === 'text-indigo-600' && 'border-l-indigo-500',
              card.color === 'text-emerald-600' && 'border-l-emerald-500'
            )}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                {card.title}
              </CardTitle>
              <div className={cn('rounded-lg p-2', card.bgColor)}>
                <Icon className={cn('h-4 w-4', card.color)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatValue(card.value, card.format)}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <CardDescription className="text-xs">
                  {card.description}
                </CardDescription>
                {card.badge && (
                  <Badge variant={card.badge.variant} className="text-xs">
                    {card.badge.text}
                  </Badge>
                )}
              </div>
              <div className="mt-3 flex items-center text-xs">
                <TrendIcon className={cn('mr-1 h-3 w-3', trendColor)} />
                <span className={cn('font-medium', trendColor)}>
                  {card.trend.value > 0 ? '+' : ''}
                  {card.trend.value}
                </span>
                <span className="text-muted-foreground ml-1">
                  {card.trend.label}
                </span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
