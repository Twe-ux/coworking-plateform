import { Document, Schema, model, models } from 'mongoose'
import { ObjectId } from 'mongodb'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import connectMongoose from '../mongoose'

// Interface pour le document Booking
export interface IBooking extends Document {
  _id: ObjectId
  userId: ObjectId
  spaceId: ObjectId
  date: Date
  startTime: string
  endTime: string
  duration: number
  durationType: 'hour' | 'day' | 'week' | 'month'
  guests: number
  totalPrice: number
  paymentMethod: 'onsite' | 'card' | 'paypal'
  status:
    | 'pending'
    | 'confirmed'
    | 'cancelled'
    | 'completed'
    | 'payment_pending'
  paymentId?: string
  stripePaymentIntentId?: string
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded'
  notes?: string
  createdAt: Date
  updatedAt: Date
}

// Schema Mongoose pour les réservations
const bookingSchema = new Schema<IBooking>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, "L'ID utilisateur est obligatoire"],
      index: true,
    },
    spaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Space',
      required: [true, "L'ID de l'espace est obligatoire"],
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'La date est obligatoire'],
      validate: {
        validator: function (value: Date) {
          // La date ne peut pas être dans le passé
          return value >= startOfDay(new Date())
        },
        message: 'La date ne peut pas être dans le passé',
      },
    },
    startTime: {
      type: String,
      required: [true, "L'heure de début est obligatoire"],
      validate: {
        validator: function (value: string) {
          // Format HH:mm (24h)
          return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)
        },
        message: "Format d'heure invalide (attendu: HH:mm)",
      },
    },
    endTime: {
      type: String,
      required: [true, "L'heure de fin est obligatoire"],
      validate: {
        validator: function (this: IBooking, value: string) {
          // Format HH:mm (24h)
          if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
            return false
          }
          // L'heure de fin doit être après l'heure de début
          const startMinutes = timeToMinutes(this.startTime)
          const endMinutes = timeToMinutes(value)
          return endMinutes > startMinutes
        },
        message: "L'heure de fin doit être après l'heure de début",
      },
    },
    duration: {
      type: Number,
      required: [true, 'La durée est obligatoire'],
      min: [1, "La durée doit être d'au moins 1 unité"],
      validate: {
        validator: function (this: IBooking, value: number) {
          // Validation selon le type de durée
          switch (this.durationType) {
            case 'hour':
              return value <= 12 // Maximum 12 heures par jour
            case 'day':
              return value <= 30 // Maximum 30 jours
            case 'week':
              return value <= 12 // Maximum 12 semaines
            case 'month':
              return value <= 12 // Maximum 12 mois
            default:
              return false
          }
        },
        message: 'Durée invalide pour le type sélectionné',
      },
    },
    durationType: {
      type: String,
      enum: {
        values: ['hour', 'day', 'week', 'month'],
        message: 'Type de durée invalide',
      },
      required: [true, 'Le type de durée est obligatoire'],
    },
    guests: {
      type: Number,
      required: [true, "Le nombre d'invités est obligatoire"],
      min: [1, 'Au moins 1 invité est requis'],
      max: [20, 'Maximum 20 invités autorisés'],
    },
    totalPrice: {
      type: Number,
      required: [true, 'Le prix total est obligatoire'],
      min: [0, 'Le prix ne peut pas être négatif'],
      validate: {
        validator: function (value: number) {
          // Le prix doit avoir au maximum 2 décimales
          return Number.isInteger(value * 100)
        },
        message: 'Le prix ne peut avoir que 2 décimales maximum',
      },
    },
    paymentMethod: {
      type: String,
      enum: {
        values: ['onsite', 'card', 'paypal'],
        message: 'Méthode de paiement invalide',
      },
      required: [true, 'La méthode de paiement est obligatoire'],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: [
          'pending',
          'confirmed',
          'cancelled',
          'completed',
          'payment_pending',
        ],
        message: 'Statut invalide',
      },
      default: 'pending',
      index: true,
    },
    paymentId: {
      type: String,
      sparse: true, // Index partiel pour les valeurs non-null uniquement
    },
    stripePaymentIntentId: {
      type: String,
      sparse: true,
    },
    paymentStatus: {
      type: String,
      enum: {
        values: ['pending', 'paid', 'failed', 'refunded'],
        message: 'Statut de paiement invalide',
      },
      default: 'pending',
    },
    notes: {
      type: String,
      maxlength: [500, 'Les notes ne peuvent dépasser 500 caractères'],
      trim: true,
    },
  },
  {
    timestamps: true, // Ajoute automatiquement createdAt et updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Index composé pour éviter les conflits de réservation
// Un espace ne peut pas être réservé au même moment
bookingSchema.index(
  { spaceId: 1, date: 1, startTime: 1, endTime: 1 },
  {
    name: 'booking_conflict_prevention',
    background: true,
  }
)

// Index pour les requêtes fréquentes
bookingSchema.index(
  { userId: 1, status: 1, date: -1 },
  {
    name: 'user_bookings_by_status_date',
    background: true,
  }
)

// Index pour les requêtes par date et espace
bookingSchema.index(
  { spaceId: 1, date: 1, status: 1 },
  {
    name: 'space_availability_check',
    background: true,
  }
)

// Index TTL pour supprimer automatiquement les réservations annulées après 30 jours
bookingSchema.index(
  { updatedAt: 1 },
  {
    name: 'cancelled_bookings_ttl',
    expireAfterSeconds: 30 * 24 * 60 * 60, // 30 jours
    partialFilterExpression: { status: 'cancelled' },
  }
)

// Middleware pre-save pour validation personnalisée
bookingSchema.pre('save', function (next) {
  // Vérifier que la combinaison durée/type est cohérente
  if (this.durationType === 'hour') {
    const startMinutes = timeToMinutes(this.startTime)
    const endMinutes = timeToMinutes(this.endTime)
    const actualDurationHours = (endMinutes - startMinutes) / 60

    if (Math.abs(actualDurationHours - this.duration) > 0.1) {
      return next(
        new Error('La durée ne correspond pas aux heures de début/fin')
      )
    }
  }

  next()
})

// Méthodes virtuelles
bookingSchema.virtual('isActive').get(function (this: IBooking) {
  return ['pending', 'confirmed'].includes(this.status)
})

bookingSchema.virtual('isPast').get(function (this: IBooking) {
  return this.date < new Date()
})

bookingSchema.virtual('formattedDate').get(function (this: IBooking) {
  return format(this.date, 'dd/MM/yyyy', { locale: fr })
})

bookingSchema.virtual('formattedTimeRange').get(function (this: IBooking) {
  return `${this.startTime} - ${this.endTime}`
})

// Méthodes d'instance
bookingSchema.methods.canBeCancelled = function (this: IBooking): boolean {
  // Une réservation peut être annulée si elle est pending ou confirmed
  // et si elle n'a pas encore commencé (au moins 1 heure avant)
  if (!['pending', 'confirmed'].includes(this.status)) {
    return false
  }

  const bookingStart = new Date(this.date)
  const [hours, minutes] = this.startTime.split(':').map(Number)
  bookingStart.setHours(hours, minutes, 0, 0)

  const now = new Date()
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)

  return bookingStart > oneHourFromNow
}

