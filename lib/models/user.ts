import { Document, Schema, model, models } from 'mongoose'
import { ObjectId } from 'mongodb'
import { UserRole } from '@/types/auth'

// Interface pour le document User (compatible avec NextAuth)
export interface IUser extends Document {
  _id: ObjectId
  email: string
  password: string
  firstName?: string
  lastName?: string
  name?: string
  role: UserRole
  permissions: string[]
  isActive: boolean
  status: 'active' | 'inactive' | 'suspended' | 'pending'
  emailVerified?: Date
  image?: string
  phone?: string
  preferences?: {
    notifications: {
      email: boolean
      sms: boolean
      push: boolean
    }
    language: string
    timezone: string
  }
  lastLoginAt?: Date
  loginHistory?: Array<{
    timestamp: Date
    ip: string
    userAgent: string
    success: boolean
  }>
  resetPasswordToken?: string
  resetPasswordExpires?: Date
  emailVerificationToken?: string
  emailVerificationExpires?: Date
  twoFactorSecret?: string
  twoFactorEnabled: boolean
  createdAt: Date
  updatedAt: Date
}

// Schema Mongoose pour les utilisateurs
const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'L\'adresse email est obligatoire'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      validate: {
        validator: function (value: string) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        },
        message: 'Format d\'adresse email invalide',
      },
    },
    password: {
      type: String,
      required: [true, 'Le mot de passe est obligatoire'],
      minlength: [8, 'Le mot de passe doit contenir au moins 8 caractères'],
      // Le mot de passe est déjà hashé avec bcrypt
    },
    firstName: {
      type: String,
      trim: true,
      maxlength: [50, 'Le prénom ne peut dépasser 50 caractères'],
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: [50, 'Le nom ne peut dépasser 50 caractères'],
    },
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Le nom complet ne peut dépasser 100 caractères'],
    },
    role: {
      type: String,
      enum: {
        values: ['admin', 'manager', 'staff', 'client'],
        message: 'Rôle invalide',
      },
      required: [true, 'Le rôle utilisateur est obligatoire'],
      default: 'client',
      index: true,
    },
    permissions: [
      {
        type: String,
        trim: true,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'inactive', 'suspended', 'pending'],
        message: 'Statut invalide',
      },
      default: 'active',
      index: true,
    },
    emailVerified: {
      type: Date,
      default: null,
    },
    image: {
      type: String,
      trim: true,
      validate: {
        validator: function (value: string) {
          return !value || /^(https?:\/\/|\/|data:image\/)/.test(value)
        },
        message: 'Format d\'image invalide',
      },
    },
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: function (value: string) {
          return !value || /^[+]?[\d\s()-]{10,}$/.test(value)
        },
        message: 'Format de numéro de téléphone invalide',
      },
    },
    preferences: {
      notifications: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
        push: { type: Boolean, default: true },
      },
      language: { type: String, default: 'fr' },
      timezone: { type: String, default: 'Europe/Paris' },
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    loginHistory: [
      {
        timestamp: { type: Date, required: true },
        ip: { type: String, required: true },
        userAgent: { type: String, required: true },
        success: { type: Boolean, required: true },
      },
    ],
    resetPasswordToken: {
      type: String,
      select: false, // Ne pas inclure par défaut dans les requêtes
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    twoFactorSecret: {
      type: String,
      select: false, // Très sensible - ne jamais exposer
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Ajoute automatiquement createdAt et updatedAt
    toJSON: { 
      virtuals: true,
      transform: function(doc, ret) {
        // Supprimer les champs sensibles lors de la sérialisation JSON
        delete ret.password
        delete ret.resetPasswordToken
        delete ret.resetPasswordExpires
        delete ret.emailVerificationToken
        delete ret.emailVerificationExpires
        delete ret.twoFactorSecret
        return ret
      }
    },
    toObject: { 
      virtuals: true,
      transform: function(doc, ret) {
        // Supprimer les champs sensibles lors de la conversion en objet
        delete ret.password
        delete ret.resetPasswordToken
        delete ret.resetPasswordExpires
        delete ret.emailVerificationToken
        delete ret.emailVerificationExpires
        delete ret.twoFactorSecret
        return ret
      }
    },
  }
)

