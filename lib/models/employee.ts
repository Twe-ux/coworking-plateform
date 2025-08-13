import mongoose, { Document, Schema } from 'mongoose'

export interface IEmployee extends Document {
  _id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  role:
    | 'Manager'
    | 'Reception'
    | 'Security'
    | 'Maintenance'
    | 'Cleaning'
    | 'Staff'
  color: string
  startDate: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const employeeSchema = new Schema<IEmployee>(
  {
    firstName: {
      type: String,
      required: [true, 'Le prénom est obligatoire'],
      trim: true,
      minlength: [2, 'Le prénom doit contenir au moins 2 caractères'],
      maxlength: [50, 'Le prénom ne peut pas dépasser 50 caractères'],
    },
    lastName: {
      type: String,
      required: [true, 'Le nom est obligatoire'],
      trim: true,
      minlength: [2, 'Le nom doit contenir au moins 2 caractères'],
      maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères'],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Format d'email invalide",
      ],
      sparse: true, // Permet les valeurs nulles/undefined uniques
    },
    phone: {
      type: String,
      trim: true,
      match: [
        /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/,
        'Format de téléphone français invalide',
      ],
      sparse: true,
    },
    role: {
      type: String,
      required: [true, 'Le rôle est obligatoire'],
      enum: {
        values: [
          'Manager',
          'Reception',
          'Security',
          'Maintenance',
          'Cleaning',
          'Staff',
        ],
        message:
          'Rôle invalide. Rôles autorisés: Manager, Reception, Security, Maintenance, Cleaning, Staff',
      },
    },
    color: {
      type: String,
      required: [true, 'La couleur est obligatoire'],
      default: function () {
        // Attribution automatique de couleurs
        const colors = [
          'bg-blue-500',
          'bg-green-500',
          'bg-purple-500',
          'bg-orange-500',
          'bg-red-500',
          'bg-teal-500',
          'bg-indigo-500',
          'bg-pink-500',
          'bg-yellow-500',
          'bg-cyan-500',
        ]
        return colors[Math.floor(Math.random() * colors.length)]
      },
      validate: {
        validator: function (color: string) {
          // Valider format couleur (classe CSS ou code hex)
          return /^(bg-\w+-\d+|#[0-9A-Fa-f]{6})$/.test(color)
        },
        message:
          'Format de couleur invalide. Utilisez une classe Tailwind (ex: bg-blue-500) ou un code hex (ex: #3B82F6)',
      },
    },
    startDate: {
      type: Date,
      required: [true, 'La date de début est obligatoire'],
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Ajoute automatiquement createdAt et updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Index pour optimiser les recherches
employeeSchema.index({ isActive: 1 })
employeeSchema.index({ role: 1 })
employeeSchema.index({ firstName: 1, lastName: 1 })

// Virtuel pour le nom complet
employeeSchema.virtual('fullName').get(function (this: IEmployee) {
  return `${this.firstName} ${this.lastName}`
})

// Middleware pour s'assurer qu'un email unique n'est pas dupliqué
employeeSchema.pre('save', async function (next) {
  if (this.email && this.isModified('email')) {
    const existingEmployee = await mongoose.models.Employee.findOne({
      email: this.email,
      _id: { $ne: this._id },
    })
    if (existingEmployee) {
      throw new Error('Un employé avec cet email existe déjà')
    }
  }
  next()
})

// Méthodes de l'instance
employeeSchema.methods.deactivate = function () {
  this.isActive = false
  return this.save()
}

employeeSchema.methods.activate = function () {
  this.isActive = true
  return this.save()
}

// Méthodes statiques
employeeSchema.statics.findActive = function () {
  return this.find({ isActive: true }).sort({ firstName: 1, lastName: 1 })
}

employeeSchema.statics.findByRole = function (role: string) {
  return this.find({ role, isActive: true }).sort({ firstName: 1, lastName: 1 })
}

// Éviter la re-compilation du modèle
const Employee =
  mongoose.models.Employee ||
  mongoose.model<IEmployee>('Employee', employeeSchema)

export default Employee
