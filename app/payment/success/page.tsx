'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, Clock, CreditCard, MapPin, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface PaymentVerification {
  success: boolean
  sessionId: string
  paymentStatus: string
  paymentIntent: string
  customerEmail: string
  amountTotal: number
  currency: string
  bookingId: string
  status: string
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [verification, setVerification] = useState<PaymentVerification | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const sessionId = searchParams.get('session_id') // Stripe Checkout (ancien système)
    const paymentIntent = searchParams.get('payment_intent') // Stripe Elements (nouveau système)
    const bookingId = searchParams.get('booking_id')
    const paymentMethod = searchParams.get('payment_method')

    console.log('🔍 Payment Success - Paramètres URL:', {
      sessionId,
      paymentIntent,
      bookingId,
      paymentMethod,
    })

    if (!bookingId) {
      setError('ID de réservation manquant')
      setLoading(false)
      return
    }

    // Gérer différemment selon la méthode de paiement
    const verifyBooking = async () => {
      try {
        if (paymentMethod === 'onsite') {
          // Paiement sur place : récupérer les détails de la réservation
          const response = await fetch(`/api/bookings/${bookingId}`)
          const data = await response.json()

          if (!response.ok) {
            throw new Error(
              data.error || 'Erreur lors de la récupération de la réservation'
            )
          }

          // Adapter les données pour l'affichage uniforme
          setVerification({
            success: true,
            sessionId: 'onsite-payment',
            paymentStatus: 'paid', // Pour affichage cohérent
            paymentIntent: 'onsite-payment',
            customerEmail: data.user?.email || 'Email non disponible',
            amountTotal: data.booking.totalPrice * 100, // Convertir en centimes pour cohérence
            currency: 'eur',
            bookingId: data.booking.id,
            status: data.booking.status,
          })
        } else if (paymentMethod === 'card' && paymentIntent) {
          // Nouveau système Stripe Elements : vérifier avec payment_intent
          console.log('🎯 Vérification paiement Stripe Elements:', {
            paymentIntent,
            bookingId,
          })

          const response = await fetch(
            `/api/payments?payment_intent=${paymentIntent}&booking_id=${bookingId}`
          )
          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.error || 'Erreur lors de la vérification')
          }

          setVerification(data)
        } else if (sessionId) {
          // Ancien système Stripe Checkout : vérifier avec session_id
          console.log('🔄 Vérification paiement Stripe Checkout:', {
            sessionId,
            bookingId,
          })

          const response = await fetch(
            `/api/payments?session_id=${sessionId}&booking_id=${bookingId}`
          )
          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.error || 'Erreur lors de la vérification')
          }

          setVerification(data)
        } else {
          setError(
            'Informations de paiement manquantes (session_id ou payment_intent requis)'
          )
          setLoading(false)
          return
        }
      } catch (error) {
        console.error('Booking verification error:', error)
        setError(
          error instanceof Error ? error.message : 'Erreur de vérification'
        )
      } finally {
        setLoading(false)
      }
    }

    verifyBooking()
  }, [searchParams])

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100)
  }

  if (loading) {
    return (
      <div className="from-coffee-light via-cream-light flex min-h-screen items-center justify-center bg-gradient-to-br to-white">
        <div className="space-y-4 text-center">
          <Clock className="text-coffee-primary mx-auto h-12 w-12 animate-spin" />
          <h2 className="text-coffee-primary text-xl font-semibold">
            Vérification du paiement...
          </h2>
          <p className="text-coffee-primary/70">
            Veuillez patienter pendant que nous confirmons votre paiement
          </p>
        </div>
      </div>
    )
  }

  if (error || !verification) {
    return (
      <div className="from-coffee-light via-cream-light flex min-h-screen items-center justify-center bg-gradient-to-br to-white">
        <div className="mx-auto max-w-md space-y-4 text-center">
          <div className="mx-auto w-fit rounded-full bg-red-100 p-4">
            <CreditCard className="h-12 w-12 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Erreur de vérification
          </h1>
          <p className="text-gray-600">{error}</p>
          <Button
            onClick={() => router.push('/dashboard')}
            className="bg-coffee-primary hover:bg-coffee-primary/90"
          >
            Retour au tableau de bord
          </Button>
        </div>
      </div>
    )
  }

  const isPaymentSuccessful = verification.paymentStatus === 'paid'

  return (
    <div className="from-coffee-light via-cream-light min-h-screen bg-gradient-to-br to-white">
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="space-y-6 text-center">
          {/* Icon de succès */}
          <div className="flex justify-center">
            <div
              className={`rounded-full p-4 ${
                isPaymentSuccessful ? 'bg-green-100' : 'bg-yellow-100'
              }`}
            >
              <CheckCircle
                className={`h-16 w-16 ${
                  isPaymentSuccessful ? 'text-green-600' : 'text-yellow-600'
                }`}
              />
            </div>
          </div>

          {/* Titre */}
          <div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900">
              {verification.sessionId === 'onsite-payment'
                ? 'Réservation confirmée !'
                : isPaymentSuccessful
                  ? 'Paiement réussi !'
                  : 'Paiement en cours'}
            </h1>
            <p className="text-gray-600">
              {verification.sessionId === 'onsite-payment'
                ? 'Votre réservation a été enregistrée et sera payée sur place'
                : isPaymentSuccessful
                  ? 'Votre réservation a été confirmée avec succès'
                  : 'Votre paiement est en cours de traitement'}
            </p>
          </div>

          {/* Détails de la transaction */}
          <div className="rounded-xl border border-gray-100 bg-white p-6 text-left shadow-lg">
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
              <CreditCard className="h-5 w-5" />
              Détails de la transaction
            </h2>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Montant</span>
                <span className="font-semibold">
                  {formatAmount(
                    verification.amountTotal,
                    verification.currency
                  )}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Statut</span>
                <span
                  className={`font-semibold ${
                    verification.sessionId === 'onsite-payment'
                      ? 'text-orange-600'
                      : isPaymentSuccessful
                        ? 'text-green-600'
                        : 'text-yellow-600'
                  }`}
                >
                  {verification.sessionId === 'onsite-payment'
                    ? 'Paiement sur place'
                    : isPaymentSuccessful
                      ? 'Payé'
                      : 'En attente'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Email</span>
                <span className="font-semibold">
                  {verification.customerEmail}
                </span>
              </div>

              {verification.bookingId && (
                <div className="flex justify-between">
                  <span className="text-gray-600">ID de réservation</span>
                  <span className="font-mono text-sm text-gray-500">
                    {verification.bookingId.slice(-8)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Prochaines étapes */}
          <div
            className={`rounded-xl p-6 text-left ${
              verification.sessionId === 'onsite-payment'
                ? 'bg-orange-50'
                : 'bg-coffee-light/30'
            }`}
          >
            <h2
              className={`mb-3 font-semibold ${
                verification.sessionId === 'onsite-payment'
                  ? 'text-orange-800'
                  : 'text-coffee-primary'
              }`}
            >
              Prochaines étapes
            </h2>
            <ul
              className={`space-y-2 ${
                verification.sessionId === 'onsite-payment'
                  ? 'text-orange-700'
                  : 'text-coffee-primary/80'
              }`}
            >
              <li className="flex items-start gap-2">
                <span
                  className={
                    verification.sessionId === 'onsite-payment'
                      ? 'mt-1 text-orange-600'
                      : 'text-coffee-primary mt-1'
                  }
                >
                  •
                </span>
                Un email de confirmation vous a été envoyé
              </li>
              <li className="flex items-start gap-2">
                <span
                  className={
                    verification.sessionId === 'onsite-payment'
                      ? 'mt-1 text-orange-600'
                      : 'text-coffee-primary mt-1'
                  }
                >
                  •
                </span>
                Vous pouvez consulter vos réservations dans votre tableau de
                bord
              </li>
              <li className="flex items-start gap-2">
                <span
                  className={
                    verification.sessionId === 'onsite-payment'
                      ? 'mt-1 text-orange-600'
                      : 'text-coffee-primary mt-1'
                  }
                >
                  •
                </span>
                Présentez-vous à l'heure prévue avec une pièce d'identité
              </li>
              {verification.sessionId === 'onsite-payment' && (
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-orange-600">•</span>
                  <strong>
                    Réglez le montant directement à l'accueil lors de votre
                    arrivée
                  </strong>
                </li>
              )}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              onClick={() => router.push('/dashboard')}
              className="bg-coffee-primary hover:bg-coffee-primary/90"
            >
              Voir mes réservations
            </Button>
            <Button
              onClick={() => router.push('/reservation')}
              variant="outline"
              className="border-coffee-primary text-coffee-primary hover:bg-coffee-primary/5"
            >
              Nouvelle réservation
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
