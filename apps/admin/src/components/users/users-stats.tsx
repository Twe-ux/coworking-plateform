"use client"

import React from 'react'
import { 
  UsersIcon, 
  UserCheckIcon, 
  UserXIcon, 
  ShieldIcon,
  TrendingUpIcon,
  CalendarIcon,
  PieChartIcon
} from 'lucide-react'
import { UserStats } from '@/types/admin'
import { Card } from '@coworking/ui'

interface UsersStatsProps {
  stats: UserStats
  loading?: boolean
}

const StatCard: React.FC<{
  title: string
  value: number
  icon: React.ReactNode
  description?: string
  trend?: 'up' | 'down' | 'stable'
  trendValue?: string
  color?: 'blue' | 'green' | 'red' | 'orange' | 'purple'
}> = ({ title, value, icon, description, trend, trendValue, color = 'blue' }) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
    green: 'text-green-600 bg-green-100 dark:bg-green-900/20',
    red: 'text-red-600 bg-red-100 dark:bg-red-900/20',
    orange: 'text-orange-600 bg-orange-100 dark:bg-orange-900/20',
    purple: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20'
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="space-y-1">
            <p className="text-2xl font-bold">{value.toLocaleString()}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {trend && trendValue && (
              <div className="flex items-center gap-1 text-xs">
                <TrendingUpIcon 
                  className={`h-3 w-3 ${
                    trend === 'up' ? 'text-green-600' : 
                    trend === 'down' ? 'text-red-600' : 
                    'text-gray-600'
                  }`} 
                />
                <span className={
                  trend === 'up' ? 'text-green-600' : 
                  trend === 'down' ? 'text-red-600' : 
                  'text-gray-600'
                }>
                  {trendValue}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </Card>
  )
}

export const UsersStats: React.FC<UsersStatsProps> = ({ stats, loading = false }) => {
  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-20"></div>
                  <div className="h-8 bg-muted rounded w-16"></div>
                </div>
                <div className="h-12 w-12 bg-muted rounded-full"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistiques principales */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total utilisateurs"
          value={stats.totalUsers}
          icon={<UsersIcon className="h-6 w-6" />}
          description="Tous les utilisateurs"
          color="blue"
        />
        
        <StatCard
          title="Utilisateurs actifs"
          value={stats.activeUsers}
          icon={<UserCheckIcon className="h-6 w-6" />}
          description={`${((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}% du total`}
          color="green"
        />
        
        <StatCard
          title="Utilisateurs inactifs"
          value={stats.inactiveUsers}
          icon={<UserXIcon className="h-6 w-6" />}
          description={`${((stats.inactiveUsers / stats.totalUsers) * 100).toFixed(1)}% du total`}
          color="orange"
        />
        
        <StatCard
          title="Utilisateurs suspendus"
          value={stats.suspendedUsers}
          icon={<ShieldIcon className="h-6 w-6" />}
          description={`${((stats.suspendedUsers / stats.totalUsers) * 100).toFixed(1)}% du total`}
          color="red"
        />
      </div>

      {/* Statistiques secondaires */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Nouveaux ce mois"
          value={stats.newUsersThisMonth}
          icon={<TrendingUpIcon className="h-6 w-6" />}
          description="Utilisateurs créés ce mois"
          color="purple"
        />
        
        <StatCard
          title="Connexions récentes"
          value={stats.recentLogins}
          icon={<CalendarIcon className="h-6 w-6" />}
          description="Connexions cette semaine"
          color="blue"
        />

        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">Répartition par rôle</h3>
            </div>
            <div className="space-y-2">
              {Object.entries(stats.usersByRole).map(([role, count]) => (
                <div key={role} className="flex justify-between items-center">
                  <span className="text-sm capitalize">{role}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Répartition par département (si des données existent) */}
      {Object.keys(stats.usersByDepartment).length > 0 && (
        <Card className="p-6">
          <div className="space-y-4">
            <h3 className="font-semibold">Répartition par département</h3>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(stats.usersByDepartment).map(([department, count]) => (
                <div key={department} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                  <span className="text-sm">{department}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}