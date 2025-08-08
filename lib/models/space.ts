import { Document, Schema, model, models } from 'mongoose'
import { ObjectId } from 'mongodb'

// Interface pour le document Space
export interface ISpace extends Document {
  _id: ObjectId
  id: string // ID personnalisé pour compatibilité avec l'interface frontend
  name: string
  location: string
  capacity: number
  pricePerHour: number
  pricePerDay: number
  pricePerWeek: number
  pricePerMonth: number
  features: string[]
  image: string
  available: boolean
  rating: number
  specialty: string
  isPopular: boolean
  description?: string
  amenities?: string[]
  openingHours?: {
    monday: { open: string; close: string; closed?: boolean } | { closed: true }
    tuesday: { open: string; close: string; closed?: boolean } | { closed: true }
    wednesday: { open: string; close: string; closed?: boolean } | { closed: true }
    thursday: { open: string; close: string; closed?: boolean } | { closed: true }
    friday: { open: string; close: string; closed?: boolean } | { closed: true }
    saturday: { open: string; close: string; closed?: boolean } | { closed: true }
    sunday: { open: string; close: string; closed?: boolean } | { closed: true }
  }
  createdAt: Date
  updatedAt: Date
  
  // Méthodes
  getPriceForDuration(duration: number, durationType: 'hour' | 'day' | 'week' | 'month'): number
  isOpenNow(): boolean
}

// Schema Mongoose pour les espaces
const spaceSchema = new Schema<ISpace>(
  {
    id: {
      type: String,
      required: [true, 'L\'ID de l\'espace est obligatoire'],
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Le nom de l\'espace est obligatoire'],
      trim: true,
      maxlength: [100, 'Le nom ne peut dépasser 100 caractères'],
    },
    location: {
      type: String,
      required: [true, 'La localisation est obligatoire'],
      trim: true,
      maxlength: [200, 'La localisation ne peut dépasser 200 caractères'],
    },
    capacity: {
      type: Number,
      required: [true, 'La capacité est obligatoire'],
      min: [1, 'La capacité doit être d\'au moins 1 personne'],
      max: [100, 'La capacité ne peut dépasser 100 personnes'],
    },
    pricePerHour: {
      type: Number,
      required: [true, 'Le prix par heure est obligatoire'],
      min: [0, 'Le prix ne peut pas être négatif'],
      validate: {
        validator: function (value: number) {
          return Number.isInteger(value * 100)
        },
        message: 'Le prix ne peut avoir que 2 décimales maximum',
      },
    },
    pricePerDay: {
      type: Number,
      required: [true, 'Le prix par jour est obligatoire'],
      min: [0, 'Le prix ne peut pas être négatif'],
      validate: {
        validator: function (value: number) {
          return Number.isInteger(value * 100)
        },
        message: 'Le prix ne peut avoir que 2 décimales maximum',
      },
    },
    pricePerWeek: {
      type: Number,
      required: [true, 'Le prix par semaine est obligatoire'],
      min: [0, 'Le prix ne peut pas être négatif'],
      validate: {
        validator: function (value: number) {
          return Number.isInteger(value * 100)
        },
        message: 'Le prix ne peut avoir que 2 décimales maximum',
      },
    },
    pricePerMonth: {
      type: Number,
      required: [true, 'Le prix par mois est obligatoire'],
      min: [0, 'Le prix ne peut pas être négatif'],
      validate: {
        validator: function (value: number) {
          return Number.isInteger(value * 100)
        },
        message: 'Le prix ne peut avoir que 2 décimales maximum',
      },
    },
    features: [
      {
        type: String,
        trim: true,
        maxlength: [50, 'Chaque caractéristique ne peut dépasser 50 caractères'],
      },
    ],
    image: {
      type: String,
      required: [true, 'L\'image est obligatoire'],
      trim: true,
      validate: {
        validator: function (value: string) {
          // Vérifier que c'est une URL valide ou un chemin d'image
          return /^(https?:\/\/|\/|data:image\/)/.test(value)
        },
        message: 'Format d\'image invalide',
      },
    },
    available: {
      type: Boolean,
      default: true,
      index: true,
    },
    rating: {
      type: Number,
      min: [0, 'La note ne peut pas être négative'],
      max: [5, 'La note ne peut dépasser 5'],
      default: 4.5,
      validate: {
        validator: function (value: number) {
          return Number.isInteger(value * 10)
        },
        message: 'La note ne peut avoir qu\'une décimale maximum',
      },
    },
    specialty: {
      type: String,
      required: [true, 'La spécialité est obligatoire'],
      enum: {
        values: ['Café coworking', 'Salle privée', 'Zone silencieuse'],
        message: 'Spécialité invalide',
      },
      index: true,
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'La description ne peut dépasser 1000 caractères'],
    },
    amenities: [
      {
        type: String,
        trim: true,
        maxlength: [50, 'Chaque équipement ne peut dépasser 50 caractères'],
      },
    ],
    openingHours: {
      monday: {
        open: {
          type: String,
          validate: {
            validator: function (value: string) {
              return !value || /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)
            },
            message: 'Format d\'heure invalide',
          },
        },
        close: {
          type: String,
          validate: {
            validator: function (value: string) {
              return !value || /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)
            },
            message: 'Format d\'heure invalide',
          },
        },
        closed: { type: Boolean, default: false },
      },
      tuesday: {
        open: {
          type: String,
          validate: {
            validator: function (value: string) {
              return !value || /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)
            },
            message: 'Format d\'heure invalide',
          },
        },
        close: {
          type: String,
          validate: {
            validator: function (value: string) {
              return !value || /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)
            },
            message: 'Format d\'heure invalide',
          },
        },
        closed: { type: Boolean, default: false },
      },
      wednesday: {
        open: {
          type: String,
          validate: {
            validator: function (value: string) {
              return !value || /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)
            },
            message: 'Format d\'heure invalide',
          },
        },
        close: {
          type: String,
          validate: {
            validator: function (value: string) {
              return !value || /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)
            },
            message: 'Format d\'heure invalide',
          },
        },
        closed: { type: Boolean, default: false },
      },
      thursday: {
        open: {
          type: String,
          validate: {
            validator: function (value: string) {
              return !value || /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)
            },
            message: 'Format d\'heure invalide',
          },
        },
        close: {
          type: String,
          validate: {
            validator: function (value: string) {
              return !value || /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)
            },
            message: 'Format d\'heure invalide',
          },
        },
        closed: { type: Boolean, default: false },
      },
      friday: {
        open: {
          type: String,
          validate: {
            validator: function (value: string) {
              return !value || /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)
            },
            message: 'Format d\'heure invalide',
          },
        },
        close: {
          type: String,
          validate: {
            validator: function (value: string) {
              return !value || /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)
            },
            message: 'Format d\'heure invalide',
          },
        },
        closed: { type: Boolean, default: false },
      },
      saturday: {
        open: {
          type: String,
          validate: {
            validator: function (value: string) {
              return !value || /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)
            },
            message: 'Format d\'heure invalide',
          },
        },
        close: {
          type: String,
          validate: {
            validator: function (value: string) {
              return !value || /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)
            },
            message: 'Format d\'heure invalide',
          },
        },
        closed: { type: Boolean, default: false },
      },
      sunday: {
        open: {
          type: String,
          validate: {
            validator: function (value: string) {
              return !value || /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)
            },
            message: 'Format d\'heure invalide',
          },
        },
        close: {
          type: String,
          validate: {
            validator: function (value: string) {
              return !value || /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)
            },
            message: 'Format d\'heure invalide',
          },
        },
        closed: { type: Boolean, default: false },
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Index pour les recherches fréquentes
spaceSchema.index({ available: 1, specialty: 1 }, { name: 'available_specialty' })
spaceSchema.index({ isPopular: -1, rating: -1 }, { name: 'popular_rating' })
spaceSchema.index({ name: 'text', location: 'text', description: 'text' }, { name: 'text_search' })