bookingSchema.methods.canBeModified = function (this: IBooking): boolean {
  // Une réservation peut être modifiée si elle est pending
  // et si elle n'a pas encore commencé (au moins 2 heures avant)
  if (this.status !== 'pending') {
    return false
  }

  const bookingStart = new Date(this.date)
  const [hours, minutes] = this.startTime.split(':').map(Number)
  bookingStart.setHours(hours, minutes, 0, 0)

  const now = new Date()
  const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000)

  return bookingStart > twoHoursFromNow
}

// Méthodes statiques
bookingSchema.statics.findActiveBookings = function (
  spaceId?: ObjectId,
  date?: Date
) {
  const query: any = { status: { $in: ['pending', 'confirmed'] } }

  if (spaceId) {
    query.spaceId = spaceId
  }

  if (date) {
    query.date = {
      $gte: startOfDay(date),
      $lte: endOfDay(date),
    }
  }

  return this.find(query).sort({ date: 1, startTime: 1 })
}

bookingSchema.statics.findUserBookings = function (
  userId: ObjectId,
  status?: string[]
) {
  const query: any = { userId }

  if (status && status.length > 0) {
    query.status = { $in: status }
  }

  return this.find(query).populate('spaceId').sort({ date: -1, startTime: -1 })
}

// Fonction utilitaire pour convertir l'heure en minutes
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

// Fonction utilitaire pour le début/fin de journée
function startOfDay(date: Date): Date {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  return start
}

function endOfDay(date: Date): Date {
  const end = new Date(date)
  end.setHours(23, 59, 59, 999)
  return end
}

// Exporter le modèle
export const Booking =
  models.Booking || model<IBooking>('Booking', bookingSchema)

// Export par défaut
export default Booking
