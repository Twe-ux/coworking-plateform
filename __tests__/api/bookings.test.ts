/**
 * Tests d'intégration pour l'API de réservations
 * Ces tests vérifient le bon fonctionnement des endpoints
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { connectToDatabase } from '@/lib/mongodb'
import { Booking, Space } from '@/lib/models'
import { ObjectId } from 'mongodb'

// Mock NextAuth pour les tests
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(() => Promise.resolve({
    user: {
      id: '65a1b2c3d4e5f6789012',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'client'
    }
  }))
}))

describe('API Bookings Integration Tests', () => {
  let testSpaceId: ObjectId
  let testBookingId: ObjectId

  beforeAll(async () => {
    // Connexion à la base de données de test
    await connectToDatabase()
    
    // Créer un espace de test
    const testSpace = new Space({
      id: 'test-space',
      name: 'Espace Test',
      location: 'Test Location',
      capacity: 5,
      pricePerHour: 10,
      pricePerDay: 50,
      pricePerWeek: 300,
      pricePerMonth: 1000,
      features: ['WiFi', 'Test Feature'],
      image: '/test-image.jpg',
      specialty: 'Café coworking',
      available: true,
      rating: 4.5,
      isPopular: false
    })
    
    const savedSpace = await testSpace.save()
    testSpaceId = savedSpace._id
  })

  afterAll(async () => {
    // Nettoyer les données de test
    if (testBookingId) {
      await Booking.findByIdAndDelete(testBookingId)
    }
    if (testSpaceId) {
      await Space.findByIdAndDelete(testSpaceId)
    }
  })

  describe('POST /api/bookings', () => {
    it('devrait créer une nouvelle réservation avec des données valides', async () => {
      const bookingData = {
        spaceId: testSpaceId.toString(),
        date: '2024-12-25', // Date future
        startTime: '14:00',
        endTime: '16:00',
        duration: 2,
        durationType: 'hour' as const,
        guests: 3,
        notes: 'Réservation de test'
      }

      // Simuler la requête POST
      const { POST } = await import('@/app/api/bookings/route')
      const request = new Request('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(201)
      expect(result.message).toBe('Réservation créée avec succès')
      expect(result.booking).toBeDefined()
      expect(result.booking.status).toBe('pending')
      expect(result.booking.totalPrice).toBe(20) // 2h * 10€/h

      testBookingId = new ObjectId(result.booking.id)
    })

    it('devrait rejeter une réservation avec des données invalides', async () => {
      const invalidData = {
        spaceId: 'invalid-id',
        date: 'invalid-date',
        startTime: '25:00', // Heure invalide
        endTime: '14:00',   // Fin avant début
        duration: -1,       // Durée négative
        durationType: 'invalid' as any,
        guests: 0          // Pas d'invités
      }

      const { POST } = await import('@/app/api/bookings/route')
      const request = new Request('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.code).toBe('VALIDATION_ERROR')
      expect(result.details).toBeDefined()
    })
  })

  describe('GET /api/bookings', () => {
    it('devrait récupérer la liste des réservations de l\'utilisateur', async () => {
      const { GET } = await import('@/app/api/bookings/route')
      const request = new Request('http://localhost:3000/api/bookings?limit=5&offset=0')

      const response = await GET(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.bookings).toBeDefined()
      expect(Array.isArray(result.bookings)).toBe(true)
      expect(result.pagination).toBeDefined()
      expect(result.pagination.total).toBeGreaterThanOrEqual(0)
      expect(result.pagination.limit).toBe(5)
      expect(result.pagination.offset).toBe(0)
    })

    it('devrait filtrer les réservations par status', async () => {
      const { GET } = await import('@/app/api/bookings/route')
      const request = new Request('http://localhost:3000/api/bookings?status=pending')

      const response = await GET(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      
      // Vérifier que toutes les réservations retournées ont le status pending
      if (result.bookings.length > 0) {
        result.bookings.forEach((booking: any) => {
          expect(booking.status).toBe('pending')
        })
      }
    })
  })

  describe('GET /api/bookings/availability', () => {
    it('devrait retourner les informations de disponibilité pour un espace', async () => {
      const { GET } = await import('@/app/api/bookings/availability/route')
      const params = new URLSearchParams({
        spaceId: testSpaceId.toString(),
        date: '2024-12-26'
      })
      
      const request = new Request(`http://localhost:3000/api/bookings/availability?${params}`)

      const response = await GET(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.available).toBeDefined()
      expect(result.spaceInfo).toBeDefined()
      expect(result.spaceInfo.name).toBe('Espace Test')
      expect(result.availability).toBeDefined()
      expect(result.timeSlots).toBeDefined()
      expect(Array.isArray(result.timeSlots)).toBe(true)
      expect(result.freeBlocks).toBeDefined()
      expect(Array.isArray(result.freeBlocks)).toBe(true)
    })

    it('devrait vérifier un créneau spécifique', async () => {
      const { GET } = await import('@/app/api/bookings/availability/route')
      const params = new URLSearchParams({
        spaceId: testSpaceId.toString(),
        date: '2024-12-26',
        startTime: '10:00',
        endTime: '12:00'
      })
      
      const request = new Request(`http://localhost:3000/api/bookings/availability?${params}`)

      const response = await GET(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.available).toBeDefined()
      expect(result.requestedSlot).toBeDefined()
      expect(result.requestedSlot.startTime).toBe('10:00')
      expect(result.requestedSlot.endTime).toBe('12:00')
      expect(result.requestedSlot.available).toBeDefined()
    })

    it('devrait rejeter des paramètres invalides', async () => {
      const { GET } = await import('@/app/api/bookings/availability/route')
      const params = new URLSearchParams({
        spaceId: '',
        date: 'invalid-date'
      })
      
      const request = new Request(`http://localhost:3000/api/bookings/availability?${params}`)

      const response = await GET(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.code).toBe('QUERY_VALIDATION_ERROR')
    })
  })

  describe('GET /api/spaces', () => {
    it('devrait retourner la liste des espaces disponibles', async () => {
      const { GET } = await import('@/app/api/spaces/route')
      const request = new Request('http://localhost:3000/api/spaces?available=true')

      const response = await GET(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.spaces).toBeDefined()
      expect(Array.isArray(result.spaces)).toBe(true)
      expect(result.pagination).toBeDefined()
      
      // Vérifier que les espaces par défaut sont présents
      const spaceIds = result.spaces.map((space: any) => space.id)
      expect(spaceIds).toContain('places')
      expect(spaceIds).toContain('verriere')
      expect(spaceIds).toContain('etage')
      
      // Vérifier la structure des données
      if (result.spaces.length > 0) {
        const space = result.spaces[0]
        expect(space.id).toBeDefined()
        expect(space.name).toBeDefined()
        expect(space.location).toBeDefined()
        expect(space.capacity).toBeDefined()
        expect(space.specialty).toBeDefined()
        expect(space.pricing).toBeDefined()
        expect(space.pricing.perHour).toBeDefined()
      }
    })

    it('devrait filtrer les espaces par spécialité', async () => {
      const { GET } = await import('@/app/api/spaces/route')
      const request = new Request('http://localhost:3000/api/spaces?specialty=Café coworking')

      const response = await GET(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      
      // Vérifier que tous les espaces retournés ont la bonne spécialité
      if (result.spaces.length > 0) {
        result.spaces.forEach((space: any) => {
          expect(space.specialty).toBe('Café coworking')
        })
      }
    })

    it('devrait effectuer une recherche textuelle', async () => {
      const { GET } = await import('@/app/api/spaces/route')
      const request = new Request('http://localhost:3000/api/spaces?search=café')

      const response = await GET(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.spaces).toBeDefined()
      
      // Vérifier que les résultats contiennent le terme recherché
      if (result.spaces.length > 0) {
        const hasSearchTerm = result.spaces.some((space: any) => 
          space.name.toLowerCase().includes('café') ||
          space.location.toLowerCase().includes('café') ||
          (space.description && space.description.toLowerCase().includes('café'))
        )
        expect(hasSearchTerm).toBe(true)
      }
    })
  })

  describe('Validation et sécurité', () => {
    it('devrait valider les limites de pagination', async () => {
      const { GET } = await import('@/app/api/bookings/route')
      const request = new Request('http://localhost:3000/api/bookings?limit=150') // Au-dessus de la limite

      const response = await GET(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.code).toBe('QUERY_VALIDATION_ERROR')
    })

    it('devrait gérer les erreurs de base de données gracieusement', async () => {
      // Simuler une erreur de connexion DB en mockant temporairement
      const originalConnect = require('@/lib/mongodb').connectToDatabase
      require('@/lib/mongodb').connectToDatabase = jest.fn().mockRejectedValue(new Error('DB Connection Failed'))

      const { GET } = await import('@/app/api/spaces/route')
      const request = new Request('http://localhost:3000/api/spaces')

      const response = await GET(request)
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.code).toBe('INTERNAL_ERROR')

      // Restaurer la fonction originale
      require('@/lib/mongodb').connectToDatabase = originalConnect
    })
  })
})