// Méthodes virtuelles
spaceSchema.virtual('isOpen').get(function (this: ISpace) {
  if (!this.openingHours) return true

  const now = new Date()
  const currentDay = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ][now.getDay()] as keyof typeof this.openingHours

  const daySchedule = this.openingHours[currentDay]
  if (!daySchedule || daySchedule.closed) return false

  // Vérifier que les heures sont définies
  if (!daySchedule.open || !daySchedule.close) return true // Assumé ouvert si pas d'heures définies

  const currentTime = now.getHours() * 60 + now.getMinutes()
  const openTime = timeToMinutes(daySchedule.open)
  const closeTime = timeToMinutes(daySchedule.close)

  return currentTime >= openTime && currentTime <= closeTime
})

// Méthodes d'instance
spaceSchema.methods.getPriceForDuration = function (
  this: ISpace,
  duration: number,
  durationType: 'hour' | 'day' | 'week' | 'month'
): number {
  switch (durationType) {
    case 'hour':
      return this.pricePerHour * duration
    case 'day':
      return this.pricePerDay * duration
    case 'week':
      return this.pricePerWeek * duration
    case 'month':
      return this.pricePerMonth * duration
    default:
      return 0
  }
}

spaceSchema.methods.isAvailableForCapacity = function (
  this: ISpace,
  guests: number
): boolean {
  return this.available && guests <= this.capacity
}

// Méthodes statiques
spaceSchema.statics.findAvailableSpaces = function (
  specialty?: string,
  minCapacity?: number
) {
  const query: any = { available: true }

  if (specialty) {
    query.specialty = specialty
  }

  if (minCapacity) {
    query.capacity = { $gte: minCapacity }
  }

  return this.find(query).sort({ isPopular: -1, rating: -1 })
}

spaceSchema.statics.findPopularSpaces = function (limit: number = 5) {
  return this.find({ available: true, isPopular: true })
    .sort({ rating: -1 })
    .limit(limit)
}

// Fonction utilitaire
function timeToMinutes(time: string): number {
  if (!time || typeof time !== 'string') {
    console.warn('timeToMinutes: time invalide:', time)
    return 0
  }
  const [hours, minutes] = time.split(':').map(Number)
  if (isNaN(hours) || isNaN(minutes)) {
    console.warn('timeToMinutes: format invalide:', time)
    return 0
  }
  return hours * 60 + minutes
}

