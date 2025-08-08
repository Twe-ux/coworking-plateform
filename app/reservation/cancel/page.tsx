'use client'

import { useRouter } from 'next/navigation'
import { XCircle, ArrowLeft, CreditCard, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PaymentCancelPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-coffee-light via-cream-light to-white">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="text-center space-y-6">
          {/* Icon d'annulation */}
          <div className="flex justify-center">
            <div className="rounded-full bg-red-100 p-4">
              <XCircle className="h-16 w-16 text-red-600" />
            </div>
          </div>

          {/* Titre */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Paiement annulé
            </h1>
            <p className="text-gray-600">
              Votre paiement a été annulé et aucun montant n'a été prélevé
            </p>
          </div>

          {/* Message explicatif */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 text-left">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Que s'est-il passé ?
            </h2>
            
            <div className="space-y-3 text-gray-600">
              <p>
                Vous avez choisi d'annuler le processus de paiement avant sa finalisation.
              </p>
              <p>
                Aucun montant n'a été débité de votre compte et votre réservation n'a pas été confirmée.
              </p>
            </div>
          </div>

          {/* Suggestions */}
          <div className="bg-blue-50 rounded-xl p-6 text-left">
            <h2 className="font-semibold text-blue-900 mb-3">
              Que souhaitez-vous faire ?
            </h2>
            <ul className="space-y-2 text-blue-800">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                Reprendre le processus de réservation
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                Choisir une autre méthode de paiement
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                Modifier les détails de votre réservation
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                Explorer d'autres créneaux horaires
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
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
          <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
            <p>
              Besoin d'aide ? Contactez-nous à{' '}
              <a 
                href="mailto:support@coworking-platform.com" 
                className="text-coffee-primary hover:underline"
              >
                support@coworking-platform.com
              </a>
              {' '}ou consultez notre{' '}
              <button 
                onClick={() => {/* TODO: Ouvrir FAQ */}}
                className="text-coffee-primary hover:underline"
              >
                FAQ
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}