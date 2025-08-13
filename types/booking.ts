/**
 * Types pour l'API de réservations - Compatibles avec l'interface BookingFlow
 */

export interface BookingData {
  id?: string
  userId: string
  spaceId: string
  date: string // ISO date string
  startTime: string // Format HH:mm
  endTime: string // Format HH:mm
  duration: number
  durationType: 'hour' | 'day' | 'week' | 'month'
  guests: number
  totalPrice: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  paymentId?: string
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded'
  notes?: string
  createdAt?: string
  updatedAt?: string
  // Propriétés calculées
  canBeCancelled?: boolean
  canBeModified?: boolean
  isPast?: boolean
  isActive?: boolean
  formattedDate?: string
  formattedTimeRange?: string
}

export interface SpaceInfo {
  id: string
  name: string
  location: string
  capacity: number
  specialty: 'Café coworking' | 'Salle privée' | 'Zone silencieuse'
  image: string
  features: string[]
  rating: number
  description?: string
  amenities?: string[]
  isPopular: boolean
  available: boolean
  pricing: {
    perHour: number
    perDay: number
    perWeek: number
    perMonth: number
  }
  openingHours?: {
    [key: string]: {
      open: string
      close: string
      closed?: boolean
    }
  }
  isOpen?: boolean
}

export interface BookingWithSpace extends BookingData {
  space: SpaceInfo | null
}

export interface CreateBookingRequest {
  spaceId: string
  date: string
  startTime: string
  endTime: string
  duration: number
  durationType: 'hour' | 'day' | 'week' | 'month'
  guests: number
  notes?: string
}

export interface UpdateBookingRequest {
  date?: string
  startTime?: string
  endTime?: string
  duration?: number
  durationType?: 'hour' | 'day' | 'week' | 'month'
  guests?: number
  notes?: string
  status?: 'cancelled'
}

export interface TimeSlot {
  startTime: string
  endTime: string
  available: boolean
  duration: number // en minutes
}

export interface AvailabilityResponse {
  available: boolean
  date: string
  reason?: string
  spaceInfo: SpaceInfo
  availability: {
    totalSlots: number
    availableSlots: number
    occupiedSlots: number
    occupancyRate: number
  }
  timeSlots: TimeSlot[]
  freeBlocks: {
    startTime: string
    endTime: string
    duration: number
  }[]
  consecutiveSlots?: {
    startTime: string
    endTime: string
    duration: number
    available: boolean
  }[]
  recommendations: {
    bestAvailability: {
      startTime: string
      endTime: string
      duration: number
    } | null
    suggestedDuration: number
  }
  requestedSlot?: {
    startTime: string
    endTime: string
    available: boolean
  }
  conflicts?: {
    reason: string
    bookingId: string
    conflictStartTime: string
    conflictEndTime: string
  }[]
}

export interface BookingsListResponse {
  bookings: BookingWithSpace[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

export interface SpacesListResponse {
  spaces: SpaceInfo[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
  filters: {
    specialty?: string
    minCapacity?: number
    available?: boolean
    popular?: boolean
    search?: string
  }
}

// Types pour les erreurs API
export interface ApiError {
  error: string
  code: string
  details?: any
}

// Types pour les réponses API génériques
export interface ApiResponse<T> {
  message?: string
  data?: T
  error?: string
  code?: string
  details?: any
}

export interface BookingResponse extends ApiResponse<BookingData> {
  booking?: BookingData
}

export interface SpaceResponse extends ApiResponse<SpaceInfo> {
  space?: SpaceInfo
}

// Paramètres de requête pour GET /api/bookings
export interface GetBookingsParams {
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  date?: string
  spaceId?: string
  limit?: number
  offset?: number
}

// Paramètres de requête pour GET /api/spaces
export interface GetSpacesParams {
  specialty?: 'Café coworking' | 'Salle privée' | 'Zone silencieuse'
  minCapacity?: number
  available?: boolean
  popular?: boolean
  search?: string
  limit?: number
  offset?: number
}

// Paramètres de requête pour GET /api/bookings/availability
export interface GetAvailabilityParams {
  spaceId: string
  date: string
  startTime?: string
  endTime?: string
  duration?: number
  slotDuration?: 15 | 30 | 60 | 120
}
