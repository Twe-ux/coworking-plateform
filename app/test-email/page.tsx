'use client'

import { useState } from 'react'

/**
 * Page de test pour vérifier l'envoi d'emails
 * Disponible uniquement en développement
 */
export default function TestEmailPage() {
  const [email, setEmail] = useState('test@example.com')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const sendTestConfirmationEmail = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const mockBookingData = {
        email: email,
        firstName: 'Jean',
        lastName: 'Dupont',
        bookingId: 'test-' + Date.now(),
        spaceName: 'Salle Verrière',
        date: '15 janvier 2025',
        startTime: '10:00',
        endTime: '12:00',
        duration: 2,
        durationType: 'hour',
        guests: 1,
        totalPrice: 24,
        paymentMethod: 'card',
      }

      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'booking_confirmation',
          data: mockBookingData,
        }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ success: false, error: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  const sendTestReminderEmail = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const mockReminderData = {
        email: email,
        firstName: 'Jean',
        lastName: 'Dupont',
        bookingId: 'test-reminder-' + Date.now(),
        spaceName: 'Salle Verrière',
        date: '15 janvier 2025',
        startTime: '14:00',
        endTime: '16:00',
        hoursUntilBooking: 2,
      }

      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'booking_reminder',
          data: mockReminderData,
        }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ success: false, error: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h1 className="mb-2 text-xl font-bold text-red-800">
            Page non disponible en production
          </h1>
          <p className="text-red-600">
            Cette page de test n'est accessible qu'en mode développement.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">
          🧪 Test des emails - Cow or King Café
        </h1>

        <div className="mb-6">
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Email de test
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
            placeholder="votre-email@exemple.com"
          />
          <p className="mt-1 text-xs text-gray-500">
            Utilisez votre vrai email pour tester la réception
          </p>
        </div>

        <div className="mb-6 space-y-4">
          <button
            onClick={sendTestConfirmationEmail}
            disabled={isLoading || !email}
            className="w-full rounded-md bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? '⏳ Envoi...' : '📧 Tester Email de Confirmation'}
          </button>

          <button
            onClick={sendTestReminderEmail}
            disabled={isLoading || !email}
            className="w-full rounded-md bg-green-600 px-4 py-3 font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? '⏳ Envoi...' : '🔔 Tester Email de Rappel'}
          </button>
        </div>

        {result && (
          <div
            className={`rounded-lg p-4 ${
              result.success
                ? 'border border-green-200 bg-green-50'
                : 'border border-red-200 bg-red-50'
            }`}
          >
            <h3
              className={`mb-2 font-semibold ${
                result.success ? 'text-green-800' : 'text-red-800'
              }`}
            >
              {result.success ? '✅ Succès' : '❌ Erreur'}
            </h3>
            <pre
              className={`overflow-x-auto text-sm ${
                result.success ? 'text-green-700' : 'text-red-700'
              }`}
            >
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-8 rounded-lg bg-gray-50 p-4">
          <h3 className="mb-2 font-semibold text-gray-800">
            📋 Configuration actuelle
          </h3>
          <ul className="space-y-1 text-sm text-gray-600">
            <li>
              • <strong>API Resend:</strong>{' '}
              {process.env.NEXT_PUBLIC_RESEND_CONFIGURED
                ? '✅ Configuré'
                : '❌ Non configuré'}
            </li>
            <li>
              • <strong>Email d'expédition:</strong> noreply@coworking-cafe.fr
            </li>
            <li>
              • <strong>Environnement:</strong> {process.env.NODE_ENV}
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
