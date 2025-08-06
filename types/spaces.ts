export type SpaceType = 'desk' | 'office' | 'meeting-room' | 'common-area' | 'phone-booth'
export type SpaceStatus = 'active' | 'maintenance' | 'inactive'

export interface Space {
  id: string
  name: string
  type: SpaceType
  capacity: number
  description?: string
  amenities: string[]
  pricePerHour: number
  images: string[]
  status: SpaceStatus
  availability: SpaceAvailability[]
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

export interface SpaceAvailability {
  date: Date
  timeSlots: TimeSlot[]
  available: boolean
}

export interface TimeSlot {
  startTime: string // Format HH:mm
  endTime: string   // Format HH:mm
  available: boolean
  reservationId?: string
}