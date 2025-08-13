'use client'

import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Coffee,
  CreditCard,
  Lock,
  AlertCircle,
  CheckCircle,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// Configuration Stripe
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
)

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#8B4513',
      fontFamily: '"Inter", system-ui, sans-serif',
      fontSmoothing: 'antialiased',
      '::placeholder': {
        color: '#A0A0A0',
      },
    },
    invalid: {
      color: '#EF4444',
      iconColor: '#EF4444',
    },
  },
  hidePostalCode: true,
}

interface PaymentFormProps {
  amount: number
  bookingId: string
  bookingDetails: {
    spaceName: string
    date: string
    startTime: string
    endTime: string
  }
  onSuccess: (result: any) => void
  onError: (error: string) => void
}

function PaymentForm({
  amount,
  bookingId,
  bookingDetails,
  onSuccess,
  onError,
}: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [cardError, setCardError] = useState<string>('')
  const [cardComplete, setCardComplete] = useState(false)
  const [clientSecret, setClientSecret] = useState('')

  // Créer un PaymentIntent côté serveur
  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/payments/create-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: amount * 100, // en centimes
            bookingId,
            currency: 'eur',
          }),
        })

        const data = await response.json()

        if (data.clientSecret) {
          setClientSecret(data.clientSecret)
        } else {
          onError('Erreur lors de la création du paiement')
        }
      } catch (error) {
        onError("Erreur lors de l'initialisation du paiement")
      }
    }

    createPaymentIntent()
  }, [amount, bookingId, onError])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements || !clientSecret) {
      onError("Stripe n'est pas encore chargé")
      return
    }

    setIsProcessing(true)
    setCardError('')

    const cardElement = elements.getElement(CardElement)

    if (!cardElement) {
      onError('Élément de carte non trouvé')
      setIsProcessing(false)
      return
    }

    // Confirmer le paiement
    const { error, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: 'Client', // Vous pouvez récupérer le nom depuis la session
          },
        },
      }
    )

    if (error) {
      setCardError(error.message || 'Une erreur est survenue')
      setIsProcessing(false)
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      onSuccess({
        paymentIntent,
        status: 'succeeded',
      })
    }
  }

  const handleCardChange = (event: any) => {
    setCardError(event.error ? event.error.message : '')
    setCardComplete(event.complete)
  }

  return (
    <div className="mx-auto max-w-md">
      {/* Header avec thème café */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 text-center"
      >
        <div className="mb-4 flex justify-center">
          <div className="relative">
            <div className="rounded-full bg-gradient-to-r from-amber-100 to-orange-100 p-4">
              <Coffee className="h-8 w-8 text-amber-700" />
            </div>
            <div className="absolute -top-1 -right-1 rounded-full bg-green-500 p-1">
              <Lock className="h-3 w-3 text-white" />
            </div>
          </div>
        </div>
        <h3 className="mb-2 text-xl font-semibold text-gray-900">
          Paiement sécurisé
        </h3>
        <p className="text-sm text-gray-600">
          Propulsé par <strong>Stripe</strong> • Cryptage SSL 256-bit
        </p>
      </motion.div>

      {/* Détails de la commande */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-amber-200 p-2">
            <CreditCard className="h-5 w-5 text-amber-700" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">
              {bookingDetails.spaceName}
            </h4>
            <p className="text-sm text-gray-600">
              {bookingDetails.date} • {bookingDetails.startTime} -{' '}
              {bookingDetails.endTime}
            </p>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-gray-900">{amount}€</div>
          </div>
        </div>
      </motion.div>

      {/* Formulaire de paiement */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* Champ de carte */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Informations de carte
          </label>
          <div
            className={cn(
              'rounded-lg border-2 p-4 transition-colors',
              cardError
                ? 'border-red-300 bg-red-50'
                : cardComplete
                  ? 'border-green-300 bg-green-50'
                  : 'border-gray-200 bg-white hover:border-amber-300'
            )}
          >
            <CardElement
              options={CARD_ELEMENT_OPTIONS}
              onChange={handleCardChange}
            />
          </div>

          <AnimatePresence>
            {cardError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 text-sm text-red-600"
              >
                <AlertCircle className="h-4 w-4" />
                {cardError}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {cardComplete && !cardError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 text-sm text-green-600"
              >
                <CheckCircle className="h-4 w-4" />
                Carte valide
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sécurité */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Lock className="h-3 w-3" />
          <span>Vos informations de paiement sont sécurisées et cryptées</span>
        </div>

        {/* Bouton de paiement */}
        <Button
          type="submit"
          disabled={!stripe || !clientSecret || !cardComplete || isProcessing}
          className="w-full rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:from-amber-700 hover:to-orange-700 hover:shadow-xl"
        >
          {isProcessing ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Traitement...
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Lock className="h-4 w-4" />
              Payer {amount}€
            </div>
          )}
        </Button>

        {/* Trust indicators */}
        <div className="flex items-center justify-center gap-4 border-t pt-4">
          <Badge variant="outline" className="text-xs">
            SSL Sécurisé
          </Badge>
          <Badge variant="outline" className="text-xs">
            Stripe
          </Badge>
          <Badge variant="outline" className="text-xs">
            RGPD
          </Badge>
        </div>
      </motion.form>
    </div>
  )
}

interface StripePaymentFormProps extends PaymentFormProps {}

export default function StripePaymentForm(props: StripePaymentFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  )
}
