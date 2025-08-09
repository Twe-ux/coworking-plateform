'use client'

import { useState } from 'react'
import { CreditCard, Coffee, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import StripePaymentForm from './stripe-payment-form'

interface PaymentHandlerProps {
  paymentMethod: 'onsite' | 'card' | 'paypal'
  amount: number
  onSuccess: (paymentResult: any) => void
  onError: (error: string) => void
  bookingId?: string
  bookingDetails?: {
    spaceName: string
    date: string
    startTime: string
    endTime: string
  }
}

export default function PaymentHandler({
  paymentMethod,
  amount,
  onSuccess,
  onError,
  bookingId,
  bookingDetails
}: PaymentHandlerProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  const handleOnsitePayment = () => {
    // Pour le paiement sur place, on confirme directement
    onSuccess({
      method: 'onsite',
      status: 'pending',
      message: 'Paiement sur place confirmé'
    })
  }

  const handleStripePayment = async () => {
    setIsProcessing(true)
    
    try {
      if (!bookingId) {
        onError('ID de réservation manquant')
        setIsProcessing(false)
        return
      }

      // Créer une session de paiement Stripe
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookingId,
          paymentMethod,
          amount
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création du paiement')
      }

      // Rediriger vers Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('URL de paiement manquante')
      }
      
    } catch (error) {
      setIsProcessing(false)
      onError(error instanceof Error ? error.message : 'Erreur lors du traitement du paiement')
    }
  }

  const handlePayPalPayment = async () => {
    // PayPal utilise le même flux que Stripe
    await handleStripePayment()
  }

  return (
    <div className="space-y-4">
      {paymentMethod === 'onsite' && (
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-coffee-primary/10 p-4">
              <Coffee className="h-8 w-8 text-coffee-primary" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-coffee-primary">
              Paiement sur place
            </h3>
            <p className="text-coffee-primary/70">
              Vous pourrez régler directement au café lors de votre visite
            </p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <p className="text-amber-800 text-sm">
                Montant à payer sur place : <strong>{amount}€</strong>
              </p>
            </div>
          </div>
          <Button
            onClick={handleOnsitePayment}
            className="w-full bg-coffee-primary hover:bg-coffee-primary/90"
            disabled={isProcessing}
          >
            Confirmer la réservation
          </Button>
        </div>
      )}

      {paymentMethod === 'card' && bookingId && bookingDetails && (
        <StripePaymentForm
          amount={amount}
          bookingId={bookingId}
          bookingDetails={bookingDetails}
          onSuccess={onSuccess}
          onError={onError}
        />
      )}

      {paymentMethod === 'paypal' && (
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-blue-100 p-4">
              <CreditCard className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Paiement PayPal</h3>
            <p className="text-gray-600">
              Paiement via PayPal
            </p>
          </div>
          <Button
            onClick={handlePayPalPayment}
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? 'Traitement...' : 'Payer avec PayPal'}
          </Button>
        </div>
      )}
    </div>
  )
}

// Fonction utilitaire pour initialiser Stripe (à implémenter)
// async function getStripe() {
//   const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
//   return stripe
// }