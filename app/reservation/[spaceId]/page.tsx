'use client'

import BookingFlow from '@/components/booking/BookingFlow'
import { useParams } from 'next/navigation'
import { useSpaces } from '@/hooks/useSpaces'

export default function SpaceReservationPage() {
  const params = useParams()
  const spaceId = params.spaceId as string
  const { spaces, isLoading, error } = useSpaces()

  // Trouver l'espace par son ID
  const space = spaces.find((s) => s.id === spaceId)

  // États de chargement et d'erreur
  if (isLoading) {
    return (
      <div className="from-coffee-secondary/20 flex min-h-screen items-center justify-center bg-gradient-to-br to-white">
        <div className="text-center">
          <div className="border-coffee-primary mb-4 h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"></div>
          <p className="text-gray-600">Chargement de l'espace...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="from-coffee-secondary/20 flex min-h-screen items-center justify-center bg-gradient-to-br to-white">
        <div className="text-center">
          <h1 className="text-coffee-primary mb-4 text-2xl font-bold">
            Erreur
          </h1>
          <p className="mb-6 text-gray-600">
            Impossible de charger les espaces.
          </p>
          <a
            href="/reservation"
            className="from-coffee-primary to-coffee-accent rounded-xl bg-gradient-to-r px-6 py-3 font-semibold text-white transition-all duration-300 hover:shadow-lg"
          >
            Retour à la sélection
          </a>
        </div>
      </div>
    )
  }

  if (!space) {
    return (
      <div className="from-coffee-secondary/20 flex min-h-screen items-center justify-center bg-gradient-to-br to-white">
        <div className="text-center">
          <h1 className="text-coffee-primary mb-4 text-2xl font-bold">
            Espace non trouvé
          </h1>
          <p className="mb-6 text-gray-600">
            L'espace "{spaceId}" n'existe pas.
          </p>
          <a
            href="/reservation"
            className="from-coffee-primary to-coffee-accent rounded-xl bg-gradient-to-r px-6 py-3 font-semibold text-white transition-all duration-300 hover:shadow-lg"
          >
            Choisir un autre espace
          </a>
        </div>
      </div>
    )
  }

  // Aller directement à BookingFlow avec l'espace présélectionné (étape 2)
  return <BookingFlow preSelectedSpace={space} />
}
