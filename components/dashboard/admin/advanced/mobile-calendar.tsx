'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  MapPin,
  Clock,
  Users,
  Euro,
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

interface MobileCalendarProps {
  bookings: Booking[]
  loading: boolean
  onRefresh: () => void
}

export function MobileCalendar({
  bookings,
  loading,
  onRefresh,
}: MobileCalendarProps) {
  const { toast } = useToast()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [viewMode, setViewMode] = useState<'month' | 'list'>('month')

  const generateCalendarDays = useMemo((): CalendarDay[] => {
    const startDate = startOfMonth(currentDate)
    const endDate = endOfMonth(currentDate)
    const firstCalendarDay = startOfWeek(startDate, { weekStartsOn: 1 })
    const lastCalendarDay = endOfWeek(endDate, { weekStartsOn: 1 })

    const days: CalendarDay[] = []
    let currentDay = firstCalendarDay

    while (currentDay <= lastCalendarDay) {
      const dayBookings = bookings.filter((booking) =>
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
  }, [currentDate, bookings])

  const upcomingBookings = useMemo(() => {
    const now = new Date()
    return bookings
      .filter((booking) => parseISO(booking.date) >= now)
      .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())
      .slice(0, 10)
  }, [bookings])

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(
      direction === 'prev'
        ? subMonths(currentDate, 1)
        : addMonths(currentDate, 1)
    )
  }

  const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-coffee-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-20">
      {/* En-tête mobile */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Calendrier</CardTitle>
              <CardDescription className="text-sm">
                {bookings.length} réservations
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
              className="h-9 w-9 p-0"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
              />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Sélecteur de vue */}
      <div className="flex space-x-1 p-1 bg-muted rounded-lg">
        <Button
          variant={viewMode === 'month' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('month')}
          className="flex-1 h-8"
        >
          Calendrier
        </Button>
        <Button
          variant={viewMode === 'list' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('list')}
          className="flex-1 h-8"
        >
          Liste
        </Button>
      </div>

      {viewMode === 'month' ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <h2 className="text-base font-semibold">
                {format(currentDate, 'MMMM yyyy', { locale: fr })}
              </h2>

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* En-têtes des jours */}
            <div className="grid grid-cols-7 border-b">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="p-2 text-center text-xs font-medium text-muted-foreground"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Grille du calendrier mobile */}
            <div className="grid grid-cols-7">
              {generateCalendarDays.map((day, index) => (
                <div
                  key={index}
                  className={`min-h-12 p-1 border-r border-b text-xs ${
                    day.isCurrentMonth ? 'bg-background' : 'bg-muted/30'
                  } ${index % 7 === 6 ? 'border-r-0' : ''}`}
                >
                  <div
                    className={`text-center mb-1 ${
                      day.isCurrentMonth
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    } ${
                      isSameDay(day.date, new Date())
                        ? 'font-bold text-coffee-primary'
                        : ''
                    }`}
                  >
                    {format(day.date, 'd')}
                  </div>

                  {day.bookings.length > 0 && (
                    <Drawer>
                      <DrawerTrigger asChild>
                        <button className="w-full">
                          <div className="flex justify-center">
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${
                                day.bookings.some(
                                  (b) => b.status === 'confirmed'
                                )
                                  ? 'bg-green-500'
                                  : day.bookings.some(
                                      (b) => b.status === 'pending'
                                    )
                                  ? 'bg-yellow-500'
                                  : 'bg-gray-400'
                              }`}
                            />
                          </div>
                          {day.bookings.length > 1 && (
                            <div className="text-xs text-coffee-primary font-medium mt-0.5">
                              +{day.bookings.length - 1}
                            </div>
                          )}
                        </button>
                      </DrawerTrigger>
                      <DrawerContent>
                        <DrawerHeader>
                          <DrawerTitle>
                            {format(day.date, 'dd MMMM yyyy', { locale: fr })}
                          </DrawerTitle>
                        </DrawerHeader>
                        <div className="px-4 pb-4 space-y-2">
                          {day.bookings.map((booking) => (
                            <BookingCard
                              key={booking._id}
                              booking={booking}
                              onClick={() => setSelectedBooking(booking)}
                            />
                          ))}
                        </div>
                      </DrawerContent>
                    </Drawer>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {upcomingBookings.length > 0 ? (
            upcomingBookings.map((booking) => (
              <BookingCard
                key={booking._id}
                booking={booking}
                onClick={() => setSelectedBooking(booking)}
              />
            ))
          ) : (
            <Card>
              <CardContent className="p-4 text-center text-muted-foreground">
                Aucune réservation à venir
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Détails réservation */}
      {selectedBooking && (
        <Sheet open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
          <SheetContent side="bottom" className="h-auto max-h-[80vh]">
            <SheetHeader>
              <SheetTitle>Détails de la réservation</SheetTitle>
            </SheetHeader>
            <BookingDetails booking={selectedBooking} />
          </SheetContent>
        </Sheet>
      )}
    </div>
  )
}

// Composant carte de réservation
function BookingCard({
  booking,
  onClick,
}: {
  booking: Booking
  onClick: () => void
}) {
  return (
    <Card className="p-3 cursor-pointer hover:bg-muted/50" onClick={onClick}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <Badge
              className={`text-xs px-2 py-0.5 ${statusColors[booking.status]}`}
            >
              {statusLabels[booking.status]}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {booking.startTime}
            </span>
          </div>
          <div className="font-medium text-sm">{booking.spaceId.name}</div>
          <div className="text-xs text-muted-foreground">
            {booking.userId.firstName} {booking.userId.lastName}
          </div>
        </div>
        <div className="text-right">
          <div className="font-medium text-sm">{booking.totalPrice}€</div>
          <div className="text-xs text-muted-foreground">
            {booking.guests} pers.
          </div>
        </div>
      </div>
    </Card>
  )
}

// Composant détails réservation
function BookingDetails({ booking }: { booking: Booking }) {
  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-1">
            Client
          </h4>
          <div>
            <div className="font-medium">
              {booking.userId.firstName} {booking.userId.lastName}
            </div>
            <div className="text-sm text-muted-foreground">
              {booking.userId.email}
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-1">
            Espace
          </h4>
          <div className="flex items-center space-x-1">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm">{booking.spaceId.name}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-1">
            Date & Horaires
          </h4>
          <div className="space-y-1">
            <div className="flex items-center space-x-1">
              <CalendarIcon className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm">
                {format(parseISO(booking.date), 'dd MMM yyyy', { locale: fr })}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm">
                {booking.startTime} - {booking.endTime}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-1">
            Détails
          </h4>
          <div className="space-y-1">
            <div className="flex items-center space-x-1">
              <Users className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm">
                {booking.guests} personne{booking.guests > 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <Euro className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm">{booking.totalPrice.toFixed(2)}€</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-1">
          Statut
        </h4>
        <Badge className={statusColors[booking.status]}>
          {statusLabels[booking.status]}
        </Badge>
      </div>
    </div>
  )
}