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
    endTime: '16:00'
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
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-amber-600 rounded-full p-4">
              <Coffee className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Test Interface Paiement Stripe
          </h1>
          <p className="text-gray-600">
            Interface de paiement intégrée avec le thème du site
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          {!paymentResult && !error && (
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <StripePaymentForm
                amount={25.50}
                bookingId="test-booking-id"
                bookingDetails={mockBookingDetails}
                onSuccess={handleSuccess}
                onError={handleError}
              />
            </div>
          )}

          {/* Résultat du paiement */}
          {paymentResult && (
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center">
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Coffee className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-green-600 mb-4">
                  Paiement Réussi !
                </h2>
                <p className="text-gray-600 mb-6">
                  Votre réservation a été confirmée avec succès
                </p>
                <div className="bg-gray-50 rounded-lg p-4 text-left">
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(paymentResult, null, 2)}
                  </pre>
                </div>
                <button
                  onClick={() => {
                    setPaymentResult(null)
                    setError('')
                  }}
                  className="mt-4 bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg"
                >
                  Tester à nouveau
                </button>
              </div>
            </div>
          )}

          {/* Erreur */}
          {error && (
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center">
                <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Coffee className="h-8 w-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-red-600 mb-4">
                  Erreur de Paiement
                </h2>
                <p className="text-gray-600 mb-6">
                  {error}
                </p>
                <button
                  onClick={() => {
                    setPaymentResult(null)
                    setError('')
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg"
                >
                  Réessayer
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notes pour le développement */}
        <div className="max-w-2xl mx-auto mt-8">
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
            <h3 className="font-semibold text-blue-800 mb-2">Notes de développement:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Interface Stripe Elements intégrée avec le design du site</li>
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