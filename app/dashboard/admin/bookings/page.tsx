'use client'

import { useState, useEffect } from 'react'
import {
  Calendar,
  Clock,
  User,
  MapPin,
  Euro,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  Grid,
  List,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Eye,
  Edit,
  Phone,
  CreditCard,
} from 'lucide-react'

interface Booking {
  id: string
  user: {
    firstName: string
    lastName: string
    email: string
  }
  spaceName: string
  spaceLocation: string
  date: string
  startTime: string
  endTime: string
  duration: number
  durationType: string
  guests: number
  totalPrice: number
  paymentMethod: string
  status: 'pending' | 'confirmed' | 'cancelled'
  createdAt: string
}

const statusConfig = {
  pending: {
    label: 'En attente',
    icon: AlertCircle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
  },
  confirmed: {
    label: 'Confirmée',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  cancelled: {
    label: 'Annulée',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
}

/**
 * Page de gestion des réservations pour l'admin
 */
export default function BookingsManagementPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('list')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/dashboard/admin/bookings')
      const result = await response.json()

      if (result.success) {
        setBookings(result.data)
      } else {
        console.error('Erreur API:', result.error)
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des réservations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    // Demander confirmation pour les annulations
    if (newStatus === 'cancelled') {
      const booking = bookings.find((b) => b.id === bookingId)
      const confirmMessage =
        `Êtes-vous sûr de vouloir annuler cette réservation ?\n\n` +
        `Client: ${booking?.user.firstName} ${booking?.user.lastName}\n` +
        `Espace: ${booking?.spaceName}\n` +
        `Prix: €${booking?.totalPrice}\n\n` +
        `⚠️ Le montant de €${booking?.totalPrice} sera déduit des revenus totaux.`

      if (!confirm(confirmMessage)) return
    }

    try {
      const response = await fetch('/api/dashboard/admin/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, status: newStatus }),
      })

      const result = await response.json()

      if (result.success) {
        // Mettre à jour la liste des réservations
        setBookings(
          bookings.map((booking) =>
            booking.id === bookingId
              ? { ...booking, status: newStatus as any }
              : booking
          )
        )

        // Message de succès
        if (newStatus === 'cancelled') {
          const booking = bookings.find((b) => b.id === bookingId)
          alert(
            `✅ Réservation annulée avec succès.\n💰 €${booking?.totalPrice} déduit des revenus totaux.`
          )
        } else if (newStatus === 'confirmed') {
          alert('✅ Réservation confirmée avec succès.')
        }
      } else {
        console.error('Erreur lors de la mise à jour:', result.error)
        alert('❌ Erreur lors de la mise à jour: ' + result.error)
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error)
      alert('❌ Erreur lors de la mise à jour du statut')
    }
  }

  const filteredBookings = bookings.filter((booking) => {
    const firstName = booking.user.firstName || ''
    const lastName = booking.user.lastName || ''
    const email = booking.user.email || ''
    const spaceName = booking.spaceName || ''
    const spaceLocation = booking.spaceLocation || ''

    const matchesSearch =
      firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      spaceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      spaceLocation.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      statusFilter === 'all' || booking.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Calculs pour la pagination
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedBookings = filteredBookings.slice(startIndex, endIndex)

  // Réinitialiser la page quand les filtres changent
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, itemsPerPage])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            Gestion des réservations
          </h1>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-lg border border-gray-200 bg-white p-6"
            >
              <div className="mb-2 h-4 w-1/3 rounded bg-gray-200"></div>
              <div className="h-4 w-1/2 rounded bg-gray-200"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête et filtres */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestion des réservations
          </h1>
          <p className="text-gray-600">
            {filteredBookings.length} réservation
            {filteredBookings.length > 1 ? 's' : ''}
            {filteredBookings.length > itemsPerPage && (
              <span className="text-gray-500">
                {' '}
                (page {currentPage}/{totalPages})
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          {/* Sélecteur d'items par page */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Afficher:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="focus:ring-coffee-primary rounded-md border border-gray-300 px-2 py-1 text-sm focus:ring-2 focus:outline-none"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-gray-600">par page</span>
          </div>

          {/* Toggle Vue */}
          <div className="flex items-center rounded-lg border border-gray-300">
            <button
              onClick={() => setViewMode('cards')}
              className={`rounded-l-lg p-2 transition-colors ${
                viewMode === 'cards'
                  ? 'bg-coffee-primary text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
              title="Vue cartes"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`rounded-r-lg p-2 transition-colors ${
                viewMode === 'list'
                  ? 'bg-coffee-primary text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
              title="Vue liste"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          {/* Barre de recherche */}
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="focus:ring-coffee-primary rounded-lg border border-gray-300 py-2 pr-4 pl-10 focus:border-transparent focus:ring-2 focus:outline-none"
            />
          </div>

          {/* Filtre de statut */}
          <div className="relative">
            <Filter className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="focus:ring-coffee-primary appearance-none rounded-lg border border-gray-300 bg-white py-2 pr-4 pl-10 focus:border-transparent focus:ring-2 focus:outline-none"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="confirmed">Confirmées</option>
              <option value="cancelled">Annulées</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cartes ou Liste des réservations */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {paginatedBookings.length === 0 ? (
            <div className="col-span-full rounded-lg border border-gray-200 bg-white p-8 text-center">
              <Calendar className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <p className="text-gray-500">Aucune réservation trouvée</p>
            </div>
          ) : (
            paginatedBookings.map((booking) => {
              const statusInfo = statusConfig[booking.status]
              const StatusIcon = statusInfo.icon

              return (
                <div
                  key={booking.id}
                  className={`rounded-lg border bg-white ${statusInfo.borderColor} overflow-hidden transition-shadow hover:shadow-lg`}
                >
                  {/* En-tête de la carte */}
                  <div
                    className={`p-4 ${statusInfo.bgColor} border-b ${statusInfo.borderColor}`}
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className={`flex items-center gap-2 rounded-full bg-white/80 px-2 py-1`}
                      >
                        <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
                        <span
                          className={`text-sm font-medium ${statusInfo.color}`}
                        >
                          {statusInfo.label}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {booking.date}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    {/* Informations utilisateur et espace */}
                    <div className="mb-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-gray-900">
                          {booking.user.firstName} {booking.user.lastName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {booking.spaceName}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {booking.spaceLocation}
                      </div>
                    </div>

                    {/* Détails réservation */}
                    <div className="mb-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-gray-500" />
                          <span className="text-gray-600">Horaires</span>
                        </div>
                        <span className="font-medium">
                          {booking.startTime} - {booking.endTime}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-gray-500" />
                          <span className="text-gray-600">Invités</span>
                        </div>
                        <span className="font-medium">
                          {booking.guests} personne
                          {booking.guests > 1 ? 's' : ''}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1">
                          <Euro className="h-3 w-3 text-gray-500" />
                          <span className="text-gray-600">Prix total</span>
                        </div>
                        <span className="font-medium text-green-600">
                          €{booking.totalPrice}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1">
                          <CreditCard className="h-3 w-3 text-gray-500" />
                          <span className="text-gray-600">Paiement</span>
                        </div>
                        <span className="font-medium">
                          {booking.paymentMethod}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                      <div className="flex items-center gap-2">
                        <button
                          title="Voir les détails"
                          className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Actions de changement de statut */}
                      {booking.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              updateBookingStatus(booking.id, 'confirmed')
                            }
                            className="rounded-md bg-green-600 px-3 py-1 text-xs text-white transition-colors hover:bg-green-700"
                          >
                            Confirmer
                          </button>
                          <button
                            onClick={() =>
                              updateBookingStatus(booking.id, 'cancelled')
                            }
                            className="rounded-md bg-red-600 px-3 py-1 text-xs text-white transition-colors hover:bg-red-700"
                          >
                            Annuler
                          </button>
                        </div>
                      )}

                      {booking.status === 'confirmed' && (
                        <button
                          onClick={() =>
                            updateBookingStatus(booking.id, 'cancelled')
                          }
                          className="rounded-md bg-red-600 px-3 py-1 text-xs text-white transition-colors hover:bg-red-700"
                        >
                          Annuler
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          {paginatedBookings.length === 0 ? (
            <div className="p-8 text-center">
              <Calendar className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <p className="text-gray-500">Aucune réservation trouvée</p>
            </div>
          ) : (
            <>
              {/* En-tête du tableau */}
              <div className="grid grid-cols-12 gap-4 border-b border-gray-200 bg-gray-50 p-4 text-sm font-medium text-gray-700">
                <div className="col-span-3">Client & Espace</div>
                <div className="col-span-2">Date & Heure</div>
                <div className="col-span-2">Détails</div>
                <div className="col-span-2">Prix & Paiement</div>
                <div className="col-span-2">Statut</div>
                <div className="col-span-1">Actions</div>
              </div>

              {/* Corps du tableau */}
              <div className="divide-y divide-gray-200">
                {paginatedBookings.map((booking) => {
                  const statusInfo = statusConfig[booking.status]
                  const StatusIcon = statusInfo.icon

                  return (
                    <div
                      key={booking.id}
                      className="grid grid-cols-12 gap-4 p-4 transition-colors hover:bg-gray-50"
                    >
                      {/* Client & Espace */}
                      <div className="col-span-3 flex items-center gap-3">
                        <div className="from-coffee-primary/20 to-coffee-primary/10 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br">
                          <User className="text-coffee-primary h-6 w-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-gray-900">
                            {booking.user.firstName} {booking.user.lastName}
                          </p>
                          <p className="truncate text-sm text-gray-600">
                            {booking.spaceName}
                          </p>
                          <p className="truncate text-xs text-gray-500">
                            {booking.spaceLocation}
                          </p>
                        </div>
                      </div>

                      {/* Date & Heure */}
                      <div className="col-span-2 flex items-center">
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-gray-500" />
                            <span className="font-medium">{booking.date}</span>
                          </div>
                          <div className="mt-1 flex items-center gap-1">
                            <Clock className="h-3 w-3 text-gray-500" />
                            <span className="text-gray-600">
                              {booking.startTime} - {booking.endTime}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Détails */}
                      <div className="col-span-2 flex items-center">
                        <div className="text-sm">
                          <div className="font-medium">
                            {booking.guests} invité
                            {booking.guests > 1 ? 's' : ''}
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            {booking.user.email}
                          </div>
                        </div>
                      </div>

                      {/* Prix & Paiement */}
                      <div className="col-span-2 flex items-center">
                        <div className="text-sm">
                          <div className="font-medium text-green-600">
                            €{booking.totalPrice}
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            {booking.paymentMethod}
                          </div>
                        </div>
                      </div>

                      {/* Statut */}
                      <div className="col-span-2 flex items-center gap-2">
                        <div
                          className={`flex items-center gap-2 rounded-full px-2 py-1 ${statusInfo.bgColor}`}
                        >
                          <StatusIcon
                            className={`h-3 w-3 ${statusInfo.color}`}
                          />
                          <span
                            className={`text-xs font-medium ${statusInfo.color}`}
                          >
                            {statusInfo.label}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="col-span-1 flex items-center gap-1">
                        <button
                          title="Voir détails"
                          className="rounded p-1 text-gray-600 transition-colors hover:bg-gray-100"
                        >
                          <Eye className="h-3 w-3" />
                        </button>

                        {booking.status === 'pending' && (
                          <>
                            <button
                              title="Confirmer"
                              onClick={() =>
                                updateBookingStatus(booking.id, 'confirmed')
                              }
                              className="rounded p-1 text-green-600 transition-colors hover:bg-green-100"
                            >
                              ✓
                            </button>
                            <button
                              title="Annuler"
                              onClick={() =>
                                updateBookingStatus(booking.id, 'cancelled')
                              }
                              className="rounded p-1 text-red-600 transition-colors hover:bg-red-100"
                            >
                              ✗
                            </button>
                          </>
                        )}

                        {booking.status === 'confirmed' && (
                          <button
                            title="Annuler"
                            onClick={() =>
                              updateBookingStatus(booking.id, 'cancelled')
                            }
                            className="rounded p-1 text-red-600 transition-colors hover:bg-red-100"
                          >
                            ✗
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Pagination */}
      {filteredBookings.length > itemsPerPage && (
        <div className="mt-6 flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3">
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-700">
              Affichage de <span className="font-medium">{startIndex + 1}</span>{' '}
              à{' '}
              <span className="font-medium">
                {Math.min(endIndex, filteredBookings.length)}
              </span>{' '}
              sur <span className="font-medium">{filteredBookings.length}</span>{' '}
              résultats
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Bouton précédent */}
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`rounded-md border p-2 ${
                currentPage === 1
                  ? 'cursor-not-allowed border-gray-200 text-gray-400'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Numéros de page */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNumber
                if (totalPages <= 5) {
                  pageNumber = i + 1
                } else if (currentPage <= 3) {
                  pageNumber = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i
                } else {
                  pageNumber = currentPage - 2 + i
                }

                return (
                  <button
                    key={pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`rounded-md px-3 py-1 text-sm ${
                      currentPage === pageNumber
                        ? 'bg-coffee-primary text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {pageNumber}
                  </button>
                )
              })}
            </div>

            {/* Bouton suivant */}
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className={`rounded-md border p-2 ${
                currentPage === totalPages
                  ? 'cursor-not-allowed border-gray-200 text-gray-400'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Impact financier des annulations */}
      {filteredBookings.filter((b) => b.status === 'cancelled').length > 0 && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500"></div>
            <h3 className="font-semibold text-red-800">
              Impact des Annulations
            </h3>
          </div>
          <p className="text-sm text-red-700">
            <strong>
              {filteredBookings.filter((b) => b.status === 'cancelled').length}{' '}
              réservations annulées
            </strong>{' '}
            représentent une perte de{' '}
            <strong>
              €
              {filteredBookings
                .filter((b) => b.status === 'cancelled')
                .reduce((sum, booking) => sum + booking.totalPrice, 0)}
            </strong>{' '}
            en chiffre d&apos;affaires potentiel.
          </p>
        </div>
      )}

      {/* Statistiques résumées */}
      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-5">
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center transition-shadow hover:shadow-lg">
          <div className="text-2xl font-bold text-gray-900">
            {filteredBookings.length}
          </div>
          <div className="text-sm text-gray-600">
            {filteredBookings.length === bookings.length
              ? 'Total réservations'
              : `Réservations filtrées (${bookings.length} au total)`}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center transition-shadow hover:shadow-lg">
          <div className="text-2xl font-bold text-green-600">
            {filteredBookings.filter((b) => b.status === 'confirmed').length}
          </div>
          <div className="text-sm text-gray-600">Confirmées</div>
          <div className="mt-1 text-xs text-gray-500">
            {filteredBookings.length > 0
              ? (
                  (filteredBookings.filter((b) => b.status === 'confirmed')
                    .length /
                    filteredBookings.length) *
                  100
                ).toFixed(0)
              : 0}
            % du total affiché
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center transition-shadow hover:shadow-lg">
          <div className="text-2xl font-bold text-yellow-600">
            {filteredBookings.filter((b) => b.status === 'pending').length}
          </div>
          <div className="text-sm text-gray-600">En attente</div>
          <div className="mt-1 text-xs text-gray-500">
            {filteredBookings.length > 0
              ? (
                  (filteredBookings.filter((b) => b.status === 'pending')
                    .length /
                    filteredBookings.length) *
                  100
                ).toFixed(0)
              : 0}
            % du total affiché
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center transition-shadow hover:shadow-lg">
          <div className="text-2xl font-bold text-purple-600">
            €
            {filteredBookings
              .filter((b) => b.status === 'confirmed')
              .reduce((sum, booking) => sum + booking.totalPrice, 0)}
          </div>
          <div className="text-sm text-gray-600">Revenus générés</div>
          <div className="mt-1 text-xs text-gray-500">
            Seules les réservations confirmées
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center transition-shadow hover:shadow-lg">
          <div className="text-2xl font-bold text-red-600">
            €
            {filteredBookings
              .filter((b) => b.status === 'cancelled')
              .reduce((sum, booking) => sum + booking.totalPrice, 0)}
          </div>
          <div className="text-sm text-gray-600">Pertes annulations</div>
          <div className="mt-1 text-xs text-gray-500">
            {filteredBookings.filter((b) => b.status === 'cancelled').length}{' '}
            annulées
          </div>
        </div>
      </div>
    </div>
  )
}
