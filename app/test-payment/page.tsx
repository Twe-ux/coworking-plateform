'use client'

import { useState } from 'react'
import StripePaymentForm from '@/components/payments/stripe-payment-form'
import { Coffee } from 'lucide-react'

export default function TestPaymentPage() {
  const [paymentResult, setPaymentResult] = useState<any>(null)
  const [error, setError] = useState('')

  const mockBookingDetails = {
    spaceName: 'Salle Verrière',
    date: '15 janvier 2024',
    startTime: '14:00',
    endTime: '16:00',
  }

  const handleSuccess = (result: any) => {
    console.log('Paiement réussi:', result)
    setPaymentResult(result)
    setError('')
  }

  const handleError = (errorMessage: string) => {
    console.error('Erreur de paiement:', errorMessage)
    setError(errorMessage)
    setPaymentResult(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-amber-600 p-4">
              <Coffee className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Test Interface Paiement Stripe
          </h1>
          <p className="text-gray-600">
            Interface de paiement intégrée avec le thème du site
          </p>
        </div>

        <div className="mx-auto max-w-2xl">
          {!paymentResult && !error && (
            <div className="rounded-2xl bg-white p-8 shadow-xl">
              <StripePaymentForm
                amount={25.5}
                bookingId="test-booking-id"
                bookingDetails={mockBookingDetails}
                onSuccess={handleSuccess}
                onError={handleError}
              />
            </div>
          )}

          {/* Résultat du paiement */}
          {paymentResult && (
            <div className="rounded-2xl bg-white p-8 shadow-xl">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <Coffee className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="mb-4 text-2xl font-bold text-green-600">
                  Paiement Réussi !
                </h2>
                <p className="mb-6 text-gray-600">
                  Votre réservation a été confirmée avec succès
                </p>
                <div className="rounded-lg bg-gray-50 p-4 text-left">
                  <pre className="overflow-auto text-sm">
                    {JSON.stringify(paymentResult, null, 2)}
                  </pre>
                </div>
                <button
                  onClick={() => {
                    setPaymentResult(null)
                    setError('')
                  }}
                  className="mt-4 rounded-lg bg-amber-600 px-6 py-2 text-white hover:bg-amber-700"
                >
                  Tester à nouveau
                </button>
              </div>
            </div>
          )}

          {/* Erreur */}
          {error && (
            <div className="rounded-2xl bg-white p-8 shadow-xl">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                  <Coffee className="h-8 w-8 text-red-600" />
                </div>
                <h2 className="mb-4 text-2xl font-bold text-red-600">
                  Erreur de Paiement
                </h2>
                <p className="mb-6 text-gray-600">{error}</p>
                <button
                  onClick={() => {
                    setPaymentResult(null)
                    setError('')
                  }}
                  className="rounded-lg bg-amber-600 px-6 py-2 text-white hover:bg-amber-700"
                >
                  Réessayer
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notes pour le développement */}
        <div className="mx-auto mt-8 max-w-2xl">
          <div className="rounded border-l-4 border-blue-400 bg-blue-50 p-4">
            <h3 className="mb-2 font-semibold text-blue-800">
              Notes de développement:
            </h3>
            <ul className="space-y-1 text-sm text-blue-700">
              <li>
                • Interface Stripe Elements intégrée avec le design du site
              </li>
              <li>• Thème café cohérent (couleurs ambre/orange)</li>
              <li>• Animations Framer Motion</li>
              <li>• Validation temps réel des champs</li>
              <li>• Indicateurs de sécurité visibles</li>
              <li>• Design responsive</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
