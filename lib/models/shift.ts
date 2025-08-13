import mongoose, { Schema, Document } from 'mongoose'

export interface IShift extends Document {
  employeeId: mongoose.Types.ObjectId
  date: Date
  startTime: string
  endTime: string
  type: 'morning' | 'afternoon' | 'evening' | 'night'
  location?: string
  notes?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const ShiftSchema = new Schema<IShift>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, "L'ID de l'employé est requis"],
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'La date est requise'],
      index: true,
    },
    startTime: {
      type: String,
      required: [true, "L'heure de début est requise"],
      validate: {
        validator: function (v: string) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v)
        },
        message: "Format d'heure invalide (HH:MM)",
      },
    },
    endTime: {
      type: String,
      required: [true, "L'heure de fin est requise"],
      validate: {
        validator: function (v: string) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v)
        },
        message: "Format d'heure invalide (HH:MM)",
      },
    },
    type: {
      type: String,
      required: [true, 'Le type de créneau est requis'],
      enum: {
        values: ['morning', 'afternoon', 'evening', 'night'],
        message: 'Type de créneau invalide',
      },
    },
    location: {
      type: String,
      trim: true,
      maxlength: [100, "L'emplacement ne peut pas dépasser 100 caractères"],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Les notes ne peuvent pas dépasser 500 caractères'],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Index composé pour éviter les créneaux en conflit
ShiftSchema.index({ employeeId: 1, date: 1, startTime: 1 }, { unique: true })

// Index pour recherche par date
ShiftSchema.index({ date: 1, isActive: 1 })

// Validation personnalisée pour s'assurer que endTime > startTime
ShiftSchema.pre('save', function (next) {
  if (this.startTime && this.endTime) {
    const start = new Date(`2000-01-01 ${this.startTime}`)
    let end = new Date(`2000-01-01 ${this.endTime}`)

    // Gérer les créneaux de nuit qui passent minuit
    if (this.type === 'night' && end <= start) {
      end.setDate(end.getDate() + 1)
    }

    if (end <= start && this.type !== 'night') {
      next(new Error("L'heure de fin doit être postérieure à l'heure de début"))
      return
    }
  }
  next()
})

// Méthode pour calculer la durée en heures
ShiftSchema.methods.getDurationHours = function (): number {
  const start = new Date(`2000-01-01 ${this.startTime}`)
  let end = new Date(`2000-01-01 ${this.endTime}`)

  if (this.type === 'night' && end <= start) {
    end.setDate(end.getDate() + 1)
  }

  return (end.getTime() - start.getTime()) / (1000 * 60 * 60)
}

// Méthode pour vérifier si le créneau est en conflit avec un autre
ShiftSchema.methods.hasConflictWith = function (otherShift: IShift): boolean {
  if (this.employeeId.toString() !== otherShift.employeeId.toString()) {
    return false
  }

  if (this.date.toDateString() !== otherShift.date.toDateString()) {
    return false
  }

  const thisStart = new Date(`2000-01-01 ${this.startTime}`)
  const thisEnd = new Date(`2000-01-01 ${this.endTime}`)
  const otherStart = new Date(`2000-01-01 ${otherShift.startTime}`)
  const otherEnd = new Date(`2000-01-01 ${otherShift.endTime}`)

  // Gérer les créneaux de nuit
  if (this.type === 'night' && thisEnd <= thisStart) {
    thisEnd.setDate(thisEnd.getDate() + 1)
  }
  if (otherShift.type === 'night' && otherEnd <= otherStart) {
    otherEnd.setDate(otherEnd.getDate() + 1)
  }

  return thisStart < otherEnd && thisEnd > otherStart
}

// Virtuel pour formater la date
ShiftSchema.virtual('formattedDate').get(function () {
  return this.date.toLocaleDateString('fr-FR')
})

// Virtuel pour formater la période
ShiftSchema.virtual('timeRange').get(function () {
  return `${this.startTime} - ${this.endTime}`
})

export default mongoose.models?.Shift ||
  mongoose.model<IShift>('Shift', ShiftSchema)
