import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Tableau de bord
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Bienvenue sur votre espace coworking
        </p>
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="cursor-pointer transition-shadow hover:shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                Réserver un espace
              </CardTitle>
              <Calendar className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <Link href="/reservation">
              <Button className="w-full">Nouvelle réservation</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="transition-shadow hover:shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                Mes réservations
              </CardTitle>
              <Clock className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-muted-foreground text-xs">
              Réservations actives
            </p>
          </CardContent>
        </Card>

        <Card className="transition-shadow hover:shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                Espaces disponibles
              </CardTitle>
              <MapPin className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-muted-foreground text-xs">Aujourd&apos;hui</p>
          </CardContent>
        </Card>

        <Card className="transition-shadow hover:shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Communauté</CardTitle>
              <Users className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">47</div>
            <p className="text-muted-foreground text-xs">Membres actifs</p>
          </CardContent>
        </Card>
      </div>

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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coffee className="text-coffee-primary h-4 w-4" />
                <span className="text-sm">Heures réservées</span>
              </div>
              <span className="font-semibold">24h</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Réservations</span>
              </div>
              <span className="font-semibold">8</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">Points fidélité</span>
              </div>
              <span className="font-semibold">150</span>
            </div>
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
                      Salle Verrière - Aujourd'hui
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
            <div className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">
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

            <div className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">
              <div className="bg-coffee-secondary/30 flex h-12 w-12 items-center justify-center rounded-lg">
                <Coffee className="text-coffee-primary h-6 w-6" />
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

            <div className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">
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