// Index pour les recherches fréquentes
userSchema.index({ email: 1 }, { unique: true, name: 'email_unique' })
userSchema.index({ role: 1, isActive: 1 }, { name: 'role_active' })
userSchema.index({ status: 1, createdAt: -1 }, { name: 'status_created' })
userSchema.index({ lastLoginAt: -1 }, { name: 'last_login' })

// Index de texte pour la recherche
userSchema.index(
  { 
    firstName: 'text', 
    lastName: 'text', 
    email: 'text',
    name: 'text'
  }, 
  { name: 'user_text_search' }
)

// Index TTL pour supprimer automatiquement les comptes non vérifiés après 7 jours
userSchema.index(
  { createdAt: 1 },
  {
    name: 'unverified_accounts_ttl',
    expireAfterSeconds: 7 * 24 * 60 * 60, // 7 jours
    partialFilterExpression: { 
      emailVerified: null, 
      status: 'pending' 
    },
  }
)

// Méthodes virtuelles
userSchema.virtual('fullName').get(function (this: IUser) {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`
  }
  return this.name || this.firstName || this.lastName || ''
})

userSchema.virtual('displayName').get(function (this: IUser) {
  return this.fullName || this.email.split('@')[0]
})

userSchema.virtual('isEmailVerified').get(function (this: IUser) {
  return !!this.emailVerified
})

userSchema.virtual('daysSinceLastLogin').get(function (this: IUser) {
  if (!this.lastLoginAt) return null
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - this.lastLoginAt.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
})

// Méthodes d'instance
userSchema.methods.hasPermission = function (
  this: IUser,
  permission: string
): boolean {
  return this.permissions.includes(permission) || this.role === 'admin'
}

userSchema.methods.hasRole = function (
  this: IUser,
  roles: UserRole | UserRole[]
): boolean {
  const rolesArray = Array.isArray(roles) ? roles : [roles]
  return rolesArray.includes(this.role)
}

userSchema.methods.canManage = function (this: IUser): boolean {
  return ['admin', 'manager'].includes(this.role)
}

userSchema.methods.isAccountLocked = function (this: IUser): boolean {
  return this.status === 'suspended' || !this.isActive
}

userSchema.methods.getRecentLoginAttempts = function (
  this: IUser,
  hours: number = 1
): number {
  if (!this.loginHistory || this.loginHistory.length === 0) return 0
  
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000)
  return this.loginHistory.filter(
    attempt => attempt.timestamp > cutoff && !attempt.success
  ).length
}

// Méthodes statiques
userSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase().trim() })
}

userSchema.statics.findActiveUsers = function (role?: UserRole) {
  const query: any = { isActive: true, status: 'active' }
  if (role) query.role = role
  return this.find(query).sort({ lastLoginAt: -1 })
}

userSchema.statics.findByRole = function (role: UserRole) {
  return this.find({ role, isActive: true }).sort({ createdAt: -1 })
}

userSchema.statics.searchUsers = function (
  searchTerm: string, 
  role?: UserRole,
  limit: number = 20
) {
  const query: any = {
    $or: [
      { firstName: { $regex: searchTerm, $options: 'i' } },
      { lastName: { $regex: searchTerm, $options: 'i' } },
      { email: { $regex: searchTerm, $options: 'i' } },
      { name: { $regex: searchTerm, $options: 'i' } },
    ]
  }
  
  if (role) query.role = role
  
  return this.find(query)
    .select('-password -resetPasswordToken -emailVerificationToken -twoFactorSecret')
    .sort({ lastLoginAt: -1 })
    .limit(limit)
}

// Middleware pre-save pour des validations personnalisées
userSchema.pre('save', function (next) {
  // S'assurer que firstName et lastName sont définis si name l'est
  if (this.name && !this.firstName && !this.lastName) {
    const nameParts = this.name.split(' ')
    this.firstName = nameParts[0] || ''
    this.lastName = nameParts.slice(1).join(' ') || ''
  }

  // S'assurer que name est défini si firstName et lastName le sont
  if (this.firstName && this.lastName && !this.name) {
    this.name = `${this.firstName} ${this.lastName}`
  }

  next()
})

// Middleware pour gérer la limite de l'historique de connexion
userSchema.pre('save', function (next) {
  if (this.loginHistory && this.loginHistory.length > 100) {
    // Garder seulement les 100 dernières tentatives
    this.loginHistory = this.loginHistory
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 100)
  }
  next()
})

// Exporter le modèle
export const User = models.User || model<IUser>('User', userSchema)

// Export par défaut
export default User