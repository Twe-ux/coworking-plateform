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
  const [verification, setVerification] = useState<PaymentVerification | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    const bookingId = searchParams.get('booking_id')
    const paymentMethod = searchParams.get('payment_method')
    
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
            throw new Error(data.error || 'Erreur lors de la récupération de la réservation')
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
            status: data.booking.status
          })
        } else {
          // Paiement Stripe : vérifier auprès de Stripe
          if (!sessionId) {
            setError('Session de paiement manquante')
            setLoading(false)
            return
          }
          
          const response = await fetch(`/api/payments?session_id=${sessionId}&booking_id=${bookingId}`)
          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.error || 'Erreur lors de la vérification')
          }

          setVerification(data)
        }
      } catch (error) {
        console.error('Booking verification error:', error)
        setError(error instanceof Error ? error.message : 'Erreur de vérification')
      } finally {
        setLoading(false)
      }
    }

    verifyBooking()
  }, [searchParams])

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-coffee-light via-cream-light to-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <Clock className="h-12 w-12 text-coffee-primary animate-spin mx-auto" />
          <h2 className="text-xl font-semibold text-coffee-primary">
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
      <div className="min-h-screen bg-gradient-to-br from-coffee-light via-cream-light to-white flex items-center justify-center">
        <div className="max-w-md mx-auto text-center space-y-4">
          <div className="rounded-full bg-red-100 p-4 w-fit mx-auto">
            <CreditCard className="h-12 w-12 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Erreur de vérification</h1>
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
    <div className="min-h-screen bg-gradient-to-br from-coffee-light via-cream-light to-white">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="text-center space-y-6">
          {/* Icon de succès */}
          <div className="flex justify-center">
            <div className={`rounded-full p-4 ${
              isPaymentSuccessful 
                ? 'bg-green-100' 
                : 'bg-yellow-100'
            }`}>
              <CheckCircle className={`h-16 w-16 ${
                isPaymentSuccessful 
                  ? 'text-green-600' 
                  : 'text-yellow-600'
              }`} />
            </div>
          </div>

          {/* Titre */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {verification.sessionId === 'onsite-payment' 
                ? 'Réservation confirmée !'
                : isPaymentSuccessful 
                  ? 'Paiement réussi !' 
                  : 'Paiement en cours'
              }
            </h1>
            <p className="text-gray-600">
              {verification.sessionId === 'onsite-payment'
                ? 'Votre réservation a été enregistrée et sera payée sur place'
                : isPaymentSuccessful
                  ? 'Votre réservation a été confirmée avec succès'
                  : 'Votre paiement est en cours de traitement'
              }
            </p>
          </div>

          {/* Détails de la transaction */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 text-left">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Détails de la transaction
            </h2>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Montant</span>
                <span className="font-semibold">
                  {formatAmount(verification.amountTotal, verification.currency)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Statut</span>
                <span className={`font-semibold ${
                  verification.sessionId === 'onsite-payment' 
                    ? 'text-orange-600' 
                    : isPaymentSuccessful 
                      ? 'text-green-600' 
                      : 'text-yellow-600'
                }`}>
                  {verification.sessionId === 'onsite-payment' 
                    ? 'Paiement sur place' 
                    : isPaymentSuccessful 
                      ? 'Payé' 
                      : 'En attente'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Email</span>
                <span className="font-semibold">{verification.customerEmail}</span>
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
          <div className={`rounded-xl p-6 text-left ${
            verification.sessionId === 'onsite-payment' 
              ? 'bg-orange-50' 
              : 'bg-coffee-light/30'
          }`}>
            <h2 className={`font-semibold mb-3 ${
              verification.sessionId === 'onsite-payment' 
                ? 'text-orange-800' 
                : 'text-coffee-primary'
            }`}>
              Prochaines étapes
            </h2>
            <ul className={`space-y-2 ${
              verification.sessionId === 'onsite-payment' 
                ? 'text-orange-700' 
                : 'text-coffee-primary/80'
            }`}>
              <li className="flex items-start gap-2">
                <span className={verification.sessionId === 'onsite-payment' ? 'text-orange-600 mt-1' : 'text-coffee-primary mt-1'}>•</span>
                Un email de confirmation vous a été envoyé
              </li>
              <li className="flex items-start gap-2">
                <span className={verification.sessionId === 'onsite-payment' ? 'text-orange-600 mt-1' : 'text-coffee-primary mt-1'}>•</span>
                Vous pouvez consulter vos réservations dans votre tableau de bord
              </li>
              <li className="flex items-start gap-2">
                <span className={verification.sessionId === 'onsite-payment' ? 'text-orange-600 mt-1' : 'text-coffee-primary mt-1'}>•</span>
                Présentez-vous à l'heure prévue avec une pièce d'identité
              </li>
              {verification.sessionId === 'onsite-payment' && (
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 mt-1">•</span>
                  <strong>Réglez le montant directement à l'accueil lors de votre arrivée</strong>
                </li>
              )}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
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