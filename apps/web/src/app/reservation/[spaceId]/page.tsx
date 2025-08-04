'use client'

import { useParams } from 'next/navigation'
import BookingFlow from '@/components/booking/BookingFlow'
import SpaceDetails from '@/components/booking/SpaceDetails'
import { useState } from 'react'

const SPACE_MAP = {
  'places': {
    id: 'places',
    name: 'Places',
    location: 'Rez-de-chaussée',
    capacity: 12,
    pricePerHour: 8,
    pricePerDay: 35,
    pricePerWeek: 149,
    pricePerMonth: 399,
    features: ['WiFi Fibre', 'Prises électriques', 'Vue sur rue', 'Accès boissons', 'Ambiance café'],
    image: 'bg-gradient-to-br from-amber-400 to-orange-600',
    available: true,
    rating: 4.8,
    specialty: 'Ambiance café conviviale'
  },
  'verriere': {
    id: 'verriere',
    name: 'Salle Verrière',
    location: 'Niveau intermédiaire',
    capacity: 8,
    pricePerHour: 12,
    pricePerDay: 45,
    pricePerWeek: 189,
    pricePerMonth: 499,
    features: ['Lumière naturelle', 'Espace privé', 'Tableau blanc', 'Climatisation', 'Calme'],
    image: 'bg-gradient-to-br from-blue-400 to-indigo-600',
    available: true,
    rating: 4.9,
    specialty: 'Luminosité naturelle'
  },
  'etage': {
    id: 'etage',
    name: 'Étage',
    location: 'Premier étage',
    capacity: 15,
    pricePerHour: 10,
    pricePerDay: 40,
    pricePerWeek: 169,
    pricePerMonth: 449,
    features: ['Zone silencieuse', 'Écrans partagés', 'Salon détente', 'Vue dégagée', 'Concentration'],
    image: 'bg-gradient-to-br from-green-400 to-emerald-600',
    available: true,
    rating: 4.7,
    specialty: 'Calme et concentration'
  }
}

export default function SpaceReservationPage() {
  const params = useParams()
  const spaceId = params.spaceId as string
  const [showDetails, setShowDetails] = useState(true)
  
  const space = SPACE_MAP[spaceId as keyof typeof SPACE_MAP]
  
  if (!space) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-coffee-secondary/20 to-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-coffee-accent mb-4">Espace non trouvé</h1>
          <p className="text-gray-600 mb-6">L'espace demandé n'existe pas.</p>
          <a 
            href="/reservation" 
            className="bg-gradient-to-r from-coffee-primary to-coffee-accent text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
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