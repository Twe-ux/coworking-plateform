'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Coffee, ArrowLeft, Loader2 } from 'lucide-react'
import PaymentHandler from '@/components/payments/payment-handler'

// Composant pour gérer les paramètres de recherche
function PaymentFormContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [bookingData, setBookingData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Récupérer les paramètres de l'URL
  const bookingId = searchParams.get('booking_id')
  const amount = parseFloat(searchParams.get('amount') || '0')
  const spaceName = searchParams.get('space_name') || 'Espace'
  const date = searchParams.get('date') || ''
  const startTime = searchParams.get('start_time') || ''
  const endTime = searchParams.get('end_time') || ''

  useEffect(() => {
    if (!bookingId || !amount) {
      setError('Informations de réservation manquantes')
      setIsLoading(false)
      return
    }

    // Construire les détails de réservation
    const details = {
      spaceName,
      date,
      startTime,
      endTime,
    }

    setBookingData({
      bookingId,
      amount,
      bookingDetails: details,
    })
    setIsLoading(false)
  }, [bookingId, amount, spaceName, date, startTime, endTime])

  const handlePaymentSuccess = (paymentResult: any) => {
    console.log('Paiement réussi:', paymentResult)
    // Rediriger vers la page de succès
    router.push(
      `/payment/success?booking_id=${bookingId}&payment_method=card&payment_intent=${paymentResult.paymentIntent?.id}`
    )
  }

  const handlePaymentError = (error: string) => {
    console.error('Erreur de paiement:', error)
    setError(`Erreur de paiement: ${error}`)
  }

  const goBack = () => {
    router.back()
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-amber-600" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (error || !bookingData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
        <div className="mx-auto max-w-md px-4 text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-100 p-4">
            <Coffee className="mx-auto h-8 w-8 text-red-600" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Erreur</h1>
          <p className="mb-6 text-gray-600">
            {error || 'Informations de paiement invalides'}
          </p>
          <button
            onClick={goBack}
            className="rounded-lg bg-amber-600 px-6 py-2 font-medium text-white transition-colors hover:bg-amber-700"
          >
            Retour
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <button
            onClick={goBack}
            className="mb-6 flex items-center gap-2 text-gray-600 transition-colors hover:text-amber-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </button>

          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-amber-600 p-4">
              <Coffee className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Finaliser votre paiement
          </h1>
          <p className="text-gray-600">
            Sécurisé par Stripe • Cryptage SSL 256-bit
          </p>
        </motion.div>

        {/* Payment Form */}
        <div className="mx-auto max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-white p-8 shadow-xl"
          >
            {error && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <PaymentHandler
              paymentMethod="card"
              amount={bookingData.amount}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              bookingId={bookingData.bookingId}
              bookingDetails={bookingData.bookingDetails}
            />
          </motion.div>
        </div>

        {/* Security indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mx-auto mt-8 max-w-2xl text-center"
        >
          <div className="rounded border-l-4 border-blue-400 bg-blue-50 p-4">
            <h3 className="mb-2 font-semibold text-blue-800">
              Paiement sécurisé
            </h3>
            <p className="text-sm text-blue-700">
              Vos informations de paiement sont protégées par Stripe et ne sont
              jamais stockées sur nos serveurs.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function PaymentFormPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-amber-600" />
            <p className="text-gray-600">Chargement...</p>
          </div>
        </div>
      }
    >
      <PaymentFormContent />
    </Suspense>
  )
}
