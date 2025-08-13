// Export des modèles MongoDB pour la plateforme de coworking

// Modèles principaux
export { User, type IUser } from './user'
export { Booking, type IBooking } from './booking'
export { Space, type ISpace, defaultSpaces, insertDefaultSpaces } from './space'

// Réexport des utilitaires MongoDB
export {
  checkBookingConflicts,
  getAvailableTimeSlots,
  getOccupancyStats,
  findConsecutiveFreeSlots,
  validateBookingData,
  calculateBookingPrice,
  generateOccupancyReport,
  type TimeSlot,
  type BookingConflict,
  type OccupancyStats,
} from '../mongodb-utils'

// Types utiles pour les API
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'
export type DurationType = 'hour' | 'day' | 'week' | 'month'
export type SpaceSpecialty =
  | 'Café coworking'
  | 'Salle privée'
  | 'Zone silencieuse'

// Interface pour les données de création de réservation
export interface CreateBookingData {
  userId: string
  spaceId: string
  date: Date
  startTime: string
  endTime: string
  duration: number
  durationType: DurationType
  guests: number
  totalPrice: number
  paymentMethod: 'onsite' | 'card' | 'paypal'
  notes?: string
}

// Interface pour les données de création d'espace
export interface CreateSpaceData {
  id: string
  name: string
  location: string
  capacity: number
  pricePerHour: number
  pricePerDay: number
  pricePerWeek: number
  pricePerMonth: number
  features: string[]
  image: string
  specialty: SpaceSpecialty
  description?: string
  amenities?: string[]
  isPopular?: boolean
}
