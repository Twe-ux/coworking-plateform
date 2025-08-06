/**
 * Page Staff - Accessible aux admin, manager et staff
 */

import { StaffGuard } from '@/components/auth/route-guard'
import { SecurityStatus } from '@/components/auth/security-status'

export default function StaffDashboard() {
  return (
    <StaffGuard>
      <div className="min-h-screen bg-gray-50">
        <header className="border-b bg-white shadow-sm">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">
                  Dashboard Staff
                </h1>
                <span className="ml-3 inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                  👷 Staff
                </span>
              </div>
              <SecurityStatus />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-medium text-gray-900">
                Outils Staff
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="font-medium text-gray-900">Réservations</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Gérer les réservations des espaces
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="font-medium text-gray-900">Support client</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Assistance aux clients
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </StaffGuard>
  )
}
