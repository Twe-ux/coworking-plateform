'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  MapPin,
  Clock,
  Users,
  Euro,
  Search,
  RefreshCw,
} from 'lucide-react'
import {
  format,
  addDays,
  startOfWeek,
  endOfWeek,
  isSameDay,
  parseISO,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  isSameMonth,
} from 'date-fns'
import { fr } from 'date-fns/locale'

interface Booking {
  _id: string
  date: string
  startTime: string
  endTime: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  totalPrice: number
  guests: number
  userId: {
    firstName: string
    lastName: string
    email: string
  }
  spaceId: {
    name: string
    color?: string
  }
}

interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  bookings: Booking[]
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  completed: 'bg-blue-100 text-blue-800 border-blue-200',
}

const statusLabels = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  cancelled: 'Annulée',
  completed: 'Terminée',
}

export function BookingCalendar() {
  const { toast } = useToast()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [spaceFilter, setSpaceFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')
  const isLoadingRef = useRef(false)

  const loadBookings = async () => {
    // Éviter les requêtes multiples
    if (isLoadingRef.current) return

    try {
      isLoadingRef.current = true
      setLoading(true)

      const startDate =
        viewMode === 'month'
          ? startOfMonth(currentDate)
          : startOfWeek(currentDate, { weekStartsOn: 1 })

      const endDate =
        viewMode === 'month'
          ? endOfMonth(currentDate)
          : endOfWeek(currentDate, { weekStartsOn: 1 })

      const response = await fetch(
        `/api/dashboard/admin/calendar?start=${startDate.toISOString()}&end=${endDate.toISOString()}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success) {
        setBookings(data.data.bookings || [])
      } else {
        throw new Error(data.error || 'Erreur lors du chargement')
      }
    } catch (error) {
      console.error('Erreur chargement calendrier:', error)
      setBookings([]) // Reset en cas d'erreur
      toast({
        title: 'Erreur',
        description:
          error instanceof Error
            ? error.message
            : 'Impossible de charger les réservations',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
      isLoadingRef.current = false
    }
  }

  const filterBookings = () => {
    let filtered = [...bookings]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (booking) =>
          booking.userId.firstName.toLowerCase().includes(term) ||
          booking.userId.lastName.toLowerCase().includes(term) ||
          booking.userId.email.toLowerCase().includes(term) ||
          booking.spaceId.name.toLowerCase().includes(term)
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((booking) => booking.status === statusFilter)
    }

    if (spaceFilter !== 'all') {
      filtered = filtered.filter(
        (booking) => booking.spaceId.name === spaceFilter
      )
    }

    setFilteredBookings(filtered)
  }

  useEffect(() => {
    loadBookings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, viewMode])

  useEffect(() => {
    filterBookings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings, searchTerm, statusFilter, spaceFilter])

  const generateCalendarDays = (): CalendarDay[] => {
    const startDate = startOfMonth(currentDate)
    const endDate = endOfMonth(currentDate)
    const firstCalendarDay = startOfWeek(startDate, { weekStartsOn: 1 })
    const lastCalendarDay = endOfWeek(endDate, { weekStartsOn: 1 })

    const days: CalendarDay[] = []
    let currentDay = firstCalendarDay

    while (currentDay <= lastCalendarDay) {
      const dayBookings = filteredBookings.filter((booking) =>
        isSameDay(parseISO(booking.date), currentDay)
      )

      days.push({
        date: new Date(currentDay),
        isCurrentMonth: isSameMonth(currentDay, currentDate),
        bookings: dayBookings,
      })

      currentDay = addDays(currentDay, 1)
    }

    return days
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(
      direction === 'prev'
        ? subMonths(currentDate, 1)
        : addMonths(currentDate, 1)
    )
  }

  const getUniqueSpaces = () => {
    const spaces = [...new Set(bookings.map((b) => b.spaceId.name))]
    return spaces.sort()
  }

  const getTotalRevenue = () => {
    return filteredBookings
      .filter((b) => b.status !== 'cancelled')
      .reduce((sum, b) => sum + b.totalPrice, 0)
  }

  const calendarDays = generateCalendarDays()
  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {filteredBookings.length}
              </div>
              <div className="text-xs text-gray-600">Réservations</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {
                  filteredBookings.filter((b) => b.status === 'confirmed')
                    .length
                }
              </div>
              <div className="text-xs text-gray-600">Confirmées</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {filteredBookings.filter((b) => b.status === 'pending').length}
              </div>
              <div className="text-xs text-gray-600">En attente</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {getTotalRevenue().toFixed(0)}€
              </div>
              <div className="text-xs text-gray-600">Revenus</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et contrôles */}
      <Card>
        <CardHeader>
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <CalendarIcon className="h-5 w-5" />
                <span>Calendrier des réservations</span>
              </CardTitle>
              <CardDescription>
                Vue d&apos;ensemble des réservations par date
              </CardDescription>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={loadBookings}
              disabled={loading}
              className="flex items-center space-x-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
              />
              <span>Actualiser</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <Label htmlFor="search" className="text-xs">
                Recherche
              </Label>
              <div className="relative">
                <Search className="absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nom, email, espace..."
                  className="pl-8 text-sm"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Statut</Label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-md border p-2 text-sm"
              >
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="confirmed">Confirmées</option>
                <option value="cancelled">Annulées</option>
                <option value="completed">Terminées</option>
              </select>
            </div>

            <div>
              <Label className="text-xs">Espace</Label>
              <select
                value={spaceFilter}
                onChange={(e) => setSpaceFilter(e.target.value)}
                className="w-full rounded-md border p-2 text-sm"
              >
                <option value="all">Tous les espaces</option>
                {getUniqueSpaces().map((space) => (
                  <option key={space} value={space}>
                    {space}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs">Vue</Label>
              <div className="flex space-x-1">
                <Button
                  size="sm"
                  variant={viewMode === 'month' ? 'default' : 'outline'}
                  onClick={() => setViewMode('month')}
                  className="flex-1 text-xs"
                >
                  Mois
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'week' ? 'default' : 'outline'}
                  onClick={() => setViewMode('week')}
                  className="flex-1 text-xs"
                  disabled
                >
                  Semaine
                </Button>
              </div>
            </div>
          </div>

          {/* Navigation du calendrier */}
          <div className="mb-4 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
              className="flex items-center space-x-1"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Précédent</span>
            </Button>

            <h2 className="text-lg font-semibold">
              {format(currentDate, 'MMMM yyyy', { locale: fr })}
            </h2>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
              className="flex items-center space-x-1"
            >
              <span>Suivant</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Grille du calendrier */}
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              {/* En-têtes des jours */}
              <div className="grid grid-cols-7 bg-gray-50">
                {weekDays.map((day) => (
                  <div
                    key={day}
                    className="border-r p-2 text-center text-xs font-medium text-gray-600 last:border-r-0"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Jours du calendrier */}
              <div className="grid grid-cols-7">
                {calendarDays.map((day, index) => (
                  <div
                    key={index}
                    className={`last-in-row:border-r-0 min-h-24 border-r border-b p-1 ${
                      day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <div
                      className={`mb-1 text-xs ${
                        day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                      } ${
                        isSameDay(day.date, new Date())
                          ? 'font-bold text-blue-600'
                          : ''
                      }`}
                    >
                      {format(day.date, 'd')}
                    </div>

                    <div className="space-y-1">
                      {day.bookings.slice(0, 3).map((booking) => (
                        <div
                          key={booking._id}
                          onClick={() => setSelectedBooking(booking)}
                          className={`cursor-pointer rounded p-1 text-xs transition-opacity hover:opacity-80 ${
                            statusColors[booking.status]
                          }`}
                        >
                          <div className="truncate font-medium">
                            {booking.startTime} - {booking.spaceId.name}
                          </div>
                          <div className="truncate opacity-75">
                            {booking.userId.firstName} {booking.userId.lastName}
                          </div>
                        </div>
                      ))}

                      {day.bookings.length > 3 && (
                        <div className="text-xs font-medium text-blue-600">
                          +{day.bookings.length - 3} autres
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Détails de la réservation sélectionnée */}
      {selectedBooking && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Détails de la réservation</CardTitle>
                <CardDescription>
                  Informations complètes sur la réservation sélectionnée
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedBooking(null)}
              >
                Fermer
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-600">Client</h4>
                  <div className="mt-1">
                    <div className="font-medium">
                      {selectedBooking.userId.firstName}{' '}
                      {selectedBooking.userId.lastName}
                    </div>
                    <div className="text-sm text-gray-600">
                      {selectedBooking.userId.email}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-600">Espace</h4>
                  <div className="mt-1 flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>{selectedBooking.spaceId.name}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-600">Statut</h4>
                  <div className="mt-1">
                    <Badge className={statusColors[selectedBooking.status]}>
                      {statusLabels[selectedBooking.status]}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-600">
                    Date et horaires
                  </h4>
                  <div className="mt-1 space-y-1">
                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="h-4 w-4 text-gray-400" />
                      <span>
                        {format(
                          parseISO(selectedBooking.date),
                          'dd MMMM yyyy',
                          { locale: fr }
                        )}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>
                        {selectedBooking.startTime} - {selectedBooking.endTime}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-600">Détails</h4>
                  <div className="mt-1 space-y-1">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span>
                        {selectedBooking.guests} personne
                        {selectedBooking.guests > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Euro className="h-4 w-4 text-gray-400" />
                      <span>{selectedBooking.totalPrice.toFixed(2)}€</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
