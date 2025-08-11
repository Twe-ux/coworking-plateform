'use client'

import { BookingCalendar } from '@/components/dashboard/admin/advanced/booking-calendar'

export default function AdminCalendarPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Calendrier des réservations</h1>
        <p className="text-gray-600 mt-2">
          Vue d'ensemble et gestion des réservations par date
        </p>
      </div>
      
      <BookingCalendar />
    </div>
  )
}