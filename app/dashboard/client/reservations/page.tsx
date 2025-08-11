'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import {
  format,
  parseISO,
  isToday,
  isTomorrow,
  isPast,
  isFuture,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Coffee,
  Calendar,
  MapPin,
  Clock,
  Search,
  Filter,
  AlertCircle,
  CheckCircle,
  Loader2,
  Edit,
  Trash2,
  Eye,
} from 'lucide-react'
import Link from 'next/link'
import { ClientLayout } from '@/components/dashboard/client/client-layout'
import { ClientCard } from '@/components/dashboard/client/client-cards'

interface BookingData {
  id: string
  space: {
    name: string
    location: string
    image?: string
  }
  date: string
  startTime: string
  endTime: string
  duration: number
  durationType: 'hour' | 'day'
  guests: number
  totalPrice: number
  status:
    | 'pending'
    | 'confirmed'
    | 'cancelled'
    | 'completed'
    | 'payment_pending'
  paymentStatus: string
  paymentMethod: 'onsite' | 'stripe_card' | 'stripe_paypal'
  createdAt: string
}

export default function ClientReservationsPage() {
  const { data: session } = useSession()
  const [bookings, setBookings] = useState<BookingData[]>([])
  const [filteredBookings, setFilteredBookings] = useState<BookingData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Récupérer les réservations
  useEffect(() => {
    const fetchBookings = async () => {
      if (!session?.user?.id) return

      try {
        const response = await fetch('/api/bookings')
        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.error || 'Erreur lors de la récupération des réservations'
          )
        }

        setBookings(data.bookings || [])
        setFilteredBookings(data.bookings || [])
      } catch (err) {
        console.error('Erreur récupération réservations:', err)
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [session?.user?.id])

  // Filtrer les réservations
  useEffect(() => {
    let filtered = [...bookings]

    // Filtre par recherche
    if (searchQuery) {
      filtered = filtered.filter(
        (booking) =>
          booking.space.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          booking.space.location
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      )
    }

    // Filtre par statut
    if (statusFilter !== 'all') {
      if (statusFilter === 'upcoming') {
        filtered = filtered.filter(
          (booking) =>
            booking.status === 'confirmed' && isFuture(parseISO(booking.date))
        )
      } else if (statusFilter === 'past') {
        filtered = filtered.filter((booking) => isPast(parseISO(booking.date)))
      } else {
        filtered = filtered.filter((booking) => booking.status === statusFilter)
      }
    }

    setFilteredBookings(filtered)
  }, [bookings, searchQuery, statusFilter])

  // Fonction pour obtenir le statut visuel d'une réservation
  const getBookingStatusInfo = (booking: BookingData) => {
    const bookingDate = parseISO(booking.date)

    if (booking.status === 'cancelled') {
      return {
        label: 'Annulée',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: AlertCircle,
      }
    }

    if (booking.status === 'payment_pending') {
      return {
        label: 'Paiement en attente',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: Clock,
      }
    }

    if (isPast(bookingDate) && booking.status === 'confirmed') {
      return {
        label: 'Terminée',
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: CheckCircle,
      }
    }

    if (isToday(bookingDate)) {
      return {
        label: "Aujourd'hui",
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle,
      }
    }

    if (isTomorrow(bookingDate)) {
      return {
        label: 'Demain',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: Calendar,
      }
    }

    return {
      label: 'À venir',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: Calendar,
    }
  }

  // Statistiques des réservations
  const stats = {
    total: bookings.length,
    upcoming: bookings.filter(
      (b) => b.status === 'confirmed' && isFuture(parseISO(b.date))
    ).length,
    past: bookings.filter((b) => isPast(parseISO(b.date))).length,
    pending: bookings.filter((b) => b.status === 'payment_pending').length,
  }

  return (
    <ClientLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1
            className="mb-2 text-2xl font-bold md:text-3xl"
            style={{ color: 'var(--color-coffee-primary)' }}
          >
            Mes réservations
          </h1>
          <p style={{ color: 'var(--color-client-muted)' }}>
            Gérez toutes vos réservations d&apos;espaces de coworking
          </p>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div
            className="rounded-lg border p-4 text-center"
            style={{
              backgroundColor: 'var(--color-client-card)',
              borderColor: 'var(--color-client-border)',
            }}
          >
            <div
              className="text-2xl font-bold"
              style={{ color: 'var(--color-coffee-primary)' }}
            >
              {stats.total}
            </div>
            <p
              className="text-sm"
              style={{ color: 'var(--color-client-muted)' }}
            >
              Total
            </p>
          </div>

          <div
            className="rounded-lg border p-4 text-center"
            style={{
              backgroundColor: 'var(--color-client-card)',
              borderColor: 'var(--color-client-border)',
            }}
          >
            <div
              className="text-2xl font-bold"
              style={{ color: 'var(--color-coffee-accent)' }}
            >
              {stats.upcoming}
            </div>
            <p
              className="text-sm"
              style={{ color: 'var(--color-client-muted)' }}
            >
              À venir
            </p>
          </div>

          <div
            className="rounded-lg border p-4 text-center"
            style={{
              backgroundColor: 'var(--color-client-card)',
              borderColor: 'var(--color-client-border)',
            }}
          >
            <div className="text-2xl font-bold text-gray-600">{stats.past}</div>
            <p
              className="text-sm"
              style={{ color: 'var(--color-client-muted)' }}
            >
              Passées
            </p>
          </div>

          <div
            className="rounded-lg border p-4 text-center"
            style={{
              backgroundColor: 'var(--color-client-card)',
              borderColor: 'var(--color-client-border)',
            }}
          >
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pending}
            </div>
            <p
              className="text-sm"
              style={{ color: 'var(--color-client-muted)' }}
            >
              En attente
            </p>
          </div>
        </div>

        {/* Filtres et recherche */}
        <ClientCard title="Filtres et recherche" icon={Filter}>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search
                  className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
                  style={{ color: 'var(--color-client-muted)' }}
                />
                <Input
                  placeholder="Rechercher par nom d'espace ou lieu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  style={{ backgroundColor: 'var(--color-client-bg)' }}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
                style={
                  statusFilter === 'all'
                    ? {
                        backgroundColor: 'var(--color-coffee-primary)',
                        borderColor: 'var(--color-coffee-primary)',
                      }
                    : {}
                }
              >
                Toutes
              </Button>
              <Button
                variant={statusFilter === 'upcoming' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('upcoming')}
                style={
                  statusFilter === 'upcoming'
                    ? {
                        backgroundColor: 'var(--color-coffee-primary)',
                        borderColor: 'var(--color-coffee-primary)',
                      }
                    : {}
                }
              >
                À venir
              </Button>
              <Button
                variant={statusFilter === 'past' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('past')}
                style={
                  statusFilter === 'past'
                    ? {
                        backgroundColor: 'var(--color-coffee-primary)',
                        borderColor: 'var(--color-coffee-primary)',
                      }
                    : {}
                }
              >
                Passées
              </Button>
              <Button
                variant={
                  statusFilter === 'payment_pending' ? 'default' : 'outline'
                }
                size="sm"
                onClick={() => setStatusFilter('payment_pending')}
                style={
                  statusFilter === 'payment_pending'
                    ? {
                        backgroundColor: 'var(--color-coffee-primary)',
                        borderColor: 'var(--color-coffee-primary)',
                      }
                    : {}
                }
              >
                En attente
              </Button>
            </div>
          </div>
        </ClientCard>

        {/* Liste des réservations */}
        <ClientCard
          title="Réservations"
          description={`${filteredBookings.length} réservation${filteredBookings.length > 1 ? 's' : ''} trouvée${filteredBookings.length > 1 ? 's' : ''}`}
          icon={Calendar}
        >
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2
                className="h-8 w-8 animate-spin"
                style={{ color: 'var(--color-coffee-primary)' }}
              />
              <span
                className="ml-2"
                style={{ color: 'var(--color-client-muted)' }}
              >
                Chargement...
              </span>
            </div>
          )}

          {error && (
            <div className="py-8 text-center">
              <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
              <p className="font-medium text-red-600">{error}</p>
            </div>
          )}

          {!loading && !error && filteredBookings.length === 0 && (
            <div className="py-8 text-center">
              <Coffee
                className="mx-auto mb-4 h-12 w-12"
                style={{ color: 'var(--color-coffee-muted)' }}
              />
              <p style={{ color: 'var(--color-client-muted)' }}>
                {searchQuery || statusFilter !== 'all'
                  ? 'Aucune réservation trouvée avec ces critères'
                  : 'Aucune réservation trouvée'}
              </p>
            </div>
          )}

          {!loading && !error && filteredBookings.length > 0 && (
            <div className="space-y-4">
              {filteredBookings
                .sort(
                  (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                )
                .map((booking) => {
                  const statusInfo = getBookingStatusInfo(booking)
                  const StatusIcon = statusInfo.icon

                  return (
                    <div
                      key={booking.id}
                      className="rounded-lg border p-4 transition-all hover:shadow-md"
                      style={{
                        borderColor: 'var(--color-client-border)',
                        backgroundColor: 'var(--color-client-bg)',
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="mb-2 flex items-center gap-2">
                            <h3
                              className="text-lg font-semibold"
                              style={{ color: 'var(--color-client-text)' }}
                            >
                              {booking.space.name}
                            </h3>
                            <Badge
                              variant="outline"
                              className={`text-xs ${statusInfo.color}`}
                            >
                              <StatusIcon className="mr-1 h-3 w-3" />
                              {statusInfo.label}
                            </Badge>
                          </div>

                          <div
                            className="mb-3 grid grid-cols-1 gap-2 text-sm md:grid-cols-3"
                            style={{ color: 'var(--color-client-muted)' }}
                          >
                            <p className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {format(
                                parseISO(booking.date),
                                'EEEE d MMMM yyyy',
                                { locale: fr }
                              )}
                            </p>
                            <p className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {booking.startTime} - {booking.endTime}
                            </p>
                            <p className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {booking.space.location}
                            </p>
                          </div>

                          <div className="flex items-center justify-between">
                            <div
                              className="text-xl font-bold"
                              style={{ color: 'var(--color-coffee-primary)' }}
                            >
                              {new Intl.NumberFormat('fr-FR', {
                                style: 'currency',
                                currency: 'EUR',
                              }).format(booking.totalPrice)}
                            </div>

                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                <Eye className="mr-1 h-4 w-4" />
                                Voir
                              </Button>

                              {booking.status === 'confirmed' &&
                                isFuture(parseISO(booking.date)) && (
                                  <>
                                    <Button variant="outline" size="sm">
                                      <Edit className="mr-1 h-4 w-4" />
                                      Modifier
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-red-600"
                                    >
                                      <Trash2 className="mr-1 h-4 w-4" />
                                      Annuler
                                    </Button>
                                  </>
                                )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </ClientCard>

        {/* Action flottante */}
        <div className="text-center">
          <Link href="/reservation">
            <Button
              size="lg"
              style={{
                backgroundColor: 'var(--color-coffee-primary)',
                borderColor: 'var(--color-coffee-primary)',
              }}
            >
              <Calendar className="mr-2 h-5 w-5" />
              Nouvelle réservation
            </Button>
          </Link>
        </div>
      </div>
    </ClientLayout>
  )
}
