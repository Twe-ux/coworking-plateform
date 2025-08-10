'use client'

import { useState, useEffect } from 'react'

interface Space {
  id: string
  name: string
  location: string
  capacity: number
  pricePerHour: number
  pricePerDay: number
  pricePerWeek: number
  pricePerMonth: number
  features: string[]
  amenities: string[]
  image: string
  rating: number
  specialty: string
  isPopular: boolean
  description: string
  color?: string
  openingHours?: any
}

interface SpaceDetails extends Omit<Space, 'features'> {
  area: number
  reviewCount: number
  images: string[]
  features: {
    icon: any
    name: string
    description: string
    included: boolean
  }[]
  rules: string[]
  availability: {
    today: boolean
    nextAvailable: Date
  }
  reviews: {
    id: string
    user: string
    rating: number
    comment: string
    date: Date
    verified: boolean
  }[]
  coordinates: {
    lat: number
    lng: number
  }
}

/**
 * Hook pour récupérer la liste des espaces disponibles
 */
export function useSpaces() {
  const [spaces, setSpaces] = useState<Space[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSpaces = async () => {
      try {
        const response = await fetch('/api/spaces')
        const result = await response.json()

        if (result.success) {
          setSpaces(result.data)
          setError(null)
        } else {
          setError(result.error)
        }
      } catch (err) {
        setError('Erreur lors de la récupération des espaces')
        console.error('Erreur useSpaces:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSpaces()
  }, [])

  return { spaces, isLoading, error }
}

/**
 * Hook pour récupérer les détails d'un espace spécifique
 */
export function useSpaceDetails(spaceId: string) {
  const [space, setSpace] = useState<SpaceDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!spaceId) {
      setIsLoading(false)
      return
    }

    const fetchSpaceDetails = async () => {
      try {
        const response = await fetch(`/api/spaces/${spaceId}`)
        const result = await response.json()

        if (result.success) {
          // Convertir les dates string en objets Date
          const spaceData = {
            ...result.data,
            availability: {
              ...result.data.availability,
              nextAvailable: new Date(result.data.availability.nextAvailable)
            },
            reviews: result.data.reviews.map((review: any) => ({
              ...review,
              date: new Date(review.date)
            }))
          }
          setSpace(spaceData)
          setError(null)
        } else {
          setError(result.error)
        }
      } catch (err) {
        setError('Erreur lors de la récupération des détails de l\'espace')
        console.error('Erreur useSpaceDetails:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSpaceDetails()
  }, [spaceId])

  return { space, isLoading, error }
}

export type { Space, SpaceDetails }