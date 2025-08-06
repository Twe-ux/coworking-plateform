/**
 * Page d'administration - Exemple d'utilisation du système de sécurité
 * Protection au niveau admin uniquement
 */

'use client'

import { AdminGuard } from '@/components/auth/route-guard'
import { SecurityStatus } from '@/components/auth/security-status'
import React from 'react'

export default function AdminDashboard() {
  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="border-b bg-white shadow-sm">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">
                  Dashboard Administrateur
                </h1>
                <span className="ml-3 inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                  👑 Admin
                </span>
              </div>

              <div className="flex items-center space-x-4">
                <SecurityStatus showDetails={false} />
              </div>
            </div>
          </div>
        </header>

        {/* Contenu principal */}
        <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Statut de sécurité détaillé */}
            <div className="mb-6">
              <SecurityStatus showDetails={true} />
            </div>

            {/* Grille des sections admin */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Gestion des utilisateurs */}
              <div className="overflow-hidden rounded-lg bg-white shadow">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-500">
                        <span className="text-sm font-medium text-white">
                          👥
                        </span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="truncate text-sm font-medium text-gray-500">
                          Gestion des utilisateurs
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          Accès complet
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <button className="font-medium text-blue-600 hover:text-blue-500">
                      Gérer les utilisateurs →
                    </button>
                  </div>
                </div>
              </div>

              {/* Configuration système */}
              <div className="overflow-hidden rounded-lg bg-white shadow">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-purple-500">
                        <span className="text-sm font-medium text-white">
                          ⚙️
                        </span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="truncate text-sm font-medium text-gray-500">
                          Configuration système
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          Admin uniquement
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <button className="font-medium text-purple-600 hover:text-purple-500">
                      Configurer →
                    </button>
                  </div>
                </div>
              </div>

              {/* Logs de sécurité */}
              <div className="overflow-hidden rounded-lg bg-white shadow">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-red-500">
                        <span className="text-sm font-medium text-white">
                          🔒
                        </span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="truncate text-sm font-medium text-gray-500">
                          Logs de sécurité
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          Monitoring complet
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <button className="font-medium text-red-600 hover:text-red-500">
                      Voir les logs →
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Section de test des fonctionnalités de sécurité */}
            <div className="mt-8">
              <div className="rounded-lg bg-white shadow">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Tests de sécurité
                  </h3>
                  <div className="mt-2 max-w-xl text-sm text-gray-500">
                    <p>
                      Cette section démontre les fonctionnalités de sécurité
                      implémentées.
                    </p>
                  </div>
                  <div className="mt-5">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <TestSecureApiButton />
                      <TestCSRFProtectionButton />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </AdminGuard>
  )
}

/**
 * Composant de test pour l'API sécurisée
 */
function TestSecureApiButton() {
  const [status, setStatus] = React.useState<string>('')

  const testSecureApi = async () => {
    setStatus('Test en cours...')

    try {
      const { secureApi } = await import('@/lib/secure-fetch')

      const response = await secureApi.get('/api/csrf')

      if (response.ok) {
        setStatus('✅ API sécurisée fonctionnelle')
      } else {
        setStatus(`❌ Erreur: ${response.error}`)
      }
    } catch (error) {
      setStatus(
        `❌ Erreur: ${error instanceof Error ? error.message : 'Inconnue'}`
      )
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <h4 className="font-medium text-gray-900">Test API sécurisée</h4>
      <p className="mt-1 text-sm text-gray-500">
        Teste les requêtes avec authentification et CSRF
      </p>
      <button
        onClick={testSecureApi}
        className="mt-3 inline-flex items-center rounded-md border border-transparent bg-blue-600 px-3 py-2 text-sm leading-4 font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
      >
        Tester
      </button>
      {status && <div className="mt-2 text-sm">{status}</div>}
    </div>
  )
}

/**
 * Composant de test pour la protection CSRF
 */
function TestCSRFProtectionButton() {
  const [status, setStatus] = React.useState<string>('')

  const testCSRFProtection = async () => {
    setStatus('Test en cours...')

    try {
      // Tenter une requête POST sans token CSRF
      const response = await fetch('/api/test/csrf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: true }),
      })

      if (response.status === 403) {
        setStatus('✅ Protection CSRF active')
      } else {
        setStatus('❌ Protection CSRF défaillante')
      }
    } catch (error) {
      setStatus(
        `❌ Erreur: ${error instanceof Error ? error.message : 'Inconnue'}`
      )
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <h4 className="font-medium text-gray-900">Test protection CSRF</h4>
      <p className="mt-1 text-sm text-gray-500">
        Vérifie que les requêtes sans CSRF sont bloquées
      </p>
      <button
        onClick={testCSRFProtection}
        className="mt-3 inline-flex items-center rounded-md border border-transparent bg-green-600 px-3 py-2 text-sm leading-4 font-medium text-white hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none"
      >
        Tester
      </button>
      {status && <div className="mt-2 text-sm">{status}</div>}
    </div>
  )
}
