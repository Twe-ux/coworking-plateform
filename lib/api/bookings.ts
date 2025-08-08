/**
 * Client-side API utilities pour les réservations
 * Fonctions pour interagir avec les endpoints de l'API bookings
 */

import { 
  BookingData, 
  BookingWithSpace, 
  CreateBookingRequest, 
  UpdateBookingRequest,
  BookingsListResponse,
  BookingResponse,
  AvailabilityResponse,
  SpacesListResponse,
  GetBookingsParams,
  GetSpacesParams,
  GetAvailabilityParams,
  ApiError
} from '@/types/booking'

// Configuration de base pour les requêtes
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
}

// Fonction utilitaire pour gérer les réponses API
async function handleApiResponse<T>(response: Response): Promise<T> {
  const data = await response.json()
  
  if (!response.ok) {
    const error: ApiError = {
      error: data.error || 'Erreur inconnue',
      code: data.code || 'UNKNOWN_ERROR',
      details: data.details
    }
    throw error
  }
  
  return data
}

// Fonction utilitaire pour construire les query params
function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value))
    }
  })
  
  return searchParams.toString()
}

/**
 * API Bookings - Fonctions pour gérer les réservations
 */
export const bookingsApi = {
  /**
   * Créer une nouvelle réservation
   */
  async create(bookingData: CreateBookingRequest): Promise<BookingData> {
    const response = await fetch(`${API_BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(bookingData),
    })
    
    const result = await handleApiResponse<BookingResponse>(response)
    return result.booking!
  },

  /**
   * Récupérer la liste des réservations de l'utilisateur
   */
  async list(params: GetBookingsParams = {}): Promise<BookingsListResponse> {
    const queryString = buildQueryString(params)
    const url = `${API_BASE_URL}/api/bookings${queryString ? `?${queryString}` : ''}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: DEFAULT_HEADERS,
    })
    
    return handleApiResponse<BookingsListResponse>(response)
  },

  /**
   * Récupérer les détails d'une réservation
   */
  async getById(id: string): Promise<BookingWithSpace> {
    const response = await fetch(`${API_BASE_URL}/api/bookings/${id}`, {
      method: 'GET',
      headers: DEFAULT_HEADERS,
    })
    
    const result = await handleApiResponse<{ booking: BookingWithSpace }>(response)
    return result.booking
  },

  /**
   * Modifier une réservation
   */
  async update(id: string, updateData: UpdateBookingRequest): Promise<BookingData> {
    const response = await fetch(`${API_BASE_URL}/api/bookings/${id}`, {
      method: 'PUT',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(updateData),
    })
    
    const result = await handleApiResponse<BookingResponse>(response)
    return result.booking!
  },

  /**
   * Annuler une réservation
   */
  async cancel(id: string): Promise<BookingData> {
    return this.update(id, { status: 'cancelled' })
  },

  /**
   * Supprimer définitivement une réservation (admin uniquement)
   */
  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/bookings/${id}`, {
      method: 'DELETE',
      headers: DEFAULT_HEADERS,
    })
    
    await handleApiResponse<{ message: string; deletedId: string }>(response)
  },

  /**
   * Vérifier la disponibilité d'un espace
   */
  async checkAvailability(params: GetAvailabilityParams): Promise<AvailabilityResponse> {
    const queryString = buildQueryString(params)
    const url = `${API_BASE_URL}/api/bookings/availability?${queryString}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: DEFAULT_HEADERS,
    })
    
    return handleApiResponse<AvailabilityResponse>(response)
  }
}

/**
 * API Spaces - Fonctions pour gérer les espaces
 */
export const spacesApi = {
  /**
   * Récupérer la liste des espaces disponibles (public)
   */
  async list(params: GetSpacesParams = {}): Promise<SpacesListResponse> {
    const queryString = buildQueryString(params)
    const url = `${API_BASE_URL}/api/spaces${queryString ? `?${queryString}` : ''}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: DEFAULT_HEADERS,
    })
    
    return handleApiResponse<SpacesListResponse>(response)
  },

  /**
   * Récupérer les espaces populaires
   */
  async getPopular(limit: number = 3): Promise<SpacesListResponse> {
    return this.list({ popular: true, limit })
  },

  /**
   * Rechercher des espaces par nom ou localisation
   */
  async search(query: string, filters: Omit<GetSpacesParams, 'search'> = {}): Promise<SpacesListResponse> {
    return this.list({ ...filters, search: query })
  }
}

/**
 * Hook personnalisé pour utiliser l'API des réservations avec gestion d'état
 */
export function useBookingsApi() {
  return {
    bookings: bookingsApi,
    spaces: spacesApi,
    
    // Fonctions utilitaires
    async createBookingWithValidation(bookingData: CreateBookingRequest): Promise<BookingData> {
      // Vérifier la disponibilité avant de créer
      const availability = await bookingsApi.checkAvailability({
        spaceId: bookingData.spaceId,
        date: bookingData.date,
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
      })
      
      if (!availability.available) {
        throw new Error(availability.reason || 'Créneau indisponible')
      }
      
      return bookingsApi.create(bookingData)
    },

    async getBookingWithRetry(id: string, maxRetries: number = 3): Promise<BookingWithSpace> {
      let lastError: Error | null = null
      
      for (let i = 0; i < maxRetries; i++) {
        try {
          return await bookingsApi.getById(id)
        } catch (error) {
          lastError = error as Error
          if (i < maxRetries - 1) {
            // Attendre avant de réessayer (backoff exponentiel)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000))
          }
        }
      }
      
      throw lastError
    }
  }
}

/**
 * Types d'erreurs spécifiques pour l'API
 */
export class BookingApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message)
    this.name = 'BookingApiError'
  }
}

export class ValidationError extends BookingApiError {
  constructor(message: string, details?: any) {
    super('VALIDATION_ERROR', message, details)
    this.name = 'ValidationError'
  }
}

export class ConflictError extends BookingApiError {
  constructor(message: string, details?: any) {
    super('CONFLICT_ERROR', message, details)
    this.name = 'ConflictError'
  }
}

export class NotFoundError extends BookingApiError {
  constructor(message: string) {
    super('NOT_FOUND', message)
    this.name = 'NotFoundError'
  }
}

export class UnauthorizedError extends BookingApiError {
  constructor(message: string = 'Authentification requise') {
    super('UNAUTHORIZED', message)
    this.name = 'UnauthorizedError'
  }
}

// Export par défaut pour faciliter l'importation
export default {
  bookings: bookingsApi,
  spaces: spacesApi,
  useBookingsApi,
  errors: {
    BookingApiError,
    ValidationError,
    ConflictError,
    NotFoundError,
    UnauthorizedError
  }
}