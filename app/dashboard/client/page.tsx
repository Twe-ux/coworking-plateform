import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, Clock, Users } from 'lucide-react'
import Link from 'next/link'

export default function ClientDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard Client
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Gérez vos réservations et découvrez nos espaces
        </p>
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Nouvelle réservation</CardTitle>
              <Calendar className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <Link href="/reservation">
              <Button className="w-full">Réserver</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Mes réservations</CardTitle>
              <Clock className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Réservations actives</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Espaces disponibles</CardTitle>
              <MapPin className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Aujourd'hui</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Communauté</CardTitle>
              <Users className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">47</div>
            <p className="text-xs text-muted-foreground">Membres en ligne</p>
          </CardContent>
        </Card>
      </div>

      {/* Mes réservations récentes */}
      <Card>
        <CardHeader>
          <CardTitle>Mes réservations récentes</CardTitle>
          <CardDescription>
            Aperçu de vos dernières réservations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-semibold">Bureau privé #12</h3>
                <p className="text-sm text-gray-600">Aujourd'hui, 14:00 - 18:00</p>
              </div>
              <div className="text-green-600 font-semibold">Confirmée</div>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-semibold">Salle de réunion A</h3>
                <p className="text-sm text-gray-600">Demain, 10:00 - 12:00</p>
              </div>
              <div className="text-blue-600 font-semibold">À venir</div>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-semibold">Espace coworking</h3>
                <p className="text-sm text-gray-600">Hier, 09:00 - 17:00</p>
              </div>
              <div className="text-gray-600 font-semibold">Terminée</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}