// Données des espaces prédéfinis
export const defaultSpaces: Partial<ISpace>[] = [
  {
    id: 'places',
    name: 'Places du café',
    location: 'Rez-de-chaussée - Zone café',
    capacity: 12,
    pricePerHour: 8,
    pricePerDay: 45,
    pricePerWeek: 250,
    pricePerMonth: 900,
    features: [
      'WiFi haut débit',
      'Prises électriques',
      'Ambiance café',
      'Boissons incluses',
      'Espace détente',
    ],
    image: '/images/spaces/cafe.jpg',
    available: true,
    rating: 4.7,
    specialty: 'Café coworking',
    isPopular: true,
    description:
      'Un espace ouvert et convivial au cœur du café, parfait pour travailler dans une ambiance décontractée avec un accès direct aux boissons et collations.',
    amenities: [
      'Machine à café',
      'Distributeur de snacks',
      'Tables partagées',
      'Chaises ergonomiques',
      'Éclairage naturel',
    ],
    openingHours: {
      monday: { open: '09:00', close: '20:00' },
      tuesday: { open: '09:00', close: '20:00' },
      wednesday: { open: '09:00', close: '20:00' },
      thursday: { open: '09:00', close: '20:00' },
      friday: { open: '09:00', close: '20:00' },
      saturday: { open: '10:00', close: '20:00' },
      sunday: { open: '10:00', close: '20:00' },
    },
  },
  {
    id: 'verriere',
    name: 'Salle Verrière',
    location: 'Rez-de-chaussée - Salle privée',
    capacity: 8,
    pricePerHour: 25,
    pricePerDay: 180,
    pricePerWeek: 1000,
    pricePerMonth: 3500,
    features: [
      'Salle privée',
      'Écran de présentation',
      'WiFi professionnel',
      'Climatisation',
      'Tableau blanc',
      'Vidéoprojecteur',
    ],
    image: '/images/spaces/verriere.jpg',
    available: true,
    rating: 4.9,
    specialty: 'Salle privée',
    isPopular: true,
    description:
      'Une salle de réunion privée et lumineuse avec verrière, équipée pour les présentations professionnelles et les réunions d\'équipe.',
    amenities: [
      'Table de conférence',
      'Chaises de bureau',
      'Système audio/vidéo',
      'Connexion HDMI',
      'Service traiteur sur demande',
    ],
    openingHours: {
      monday: { open: '08:00', close: '20:00' },
      tuesday: { open: '08:00', close: '20:00' },
      wednesday: { open: '08:00', close: '20:00' },
      thursday: { open: '08:00', close: '20:00' },
      friday: { open: '08:00', close: '20:00' },
      saturday: { open: '10:00', close: '18:00' },
      sunday: { closed: true },
    },
  },
  {
    id: 'etage',
    name: 'Zone Silencieuse - Étage',
    location: '1er étage - Zone calme',
    capacity: 15,
    pricePerHour: 12,
    pricePerDay: 65,
    pricePerWeek: 350,
    pricePerMonth: 1200,
    features: [
      'Zone silencieuse',
      'Postes individuels',
      'WiFi ultra-rapide',
      'Casiers sécurisés',
      'Imprimante/scanner',
      'Espace détente',
    ],
    image: '/images/spaces/etage.jpg',
    available: true,
    rating: 4.6,
    specialty: 'Zone silencieuse',
    isPopular: false,
    description:
      'Un espace dédié au travail concentré, avec des postes individuels dans un environnement calme et studieux, idéal pour les tâches nécessitant de la concentration.',
    amenities: [
      'Bureaux individuels',
      'Chaises ergonomiques',
      'Éclairage LED',
      'Plantes vertes',
      'Coin lecture',
      'Distributeur automatique',
    ],
    openingHours: {
      monday: { open: '07:00', close: '22:00' },
      tuesday: { open: '07:00', close: '22:00' },
      wednesday: { open: '07:00', close: '22:00' },
      thursday: { open: '07:00', close: '22:00' },
      friday: { open: '07:00', close: '22:00' },
      saturday: { open: '08:00', close: '20:00' },
      sunday: { open: '10:00', close: '20:00' },
    },
  },
]

// Fonction pour insérer les espaces par défaut
export async function insertDefaultSpaces(): Promise<void> {
  try {
    // Vérifier si les espaces existent déjà
    const existingSpaces = await Space.find({ id: { $in: ['places', 'verriere', 'etage'] } })

    if (existingSpaces.length === 0) {
      await Space.insertMany(defaultSpaces)
      console.log('Espaces par défaut insérés avec succès')
    } else {
      console.log('Les espaces par défaut existent déjà')
    }
  } catch (error) {
    console.error('Erreur lors de l\'insertion des espaces par défaut:', error)
    throw error
  }
}

// Exporter le modèle
export const Space = models.Space || model<ISpace>('Space', spaceSchema)

// Export par défaut
export default Space