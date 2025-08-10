'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, User, MapPin, Euro, Search, Filter, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface Booking {
  _id: string
  user: {
    firstName: string
    lastName: string
    email: string
  }
  spaceName: string
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
    borderColor: 'border-yellow-200'
  },
  confirmed: {
    label: 'Confirmée',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  cancelled: {
    label: 'Annulée',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  }
}

/**
 * Page de gestion des réservations pour l'admin
 */
export default function BookingsManagementPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

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
    try {
      const response = await fetch('/api/dashboard/admin/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, status: newStatus })
      })

      const result = await response.json()
      
      if (result.success) {
        // Mettre à jour la liste des réservations
        setBookings(bookings.map(booking => 
          booking._id === bookingId 
            ? { ...booking, status: newStatus as any }
            : booking
        ))
      } else {
        console.error('Erreur lors de la mise à jour:', result.error)
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error)
    }
  }

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.spaceName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Gestion des réservations</h1>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-6 border border-gray-200 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête et filtres */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des réservations</h1>
          <p className="text-gray-600">
            {filteredBookings.length} réservation{filteredBookings.length > 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Barre de recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coffee-primary focus:border-transparent"
            />
          </div>

          {/* Filtre de statut */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coffee-primary focus:border-transparent appearance-none bg-white"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="confirmed">Confirmées</option>
              <option value="cancelled">Annulées</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des réservations */}
      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-lg p-8 border border-gray-200 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Aucune réservation trouvée</p>
          </div>
        ) : (
          filteredBookings.map((booking) => {
            const statusInfo = statusConfig[booking.status]
            const StatusIcon = statusInfo.icon
            
            return (
              <div key={booking._id} className={`bg-white rounded-lg p-6 border ${statusInfo.borderColor} hover:shadow-lg transition-shadow`}>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Informations principales */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-gray-900">
                          {booking.user.firstName} {booking.user.lastName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">{booking.spaceName}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {booking.date}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {booking.startTime} - {booking.endTime}
                      </div>
                      <div className="flex items-center gap-1">
                        <Euro className="h-4 w-4" />
                        {booking.totalPrice}€
                      </div>
                    </div>

                    <div className="text-xs text-gray-500">
                      {booking.user.email} • {booking.guests} invité{booking.guests > 1 ? 's' : ''} • {booking.paymentMethod}
                    </div>
                  </div>

                  {/* Statut et actions */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${statusInfo.bgColor}`}>
                      <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
                      <span className={`text-sm font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>

                    {/* Actions de changement de statut */}
                    {booking.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateBookingStatus(booking._id, 'confirmed')}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                        >
                          Confirmer
                        </button>
                        <button
                          onClick={() => updateBookingStatus(booking._id, 'cancelled')}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                        >
                          Annuler
                        </button>
                      </div>
                    )}

                    {booking.status === 'confirmed' && (
                      <button
                        onClick={() => updateBookingStatus(booking._id, 'cancelled')}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
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
    </div>
  )
}