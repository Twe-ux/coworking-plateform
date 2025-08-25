import mongoose, { Document, Schema } from 'mongoose'
import type { IEmployee } from './employee'

export interface ITimeEntry extends Document {
  _id: string
  employeeId: mongoose.Types.ObjectId
  employee?: IEmployee
  date: Date
  clockIn: Date
  clockOut?: Date | null
  shiftNumber: 1 | 2
  totalHours?: number
  status: 'active' | 'completed'
  hasError?: boolean
  errorType?: 'MISSING_CLOCK_OUT' | 'INVALID_TIME_RANGE' | 'DUPLICATE_ENTRY'
  errorMessage?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  calculateTotalHours(): number
  completeShift(): Promise<void>
}

const timeEntrySchema = new Schema<ITimeEntry>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, "L'ID de l'employé est obligatoire"],
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'La date est obligatoire'],
      index: true,
      default: function () {
        // Utiliser la date actuelle au début de la journée
        const now = new Date()
        return new Date(now.getFullYear(), now.getMonth(), now.getDate())
      },
    },
    clockIn: {
      type: Date,
      required: [true, "L'heure d'arrivée est obligatoire"],
      default: Date.now,
    },
    clockOut: {
      type: Date,
      default: null,
    },
    shiftNumber: {
      type: Number,
      required: [true, 'Le numéro de shift est obligatoire'],
      enum: {
        values: [1, 2],
        message: 'Le numéro de shift doit être 1 ou 2',
      },
      default: 1,
    },
    totalHours: {
      type: Number,
      min: [0, "Le total d'heures ne peut pas être négatif"],
      max: [24, "Le total d'heures ne peut pas dépasser 24h"],
    },
    status: {
      type: String,
      required: [true, 'Le statut est obligatoire'],
      enum: {
        values: ['active', 'completed'],
        message: 'Le statut doit être "active" ou "completed"',
      },
      default: 'active',
    },
    hasError: {
      type: Boolean,
      default: false,
    },
    errorType: {
      type: String,
      enum: ['MISSING_CLOCK_OUT', 'INVALID_TIME_RANGE', 'DUPLICATE_ENTRY'],
      required: false,
    },
    errorMessage: {
      type: String,
      required: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Index composé pour optimiser les recherches
timeEntrySchema.index({ employeeId: 1, date: 1 })
timeEntrySchema.index({ employeeId: 1, status: 1 })
timeEntrySchema.index({ date: 1, status: 1 })
timeEntrySchema.index({ status: 1, isActive: 1 })

// Index unique pour empêcher les doublons de shift par employé par jour
timeEntrySchema.index(
  { employeeId: 1, date: 1, shiftNumber: 1 },
  {
    unique: true,
    partialFilterExpression: { isActive: true },
    name: 'unique_employee_shift_per_day',
  }
)

// Virtuel pour calculer la durée en temps réel
timeEntrySchema.virtual('currentDuration').get(function (this: ITimeEntry) {
  if (!this.clockOut) {
    const now = new Date()
    const durationMs = now.getTime() - this.clockIn.getTime()
    return Math.max(0, durationMs / (1000 * 60 * 60)) // en heures
  }
  return this.totalHours || 0
})

// Middleware de validation avant sauvegarde
timeEntrySchema.pre('save', async function (next) {
  try {
    // Vérifier que l'employé existe
    const Employee = mongoose.models.Employee
    const employee = await Employee.findById((this as any).employeeId)
    if (!employee) {
      throw new Error('Employé introuvable')
    }

    // Si c'est une nouvelle entrée, vérifier le nombre de shifts
    if (this.isNew) {
      const existingShifts = await mongoose.models.TimeEntry.countDocuments({
        employeeId: (this as any).employeeId,
        date: (this as any).date,
        isActive: true,
      })

      if (existingShifts >= 2) {
        throw new Error(
          'Un employé ne peut avoir que 2 shifts maximum par jour'
        )
      }

      // Déterminer automatiquement le numéro de shift
      if (existingShifts === 1) {
        (this as any).shiftNumber = 2
      } else {
        (this as any).shiftNumber = 1
      }
    }

    // Valider que clockOut est après clockIn
    if ((this as any).clockOut && (this as any).clockOut <= (this as any).clockIn) {
      throw new Error(
        "L'heure de sortie doit être postérieure à l'heure d'entrée"
      )
    }

    // Calculer les heures totales si clockOut est défini
    if ((this as any).clockOut && !(this as any).totalHours) {
      (this as any).totalHours = (this as any).calculateTotalHours()
    }

    // Mettre à jour le statut
    if ((this as any).clockOut && (this as any).status === 'active') {
      (this as any).status = 'completed'
    }

    next()
  } catch (error) {
    next(error as Error)
  }
})

// Méthodes d'instance
timeEntrySchema.methods.calculateTotalHours = function (): number {
  if (!this.clockOut) {
    return 0
  }

  const durationMs = this.clockOut.getTime() - this.clockIn.getTime()
  const hours = durationMs / (1000 * 60 * 60)

  // Arrondir à 2 décimales
  return Math.round(hours * 100) / 100
}

timeEntrySchema.methods.completeShift = async function (): Promise<void> {
  if (this.status === 'completed') {
    throw new Error('Ce shift est déjà terminé')
  }

  this.clockOut = new Date()
  this.totalHours = this.calculateTotalHours()
  this.status = 'completed'

  await this.save()
}

// Méthodes statiques
timeEntrySchema.statics.findActiveShifts = function (employeeId?: string) {
  const query: any = { status: 'active', isActive: true }
  if (employeeId) {
    query.employeeId = employeeId
  }
  return this.find(query)
    .populate('employee', 'firstName lastName role')
    .sort({ clockIn: -1 })
}

timeEntrySchema.statics.findByDateRange = function (
  startDate: Date,
  endDate: Date,
  employeeId?: string
) {
  const query: any = {
    date: {
      $gte: startDate,
      $lte: endDate,
    },
    isActive: true,
  }

  if (employeeId) {
    query.employeeId = employeeId
  }

  return this.find(query)
    .populate('employee', 'firstName lastName role')
    .sort({ date: -1, clockIn: -1 })
}

timeEntrySchema.statics.getEmployeeHours = function (
  employeeId: string,
  startDate: Date,
  endDate: Date
) {
  return this.aggregate([
    {
      $match: {
        employeeId: new mongoose.Types.ObjectId(employeeId),
        date: {
          $gte: startDate,
          $lte: endDate,
        },
        status: 'completed',
        isActive: true,
      },
    },
    {
      $group: {
        _id: null,
        totalHours: { $sum: '$totalHours' },
        totalShifts: { $sum: 1 },
        averageHoursPerShift: { $avg: '$totalHours' },
      },
    },
  ])
}

timeEntrySchema.statics.getDailyReport = function (date: Date) {
  const startOfDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  )
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1)

  return this.aggregate([
    {
      $match: {
        date: startOfDay,
        isActive: true,
      },
    },
    {
      $lookup: {
        from: 'employees',
        localField: 'employeeId',
        foreignField: '_id',
        as: 'employee',
      },
    },
    {
      $unwind: '$employee',
    },
    {
      $group: {
        _id: '$employeeId',
        employee: { $first: '$employee' },
        shifts: {
          $push: {
            shiftNumber: '$shiftNumber',
            clockIn: '$clockIn',
            clockOut: '$clockOut',
            totalHours: '$totalHours',
            status: '$status',
          },
        },
        totalHours: { $sum: { $ifNull: ['$totalHours', 0] } },
        activeShifts: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
        },
      },
    },
    {
      $sort: { 'employee.firstName': 1, 'employee.lastName': 1 },
    },
  ])
}

// Éviter la re-compilation du modèle
const TimeEntry =
  mongoose.models.TimeEntry ||
  mongoose.model<ITimeEntry>('TimeEntry', timeEntrySchema)

export default TimeEntry
