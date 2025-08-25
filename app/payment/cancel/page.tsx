'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { XCircle, ArrowLeft, CreditCard, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEffect } from 'react'

export default function PaymentCancelPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Optionnel: Nettoyer la réservation en attente de paiement
    const bookingId = searchParams?.get('booking_id')
    if (bookingId) {
      // On pourrait faire un appel API pour nettoyer la réservation
      // mais généralement on laisse les réservations payment_pending expirer
      console.log('Paiement annulé pour la réservation:', bookingId)
    }
  }, [searchParams])

  return (
    <div className="from-coffee-light via-cream-light min-h-screen bg-gradient-to-br to-white">
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="space-y-6 text-center">
          {/* Icon d'annulation */}
          <div className="flex justify-center">
            <div className="rounded-full bg-red-100 p-4">
              <XCircle className="h-16 w-16 text-red-600" />
            </div>
          </div>

          {/* Titre */}
          <div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900">
              Paiement annulé
            </h1>
            <p className="text-gray-600">
              Votre paiement a été annulé et aucun montant n&apos;a été prélevé
            </p>
          </div>

          {/* Message explicatif */}
          <div className="rounded-xl border border-gray-100 bg-white p-6 text-left shadow-lg">
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
              <CreditCard className="h-5 w-5" />
              Que s&apos;est-il passé ?
            </h2>

            <div className="space-y-3 text-gray-600">
              <p>
                Vous avez choisi d&apos;annuler le processus de paiement avant
                sa finalisation.
              </p>
              <p>
                Aucun montant n&apos;a été débité de votre compte et votre
                réservation n&apos;a pas été confirmée.
              </p>
              <p className="rounded bg-orange-50 p-3 text-sm text-orange-600">
                💡 La réservation en attente sera automatiquement supprimée
                après 24h.
              </p>
            </div>
          </div>

          {/* Suggestions */}
          <div className="rounded-xl bg-blue-50 p-6 text-left">
            <h2 className="mb-3 font-semibold text-blue-900">
              Que souhaitez-vous faire ?
            </h2>
            <ul className="space-y-2 text-blue-800">
              <li className="flex items-start gap-2">
                <span className="mt-1 text-blue-600">•</span>
                Reprendre le processus de réservation
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-blue-600">•</span>
                Choisir une autre méthode de paiement (sur place par exemple)
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-blue-600">•</span>
                Modifier les détails de votre réservation
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-blue-600">•</span>
                Explorer d&apos;autres créneaux horaires
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              onClick={() => router.push('/reservation')}
              className="bg-coffee-primary hover:bg-coffee-primary/90 flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reprendre la réservation
            </Button>
            <Button
              onClick={() => router.push('/dashboard')}
              variant="outline"
              className="border-coffee-primary text-coffee-primary hover:bg-coffee-primary/5 flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour au tableau de bord
            </Button>
          </div>

          {/* Support */}
          <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
            <p>
              Besoin d&apos;aide ? Contactez-nous à{' '}
              <a
                href="mailto:support@coworking-platform.com"
                className="text-coffee-primary hover:underline"
              >
                support@coworking-platform.com
              </a>{' '}
              ou consultez notre FAQ
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
