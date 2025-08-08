'use client'

import BookingFlow from '@/components/booking/BookingFlow'
import SpaceDetails from '@/components/booking/SpaceDetails'
import { useParams } from 'next/navigation'
import { useState } from 'react'

const SPACE_MAP = {
  places: {
    id: 'places',
    name: 'Places',
    location: 'Rez-de-chaussée',
    capacity: 12,
    pricePerHour: 8,
    pricePerDay: 35,
    pricePerWeek: 149,
    pricePerMonth: 399,
    features: [
      'WiFi Fibre',
      'Prises électriques',
      'Vue sur rue',
      'Accès boissons',
      'Ambiance café',
    ],
    image: 'bg-gradient-to-br from-coffee-primary to-coffee-accent',
    available: true,
    rating: 4.8,
    specialty: 'Ambiance café conviviale',
  },
  verriere: {
    id: 'verriere',
    name: 'Salle Verrière',
    location: 'Niveau intermédiaire',
    capacity: 8,
    pricePerHour: 12,
    pricePerDay: 45,
    pricePerWeek: 189,
    pricePerMonth: 499,
    features: [
      'Lumière naturelle',
      'Espace privé',
      'Tableau blanc',
      'Climatisation',
      'Calme',
    ],
    image: 'bg-gradient-to-br from-blue-400 to-indigo-600',
    available: true,
    rating: 4.9,
    specialty: 'Luminosité naturelle',
  },
  etage: {
    id: 'etage',
    name: 'Étage',
    location: 'Premier étage',
    capacity: 15,
    pricePerHour: 10,
    pricePerDay: 40,
    pricePerWeek: 169,
    pricePerMonth: 449,
    features: [
      'Zone silencieuse',
      'Écrans partagés',
      'Salon détente',
      'Vue dégagée',
      'Concentration',
    ],
    image: 'bg-gradient-to-br from-green-400 to-emerald-600',
    available: true,
    rating: 4.7,
    specialty: 'Calme et concentration',
  },
}

export default function SpaceReservationPage() {
  const params = useParams()
  const spaceId = params.spaceId as string
  const [showDetails, setShowDetails] = useState(true)

  const space = SPACE_MAP[spaceId as keyof typeof SPACE_MAP]

  if (!space) {
    return (
      <div className="from-coffee-secondary/20 flex min-h-screen items-center justify-center bg-gradient-to-br to-white">
        <div className="text-center">
          <h1 className="text-coffee-primary mb-4 text-2xl font-bold">
            Espace non trouvé
          </h1>
          <p className="mb-6 text-gray-600">L'espace demandé n'existe pas.</p>
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

  if (showDetails) {
    return (
      <SpaceDetails
        onBack={() => window.history.back()}
        onBook={() => setShowDetails(false)}
      />
    )
  }

  return <BookingFlow preSelectedSpace={space} />
}
