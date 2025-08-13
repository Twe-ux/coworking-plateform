export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'completed'

export interface Reservation {
  id: string
  userId: string
  spaceId: string
  startTime: Date
  endTime: Date
  duration: number // en heures
  totalPrice: number
  notes?: string
  status: ReservationStatus
  createdAt: Date
  updatedAt: Date
  user?: {
    id: string
    name: string
    email: string
  }
  space?: {
    id: string
    name: string
    type: string
  }
}

export interface CreateReservationData {
  spaceId: string
  startTime: Date
  endTime: Date
  notes?: string
}

export interface UpdateReservationData {
  startTime?: Date
  endTime?: Date
  notes?: string
  status?: ReservationStatus
}
