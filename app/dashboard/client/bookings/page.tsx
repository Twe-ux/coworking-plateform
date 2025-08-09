'use client'

import { ModifyBookingModal } from '@/components/dashboard/client/modify-booking-modal'
import { generateReceiptPDF } from '@/components/dashboard/client/receipt-generator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import {
  format,
  isFuture,
  isPast,
  isToday,
  isTomorrow,
  parseISO,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  Download,
  Edit,
  Eye,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  XCircle,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

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

type FilterStatus = 'all' | 'active' | 'past' | 'cancelled' | 'pending'
type SortBy = 'date' | 'created' | 'price' | 'name'

export default function BookingsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()

  const [bookings, setBookings] = useState<BookingData[]>([])
  const [filteredBookings, setFilteredBookings] = useState<BookingData[]>([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  // Filters and search
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [sortBy, setSortBy] = useState<SortBy>('date')

  // Modals
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null)
  const [modifyBooking, setModifyBooking] = useState<BookingData | null>(null)

  // Fetch bookings
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
      } catch (err) {
        console.error('Erreur récupération réservations:', err)
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les réservations',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [session?.user?.id, toast])

  // Filter and search bookings
  useEffect(() => {
    let filtered = [...bookings]

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((booking) => {
        const bookingDate = parseISO(booking.date)
        switch (statusFilter) {
          case 'active':
            return booking.status === 'confirmed' && isFuture(bookingDate)
          case 'past':
            return (
              booking.status === 'completed' ||
              (booking.status === 'confirmed' && isPast(bookingDate))
            )
          case 'cancelled':
            return booking.status === 'cancelled'
          case 'pending':
            return (
              booking.status === 'pending' ||
              booking.status === 'payment_pending'
            )
          default:
            return true
        }
      })
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (booking) =>
          booking.space.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.space.location
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      )
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.date).getTime() - new Date(a.date).getTime()
        case 'created':
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        case 'price':
          return b.totalPrice - a.totalPrice
        case 'name':
          return a.space.name.localeCompare(b.space.name)
        default:
          return 0
      }
    })

    setFilteredBookings(filtered)
  }, [bookings, searchTerm, statusFilter, sortBy])

  // Cancel booking
  const handleCancelBooking = async (bookingId: string) => {
    setCancellingId(bookingId)
    try {
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error("Erreur lors de l'annulation")
      }

      // Update local state
      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === bookingId
            ? { ...booking, status: 'cancelled' as const }
            : booking
        )
      )

      toast({
        title: 'Réservation annulée',
        description: 'Votre réservation a été annulée avec succès',
      })
    } catch (err) {
      toast({
        title: 'Erreur',
        description: "Impossible d'annuler la réservation",
        variant: 'destructive',
      })
    } finally {
      setCancellingId(null)
      setCancelBookingId(null)
    }
  }

  // Modify booking
  const handleModifyBooking = async (
    bookingId: string,
    newDate: string,
    newStartTime: string,
    newEndTime: string
  ) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}/modify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: newDate,
          startTime: newStartTime,
          endTime: newEndTime,
        }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la modification')
      }

      const result = await response.json()

      // Update local state
      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === bookingId
            ? {
                ...booking,
                date: result.booking.date,
                startTime: result.booking.startTime,
                endTime: result.booking.endTime,
                duration: result.booking.duration,
                totalPrice: result.booking.totalPrice,
              }
            : booking
        )
      )

      toast({
        title: 'Réservation modifiée',
        description: 'Votre réservation a été modifiée avec succès',
      })
    } catch (error) {
      throw error
    }
  }

  // Download receipt
  const handleDownloadReceipt = (booking: BookingData) => {
    const userData = {
      name: session?.user?.name || 'Utilisateur',
      email: session?.user?.email || '',
    }
    generateReceiptPDF(booking, userData)
  }

  // Get status info
  const getStatusInfo = (booking: BookingData) => {
    const bookingDate = parseISO(booking.date)

    if (booking.status === 'cancelled') {
      return {
        label: 'Annulée',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: XCircle,
        canCancel: false,
        canModify: false,
      }
    }

    if (booking.status === 'payment_pending') {
      return {
        label: 'Paiement en attente',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: AlertCircle,
        canCancel: true,
        canModify: false,
      }
    }

    if (isPast(bookingDate) && booking.status === 'confirmed') {
      return {
        label: 'Terminée',
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: CheckCircle,
        canCancel: false,
        canModify: false,
      }
    }

    if (isToday(bookingDate)) {
      return {
        label: "Aujourd'hui",
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle,
        canCancel: false, // Pas d'annulation le jour même
        canModify: false,
      }
    }

    if (isTomorrow(bookingDate)) {
      return {
        label: 'Demain',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: Calendar,
        canCancel: true,
        canModify: false, // Pas de modification 24h avant
      }
    }

    return {
      label: 'Confirmée',
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: CheckCircle,
      canCancel: true,
      canModify: true,
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-orange-200/50 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard/client">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour
                </Button>
              </Link>
              <div>
                <h1 className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-2xl font-bold text-transparent">
                  Mes Réservations
                </h1>
                <p className="text-gray-600">
                  Gérez toutes vos réservations d'espaces
                </p>
              </div>
            </div>
            <Link href="/reservation">
              <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600">
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle réservation
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Filters and Search */}
          <motion.div variants={itemVariants}>
            <Card className="border-orange-200/50 bg-white/70 shadow-lg backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Rechercher un espace..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="border-orange-200/50 pl-9 focus:border-orange-400"
                    />
                  </div>

                  {/* Status Filter */}
                  <Select
                    value={statusFilter}
                    onValueChange={(value: FilterStatus) =>
                      setStatusFilter(value)
                    }
                  >
                    <SelectTrigger className="border-orange-200/50">
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes</SelectItem>
                      <SelectItem value="active">Actives</SelectItem>
                      <SelectItem value="past">Passées</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="cancelled">Annulées</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Sort */}
                  <Select
                    value={sortBy}
                    onValueChange={(value: SortBy) => setSortBy(value)}
                  >
                    <SelectTrigger className="border-orange-200/50">
                      <SelectValue placeholder="Trier par" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="created">Créé le</SelectItem>
                      <SelectItem value="price">Prix</SelectItem>
                      <SelectItem value="name">Nom espace</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Refresh */}
                  <Button
                    variant="outline"
                    onClick={() => window.location.reload()}
                    className="border-orange-200/50"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Actualiser
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-2 gap-4 md:grid-cols-4"
          >
            <Card className="border-blue-200/50 bg-gradient-to-br from-blue-50 to-cyan-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Total</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {bookings.length}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200/50 bg-gradient-to-br from-green-50 to-emerald-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">
                      Actives
                    </p>
                    <p className="text-2xl font-bold text-green-900">
                      {
                        bookings.filter(
                          (b) =>
                            b.status === 'confirmed' &&
                            isFuture(parseISO(b.date))
                        ).length
                      }
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-yellow-200/50 bg-gradient-to-br from-yellow-50 to-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-600">
                      En attente
                    </p>
                    <p className="text-2xl font-bold text-yellow-900">
                      {
                        bookings.filter(
                          (b) =>
                            b.status === 'pending' ||
                            b.status === 'payment_pending'
                        ).length
                      }
                    </p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-200/50 bg-gradient-to-br from-purple-50 to-pink-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">
                      Total dépensé
                    </p>
                    <p className="text-xl font-bold text-purple-900">
                      {new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'EUR',
                      }).format(
                        bookings.reduce((sum, b) => sum + b.totalPrice, 0)
                      )}
                    </p>
                  </div>
                  <CreditCard className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Bookings List */}
          <motion.div variants={itemVariants}>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="bg-white/70 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className="animate-pulse">
                        <div className="flex items-center space-x-4">
                          <div className="h-16 w-16 rounded-lg bg-gray-200" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 w-1/3 rounded bg-gray-200" />
                            <div className="h-3 w-1/2 rounded bg-gray-200" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredBookings.length === 0 ? (
              <Card className="border-orange-200/50 bg-white/70 shadow-lg backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <Calendar className="mx-auto mb-4 h-16 w-16 text-orange-300" />
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">
                    {searchTerm || statusFilter !== 'all'
                      ? 'Aucun résultat'
                      : 'Aucune réservation'}
                  </h3>
                  <p className="mb-6 text-gray-500">
                    {searchTerm || statusFilter !== 'all'
                      ? 'Essayez de modifier vos filtres'
                      : 'Commencez par réserver votre premier espace'}
                  </p>
                  {!searchTerm && statusFilter === 'all' && (
                    <Link href="/reservation">
                      <Button className="bg-gradient-to-r from-orange-500 to-amber-500">
                        Faire une réservation
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {filteredBookings.map((booking, index) => {
                    const statusInfo = getStatusInfo(booking)
                    const StatusIcon = statusInfo.icon

                    return (
                      <motion.div
                        key={booking.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className="border-orange-200/50 bg-white/70 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              {/* Left side - Booking details */}
                              <div className="flex flex-1 items-start space-x-4">
                                {/* Space icon */}
                                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-r from-orange-400 to-amber-400">
                                  <MapPin className="h-8 w-8 text-white" />
                                </div>

                                {/* Details */}
                                <div className="min-w-0 flex-1">
                                  <div className="mb-2 flex items-center space-x-2">
                                    <h3 className="truncate text-lg font-semibold text-gray-900">
                                      {booking.space.name}
                                    </h3>
                                    <Badge
                                      className={`${statusInfo.color} border`}
                                    >
                                      <StatusIcon className="mr-1 h-3 w-3" />
                                      {statusInfo.label}
                                    </Badge>
                                  </div>

                                  <div className="grid grid-cols-1 gap-2 text-sm text-gray-600 md:grid-cols-3">
                                    <div className="flex items-center">
                                      <MapPin className="mr-1 h-4 w-4" />
                                      {booking.space.location}
                                    </div>
                                    <div className="flex items-center">
                                      <Calendar className="mr-1 h-4 w-4" />
                                      {format(
                                        parseISO(booking.date),
                                        'EEEE d MMMM yyyy',
                                        { locale: fr }
                                      )}
                                    </div>
                                    <div className="flex items-center">
                                      <Clock className="mr-1 h-4 w-4" />
                                      {booking.startTime} - {booking.endTime}
                                    </div>
                                  </div>

                                  <div className="mt-2 text-xs text-gray-500">
                                    Réservé le{' '}
                                    {format(
                                      parseISO(booking.createdAt),
                                      'd MMM yyyy',
                                      { locale: fr }
                                    )}{' '}
                                    •
                                    {booking.paymentMethod === 'onsite'
                                      ? ' Paiement sur place'
                                      : booking.paymentMethod === 'stripe_card'
                                        ? ' Carte bancaire'
                                        : ' PayPal'}
                                  </div>
                                </div>
                              </div>

                              {/* Right side - Price and actions */}
                              <div className="ml-4 flex flex-col items-end space-y-3">
                                <div className="text-right">
                                  <div className="text-xl font-bold text-gray-900">
                                    {new Intl.NumberFormat('fr-FR', {
                                      style: 'currency',
                                      currency: 'EUR',
                                    }).format(booking.totalPrice)}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {booking.duration}{' '}
                                    {booking.durationType === 'hour'
                                      ? 'heure(s)'
                                      : 'jour(s)'}
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex space-x-2">
                                  {/* Download receipt */}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleDownloadReceipt(booking)
                                    }
                                    title="Télécharger le reçu"
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>

                                  {/* View details */}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    title="Voir les détails"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>

                                  {/* Modify booking */}
                                  {statusInfo.canModify && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setModifyBooking(booking)}
                                      title="Modifier la réservation"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  )}

                                  {/* Cancel booking */}
                                  {statusInfo.canCancel && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        setCancelBookingId(booking.id)
                                      }
                                      disabled={cancellingId === booking.id}
                                    >
                                      {cancellingId === booking.id ? (
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Trash2 className="h-4 w-4" />
                                      )}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog
        open={cancelBookingId !== null}
        onOpenChange={() => setCancelBookingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler la réservation</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir annuler cette réservation ? Cette action
              ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Garder</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                cancelBookingId && handleCancelBooking(cancelBookingId)
              }
              className="bg-red-600 hover:bg-red-700"
            >
              Annuler la réservation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modify Booking Modal */}
      <ModifyBookingModal
        booking={modifyBooking}
        isOpen={modifyBooking !== null}
        onClose={() => setModifyBooking(null)}
        onModify={handleModifyBooking}
      />
    </div>
  )
}
