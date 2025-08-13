'use client'

import { useEffect, useState } from 'react'
import { clearCompleteAuthCache, fixPortInUrls } from '@/lib/clear-auth-cache'

interface NetworkInfo {
  currentUrl: string
  port: string
  nextAuthUrl: string
  hasCorrectPort: boolean
  cookies: string[]
}

export default function NetworkDebug() {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const info: NetworkInfo = {
      currentUrl: window.location.href,
      port: window.location.port || '80',
      nextAuthUrl: process.env.NEXTAUTH_URL || 'not-set',
      hasCorrectPort: window.location.port === '3000',
      cookies: document.cookie
        .split(';')
        .map((c) => c.trim())
        .filter((c) => c.includes('auth')),
    }

    setNetworkInfo(info)
  }, [])

  if (!networkInfo || process.env.NODE_ENV === 'production') return null

  return (
    <>
      {/* Bouton pour ouvrir/fermer le debug */}
      <div className="fixed right-4 bottom-4 z-50">
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="rounded-full bg-red-500 p-2 text-white shadow-lg hover:bg-red-600"
          title="Debug réseau"
        >
          🔧
        </button>
      </div>

      {/* Panel de debug */}
      {isVisible && (
        <div className="fixed top-4 right-4 z-50 max-h-96 w-96 overflow-y-auto rounded-lg border border-gray-300 bg-white p-4 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold">Debug Réseau</h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <strong>URL actuelle:</strong>
              <div
                className={`font-mono ${networkInfo.hasCorrectPort ? 'text-green-600' : 'text-red-600'}`}
              >
                {networkInfo.currentUrl}
              </div>
            </div>

            <div>
              <strong>Port:</strong>
              <span
                className={`ml-2 font-mono ${networkInfo.hasCorrectPort ? 'text-green-600' : 'text-red-600'}`}
              >
                {networkInfo.port}{' '}
                {networkInfo.hasCorrectPort ? '✓' : '✗ (devrait être 3000)'}
              </span>
            </div>

            <div>
              <strong>NEXTAUTH_URL:</strong>
              <div className="font-mono text-blue-600">
                {networkInfo.nextAuthUrl}
              </div>
            </div>

            <div>
              <strong>Cookies d'authentification:</strong>
              <div className="max-h-20 overflow-y-auto">
                {networkInfo.cookies.length > 0 ? (
                  networkInfo.cookies.map((cookie, index) => (
                    <div
                      key={index}
                      className="font-mono text-xs text-gray-600"
                    >
                      {cookie}
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 italic">
                    Aucun cookie d'auth trouvé
                  </div>
                )}
              </div>
            </div>

            {!networkInfo.hasCorrectPort && (
              <div className="rounded border-l-4 border-red-500 bg-red-50 p-2">
                <p className="font-medium text-red-700">
                  ⚠️ Port incorrect détecté !
                </p>
                <p className="mt-1 text-xs text-red-600">
                  Vous êtes sur le port {networkInfo.port} au lieu de 3000
                </p>
              </div>
            )}

            <div className="mt-4 flex flex-col gap-2">
              <button
                onClick={fixPortInUrls}
                className="rounded bg-blue-500 px-3 py-2 text-sm text-white hover:bg-blue-600"
                disabled={networkInfo.hasCorrectPort}
              >
                Corriger le port
              </button>

              <button
                onClick={clearCompleteAuthCache}
                className="rounded bg-orange-500 px-3 py-2 text-sm text-white hover:bg-orange-600"
              >
                Nettoyer le cache complet
              </button>

              <button
                onClick={() => window.location.reload()}
                className="rounded bg-gray-500 px-3 py-2 text-sm text-white hover:bg-gray-600"
              >
                Recharger la page
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
