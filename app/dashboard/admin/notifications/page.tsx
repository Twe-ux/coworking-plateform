'use client'

import { NotificationsManagement } from '@/components/dashboard/admin/advanced/notifications-management'

export default function AdminNotificationsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gestion des notifications</h1>
        <p className="text-gray-600 mt-2">
          Supervisez et contrôlez le système de notifications automatiques
        </p>
      </div>
      
      <NotificationsManagement />
    </div>
  )
}