/**
 * Page Client - Accessible à tous les utilisateurs connectés
 */

import React from 'react'
import { AuthGuard } from '@/components/auth/route-guard'
import { SecurityStatus } from '@/components/auth/security-status'

export default function ClientDashboard() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">
                  Dashboard Client
                </h1>
                <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  👋 Client
                </span>
              </div>
              <SecurityStatus />
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Espace Client
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900">Mes réservations</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Consulter et gérer vos réservations
                  </p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900">Mon profil</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Modifier vos informations personnelles
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}