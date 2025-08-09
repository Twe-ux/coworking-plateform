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
      endTime
    }

    setBookingData({
      bookingId,
      amount,
      bookingDetails: details
    })
    setIsLoading(false)
  }, [bookingId, amount, spaceName, date, startTime, endTime])

  const handlePaymentSuccess = (paymentResult: any) => {
    console.log('Paiement réussi:', paymentResult)
    // Rediriger vers la page de succès
    router.push(`/payment/success?booking_id=${bookingId}&payment_method=card&payment_intent=${paymentResult.paymentIntent?.id}`)
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
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (error || !bookingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-red-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
            <Coffee className="h-8 w-8 text-red-600 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Erreur</h1>
          <p className="text-gray-600 mb-6">{error || 'Informations de paiement invalides'}</p>
          <button
            onClick={goBack}
            className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
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
          className="text-center mb-8"
        >
          <button
            onClick={goBack}
            className="mb-6 flex items-center gap-2 text-gray-600 hover:text-amber-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </button>
          
          <div className="flex justify-center mb-4">
            <div className="bg-amber-600 rounded-full p-4">
              <Coffee className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Finaliser votre paiement
          </h1>
          <p className="text-gray-600">
            Sécurisé par Stripe • Cryptage SSL 256-bit
          </p>
        </motion.div>

        {/* Payment Form */}
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{error}</p>
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
          className="max-w-2xl mx-auto mt-8 text-center"
        >
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
            <h3 className="font-semibold text-blue-800 mb-2">Paiement sécurisé</h3>
            <p className="text-sm text-blue-700">
              Vos informations de paiement sont protégées par Stripe et ne sont jamais stockées sur nos serveurs.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function PaymentFormPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <PaymentFormContent />
    </Suspense>
  )
}