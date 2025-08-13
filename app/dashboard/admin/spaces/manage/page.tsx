'use client'

import { SpaceManagement } from '@/components/dashboard/admin/advanced/space-management'

export default function SpaceManagementPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Gestion avancée des espaces
        </h1>
        <p className="mt-2 text-gray-600">
          Interface complète pour créer, modifier et gérer vos espaces de
          coworking
        </p>
      </div>

      <SpaceManagement />
    </div>
  )
}
