'use client'

import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Calendar, Clock, MapPin, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'

interface BookingCardProps {
  booking: {
    id: string
    space: {
      name: string
      location: string
    }
    date: string
    startTime: string
    endTime: string
    duration: number
    durationType: 'hour' | 'day'
    guests: number
    totalPrice: number
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'payment_pending'
  }
  onAction?: (bookingId: string, action: 'cancel' | 'modify') => void
}

export function BookingCard({ booking, onAction }: BookingCardProps) {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    completed: 'bg-gray-100 text-gray-800',
    payment_pending: 'bg-orange-100 text-orange-800'
  }

  const statusLabels = {
    pending: 'En attente',
    confirmed: 'Confirmée',
    cancelled: 'Annulée',
    completed: 'Terminée',
    payment_pending: 'Paiement en attente'
  }

  return (
    <motion.div
      className="bg-white border border-gray-200 rounded-lg p-6"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg text-gray-900">{booking.space.name}</h3>
          <div className="flex items-center text-sm text-gray-500 mt-1">
            <MapPin className="h-4 w-4 mr-1" />
            {booking.space.location}
          </div>
        </div>
        <Badge className={`${statusColors[booking.status]}`}>
          {statusLabels[booking.status]}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="h-4 w-4 mr-2" />
          {format(parseISO(booking.date), 'EEEE d MMMM', { locale: fr })}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Clock className="h-4 w-4 mr-2" />
          {booking.startTime} - {booking.endTime}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Users className="h-4 w-4 mr-2" />
          {booking.guests} {booking.guests > 1 ? 'personnes' : 'personne'}
        </div>
        <div className="text-sm font-semibold text-orange-600">
          {new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
          }).format(booking.totalPrice)}
        </div>
      </div>

      {booking.status === 'confirmed' && onAction && (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAction(booking.id, 'modify')}
            className="flex-1"
          >
            Modifier
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onAction(booking.id, 'cancel')}
            className="flex-1"
          >
            Annuler
          </Button>
        </div>
      )}
    </motion.div>
  )
}