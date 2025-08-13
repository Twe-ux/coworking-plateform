'use client'

import { ClientHeader } from '@/components/dashboard/client/client-header'
import { NotificationsPreferences } from '@/components/dashboard/client/notifications-preferences'

export default function ClientNotificationsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      <ClientHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold text-gray-900">
              Préférences de notifications
            </h1>
            <p className="text-gray-600">
              Personnalisez vos notifications pour rester informé selon vos
              préférences.
            </p>
          </div>

          <NotificationsPreferences />
        </div>
      </main>
    </div>
  )
}
