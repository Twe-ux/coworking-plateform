'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { motion } from 'framer-motion'
import {
  Activity,
  Calendar,
  Clock,
  Coffee,
  MapPin,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { memo } from 'react'

// Memoized components for better performance
const QuickActionCard = memo(
  ({
    icon: Icon,
    title,
    children,
    className = '',
  }: {
    icon: any
    title: string
    children: React.ReactNode
    className?: string
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Card className="cursor-pointer transition-shadow hover:shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-blue-500" />
          </div>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </motion.div>
  )
)

QuickActionCard.displayName = 'QuickActionCard'

const StatCard = memo(({ icon: Icon, label, value, color }: { icon: any, label: string, value: string, color: string }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <Icon className={`h-4 w-4 ${color}`} />
      <span className="text-sm">{label}</span>
    </div>
    <span className="font-semibold">{value}</span>
  </div>
))

StatCard.displayName = 'StatCard'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-600">Bienvenue sur votre espace coworking</p>
      </div>

      {/* Actions rapides */}
      <motion.div
        className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.1 }}
      >
        <QuickActionCard icon={Calendar} title="Réserver un espace">
          <Link href="/reservation">
            <Button className="w-full">Nouvelle réservation</Button>
          </Link>
        </QuickActionCard>

        <QuickActionCard icon={Clock} title="Mes réservations">
          <div className="text-2xl font-bold">3</div>
          <p className="text-muted-foreground text-xs">Réservations actives</p>
        </QuickActionCard>

        <QuickActionCard icon={MapPin} title="Espaces disponibles">
          <div className="text-2xl font-bold">12</div>
          <p className="text-muted-foreground text-xs">Aujourd&apos;hui</p>
        </QuickActionCard>

        <QuickActionCard icon={Users} title="Communauté">
          <div className="text-2xl font-bold">47</div>
          <p className="text-muted-foreground text-xs">Membres actifs</p>
        </QuickActionCard>
      </motion.div>

      {/* Vue d'ensemble */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Statistiques */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Statistiques
            </CardTitle>
            <CardDescription>Votre activité ce mois</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <StatCard
              icon={Coffee}
              label="Heures réservées"
              value="24h"
              color="text-coffee-accent"
            />
            <StatCard
              icon={Calendar}
              label="Réservations"
              value="8"
              color="text-blue-500"
            />
            <StatCard
              icon={Star}
              label="Points fidélité"
              value="150"
              color="text-yellow-500"
            />
          </CardContent>
        </Card>

        {/* Activité récente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Activité récente
            </CardTitle>
            <CardDescription>Vos dernières actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <div>
                    <p className="text-sm font-medium">Réservation confirmée</p>
                    <p className="text-xs text-gray-600">
                      Salle Verrière - Aujourd&apos;hui
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">Il y a 2h</span>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <div>
                    <p className="text-sm font-medium">Paiement effectué</p>
                    <p className="text-xs text-gray-600">Places - Demain</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">Il y a 1j</span>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <div className="bg-coffee-primary h-2 w-2 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Check-in effectué</p>
                    <p className="text-xs text-gray-600">Étage - Hier</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">Il y a 2j</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Espaces favoris */}
      <Card>
        <CardHeader>
          <CardTitle>Espaces populaires</CardTitle>
          <CardDescription>
            Découvrez les espaces les plus appréciés
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-gray-50">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">Salle Verrière</h3>
                <p className="text-sm text-gray-600">Lumière naturelle</p>
                <div className="mt-1 flex items-center gap-1">
                  <Star className="h-3 w-3 fill-current text-yellow-500" />
                  <span className="text-xs text-gray-600">4.9</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-gray-50">
              <div className="bg-coffee-secondary/30 flex h-12 w-12 items-center justify-center rounded-lg">
                <Coffee className="text-coffee-accent h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Places</h3>
                <p className="text-sm text-gray-600">Espace café</p>
                <div className="mt-1 flex items-center gap-1">
                  <Star className="h-3 w-3 fill-current text-yellow-500" />
                  <span className="text-xs text-gray-600">4.8</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-gray-50">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold">Étage</h3>
                <p className="text-sm text-gray-600">Espace collaboratif</p>
                <div className="mt-1 flex items-center gap-1">
                  <Star className="h-3 w-3 fill-current text-yellow-500" />
                  <span className="text-xs text-gray-600">4.7</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
