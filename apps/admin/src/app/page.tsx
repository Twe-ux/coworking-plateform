'use client'

import { Badge, Button, Card } from '@coworking/ui'
import {
  ActivityIcon,
  ArrowRightIcon,
  BarChart3Icon,
  CheckCircleIcon,
  PlusIcon,
  ShieldIcon,
  TrendingDown,
  TrendingUp,
  TrendingUpIcon,
  UsersIcon,
} from 'lucide-react'
import Link from 'next/link'
import React from 'react'

const DashboardCard: React.FC<{
  title: string
  value: string | number
  description: string
  icon: React.ReactNode
  color?: 'blue' | 'green' | 'orange' | 'purple'
  trend?: { value: string; positive: boolean }
}> = ({ title, value, description, icon, color = 'blue', trend }) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
    green: 'text-green-600 bg-green-100 dark:bg-green-900/20',
    orange: 'text-orange-600 bg-orange-100 dark:bg-orange-900/20',
    purple: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20',
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-muted-foreground text-sm font-medium">{title}</p>
          <div className="space-y-1">
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-muted-foreground text-xs">{description}</p>
            {trend && (
              <div className="flex items-center gap-1">
                <span
                  className={`flex gap-2 text-xs ${trend.positive ? 'font-bold text-green-600' : 'font-bold text-red-600'}`}
                >
                  {trend.positive ? (
                    <TrendingUp size={16} />
                  ) : (
                    <TrendingDown size={16} />
                  )}
                  {trend.value}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className={`rounded-full p-3 ${colorClasses[color]}`}>{icon}</div>
      </div>
    </Card>
  )
}

const QuickAction: React.FC<{
  title: string
  description: string
  href: string
  icon: React.ReactNode
}> = ({ title, description, href, icon }) => (
  <Link href={href}>
    <Card className="cursor-pointer p-4 transition-shadow hover:shadow-md">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 rounded-md p-2">{icon}</div>
        <div className="flex-1">
          <h3 className="font-medium">{title}</h3>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
        <ArrowRightIcon className="text-muted-foreground h-4 w-4" />
      </div>
    </Card>
  </Link>
)

export default function AdminDashboard() {
  return (
    <div className="space-y-6 p-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-muted-foreground">
            Vue d'ensemble de votre plateforme de coworking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <CheckCircleIcon className="h-3 w-3" />
            Système opérationnel
          </Badge>
          <Button asChild>
            <Link href="/users/new">
              <PlusIcon className="mr-2 h-4 w-4" />
              Nouvel utilisateur
            </Link>
          </Button>
        </div>
      </div>

      {/* Statistiques principales */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Total utilisateurs"
          value="1,234"
          description="Tous les utilisateurs"
          icon={<UsersIcon className="h-6 w-6" />}
          color="blue"
          trend={{ value: '+12%', positive: true }}
        />
        <DashboardCard
          title="Utilisateurs actifs"
          value="987"
          description="Actifs ce mois"
          icon={<ActivityIcon className="h-6 w-6" />}
          color="green"
          trend={{ value: '+5%', positive: true }}
        />
        <DashboardCard
          title="Nouveaux inscrits"
          value="45"
          description="Ce mois-ci"
          icon={<TrendingUpIcon className="h-6 w-6" />}
          color="purple"
          trend={{ value: '+23%', positive: true }}
        />
        <DashboardCard
          title="Comptes suspendus"
          value="12"
          description="Nécessitent attention"
          icon={<ShieldIcon className="h-6 w-6" />}
          color="orange"
          trend={{ value: '-8%', positive: true }}
        />
      </div>

      {/* Actions rapides et contenu principal */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Actions rapides */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Actions rapides</h2>
          <div className="flex flex-col space-y-6">
            <QuickAction
              title="Gérer les utilisateurs"
              description="Voir, modifier et gérer tous les utilisateurs"
              href="/users"
              icon={<UsersIcon className="text-primary h-4 w-4" />}
            />
            <QuickAction
              title="Créer un utilisateur"
              description="Ajouter un nouvel utilisateur à la plateforme"
              href="/users/new"
              icon={<PlusIcon className="text-primary h-4 w-4" />}
            />
            <QuickAction
              title="Voir les statistiques"
              description="Analyser les données de la plateforme"
              href="/stats"
              icon={<BarChart3Icon className="text-primary h-4 w-4" />}
            />
          </div>
        </div>

        {/* Activité récente */}
        <div className="space-y-4 lg:col-span-2">
          <h2 className="text-xl font-semibold">Activité récente</h2>
          <Card className="p-6">
            <div className="space-y-4">
              {[
                {
                  action: 'Nouvel utilisateur créé',
                  user: 'Jean Dupont',
                  time: 'Il y a 5 minutes',
                  type: 'success',
                },
                {
                  action: 'Utilisateur suspendu',
                  user: 'Marie Martin',
                  time: 'Il y a 1 heure',
                  type: 'warning',
                },
                {
                  action: 'Mise à jour du profil',
                  user: 'Pierre Durand',
                  time: 'Il y a 2 heures',
                  type: 'info',
                },
                {
                  action: 'Connexion admin',
                  user: 'Admin User',
                  time: 'Il y a 3 heures',
                  type: 'info',
                },
              ].map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 border-b pb-3 last:border-b-0 last:pb-0"
                >
                  <div
                    className={`h-2 w-2 rounded-full ${
                      activity.type === 'success'
                        ? 'bg-green-500'
                        : activity.type === 'warning'
                          ? 'bg-orange-500'
                          : 'bg-blue-500'
                    }`}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-muted-foreground text-xs">
                      {activity.user}
                    </p>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Métriques détaillées */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold">Répartition par rôle</h3>
          <div className="space-y-3">
            {[
              {
                role: 'Clients',
                count: 856,
                color: 'bg-blue-500',
                percentage: 69,
              },
              {
                role: 'Personnel',
                count: 234,
                color: 'bg-green-500',
                percentage: 19,
              },
              {
                role: 'Managers',
                count: 89,
                color: 'bg-purple-500',
                percentage: 7,
              },
              {
                role: 'Admins',
                count: 55,
                color: 'bg-orange-500',
                percentage: 5,
              },
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${item.color}`} />
                <div className="flex flex-1 items-center justify-between">
                  <span className="text-sm font-medium">{item.role}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">
                      {item.count}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      ({item.percentage}%)
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold">Statuts des comptes</h3>
          <div className="space-y-3">
            {[
              {
                status: 'Actifs',
                count: 987,
                color: 'bg-green-500',
                percentage: 80,
              },
              {
                status: 'Inactifs',
                count: 235,
                color: 'bg-gray-500',
                percentage: 19,
              },
              {
                status: 'Suspendus',
                count: 12,
                color: 'bg-red-500',
                percentage: 1,
              },
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${item.color}`} />
                <div className="flex flex-1 items-center justify-between">
                  <span className="text-sm font-medium">{item.status}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">
                      {item.count}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      ({item.percentage}%)
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
