import { Document, Schema, model, models } from 'mongoose'
import { ObjectId } from 'mongodb'

export type ProductCategory = 'coffee' | 'tea' | 'pastry' | 'sandwich' | 'snack' | 'beverage' | 'healthy' | 'breakfast'
export type ProductStatus = 'available' | 'unavailable' | 'coming_soon'

export interface IProductIngredient {
  name: string
  quantity?: string
  optional?: boolean
}

export interface IProductRecipe {
  instructions: string[]
  ingredients: IProductIngredient[]
  preparationTime?: number
  difficulty?: 'easy' | 'medium' | 'hard'
  tips?: string[]
}

export interface IProductNutrition {
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  sugar?: number
  caffeine?: number
  allergens?: string[]
}

export interface IProduct extends Document {
  _id: ObjectId
  name: string
  slug: string
  description: string
  shortDescription?: string
  category: ProductCategory
  subcategory?: string
  price: number
  originalPrice?: number
  images: string[]
  mainImage?: string
  recipe?: IProductRecipe
  nutrition?: IProductNutrition
  status: ProductStatus
  featured: boolean
  isOrganic?: boolean
  isFairTrade?: boolean
  isVegan?: boolean
  isGlutenFree?: boolean
  tags: string[]
  customizations?: Array<{
    name: string
    options: Array<{
      name: string
      priceModifier: number
    }>
  }>
  sizes?: Array<{
    name: string
    price: number
    description?: string
  }>
  availableHours?: {
    start: string
    end: string
  }
  stockQuantity?: number
  isUnlimited: boolean
  preparationTime?: number
  averageRating?: number
  totalReviews?: number
  popularity?: number
  createdBy: ObjectId
  createdAt: Date
  updatedAt: Date
  // Virtual properties
  isAvailable: boolean
  discountPercentage: number | null
  displayPrice: string
}

const productIngredientSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: String,
    trim: true
  },
  optional: {
    type: Boolean,
    default: false
  }
}, { _id: false })

const productRecipeSchema = new Schema({
  instructions: [{
    type: String,
    required: true,
    trim: true
  }],
  ingredients: [productIngredientSchema],
  preparationTime: {
    type: Number,
    min: 1,
    max: 120
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'easy'
  },
  tips: [{
    type: String,
    trim: true
  }]
}, { _id: false })

const productNutritionSchema = new Schema({
  calories: { type: Number, min: 0 },
  protein: { type: Number, min: 0 },
  carbs: { type: Number, min: 0 },
  fat: { type: Number, min: 0 },
  sugar: { type: Number, min: 0 },
  caffeine: { type: Number, min: 0 },
  allergens: [{
    type: String,
    trim: true
  }]
}, { _id: false })

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Le nom du produit est obligatoire'],
      trim: true,
      maxlength: [100, 'Le nom ne peut dépasser 100 caractères'],
      index: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      validate: {
        validator: function(value: string) {
          return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
        },
        message: 'Le slug doit contenir uniquement des lettres minuscules, chiffres et tirets'
      }
    },
    description: {
      type: String,
      required: [true, 'La description est obligatoire'],
      trim: true,
      maxlength: [1000, 'La description ne peut dépasser 1000 caractères']
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: [200, 'La description courte ne peut dépasser 200 caractères']
    },
    category: {
      type: String,
      required: [true, 'La catégorie est obligatoire'],
      enum: {
        values: ['coffee', 'tea', 'pastry', 'sandwich', 'snack', 'beverage', 'healthy', 'breakfast'],
        message: 'Catégorie invalide'
      },
      index: true
    },
    subcategory: {
      type: String,
      trim: true,
      maxlength: [50, 'La sous-catégorie ne peut dépasser 50 caractères']
    },
    price: {
      type: Number,
      required: [true, 'Le prix est obligatoire'],
      min: [0, 'Le prix doit être positif'],
      validate: {
        validator: function(value: number) {
          return Number.isFinite(value) && value >= 0
        },
        message: 'Le prix doit être un nombre valide'
      }
    },
    originalPrice: {
      type: Number,
      min: [0, 'Le prix original doit être positif'],
      validate: {
        validator: function(this: IProduct, value: number) {
          return !value || value >= this.price
        },
        message: 'Le prix original doit être supérieur ou égal au prix actuel'
      }
    },
    images: [{
      type: String,
      trim: true,
      validate: {
        validator: function(value: string) {
          return /^(https?:\/\/|\/|data:image\/)/.test(value)
        },
        message: 'Format d\'image invalide'
      }
    }],
    mainImage: {
      type: String,
      trim: true,
      validate: {
        validator: function(value: string) {
          return !value || /^(https?:\/\/|\/|data:image\/)/.test(value)
        },
        message: 'Format d\'image invalide'
      }
    },
    recipe: productRecipeSchema,
    nutrition: productNutritionSchema,
    status: {
      type: String,
      enum: {
        values: ['available', 'unavailable', 'coming_soon'],
        message: 'Statut invalide'
      },
      default: 'available',
      index: true
    },
    featured: {
      type: Boolean,
      default: false,
      index: true
    },
    isOrganic: {
      type: Boolean,
      default: false
    },
    isFairTrade: {
      type: Boolean,
      default: false
    },
    isVegan: {
      type: Boolean,
      default: false
    },
    isGlutenFree: {
      type: Boolean,
      default: false
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true
    }],
    customizations: [{
      name: {
        type: String,
        required: true,
        trim: true
      },
      options: [{
        name: {
          type: String,
          required: true,
          trim: true
        },
        priceModifier: {
          type: Number,
          required: true,
          default: 0
        }
      }]
    }],
    sizes: [{
      name: {
        type: String,
        required: true,
        trim: true
      },
      price: {
        type: Number,
        required: true,
        min: 0
      },
      description: {
        type: String,
        trim: true
      }
    }],
    availableHours: {
      start: {
        type: String,
        validate: {
          validator: function(value: string) {
            return !value || /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)
          },
          message: 'Format d\'heure invalide (HH:MM)'
        }
      },
      end: {
        type: String,
        validate: {
          validator: function(value: string) {
            return !value || /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)
          },
          message: 'Format d\'heure invalide (HH:MM)'
        }
      }
    },
    stockQuantity: {
      type: Number,
      min: [0, 'La quantité en stock doit être positive'],
      default: 0
    },
    isUnlimited: {
      type: Boolean,
      default: true
    },
    preparationTime: {
      type: Number,
      min: [1, 'Le temps de préparation doit être au moins 1 minute'],
      max: [120, 'Le temps de préparation ne peut dépasser 120 minutes']
    },
    averageRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    totalReviews: {
      type: Number,
      min: 0,
      default: 0
    },
    popularity: {
      type: Number,
      min: 0,
      default: 0,
      index: -1
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Le créateur est obligatoire'],
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function(doc, ret) {
        delete ret.__v
        return ret
      }
    },
    toObject: {
      virtuals: true
    }
  }
)

// Index pour les recherches fréquentes
productSchema.index({ category: 1, status: 1, featured: -1 })
productSchema.index({ status: 1, popularity: -1 })
productSchema.index({ featured: 1, createdAt: -1 })
productSchema.index({ price: 1 })
productSchema.index({ averageRating: -1, totalReviews: -1 })

// Index de texte pour la recherche
productSchema.index({
  name: 'text',
  description: 'text',
  tags: 'text',
  subcategory: 'text'
}, {
  name: 'product_text_search',
  weights: {
    name: 10,
    tags: 5,
    subcategory: 3,
    description: 1
  }
})

// Propriétés virtuelles
productSchema.virtual('isAvailable').get(function(this: IProduct) {
  if (this.status !== 'available') return false
  if (!this.isUnlimited && this.stockQuantity! <= 0) return false
  
  if (this.availableHours?.start && this.availableHours?.end) {
    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    return currentTime >= this.availableHours.start && currentTime <= this.availableHours.end
  }
  
  return true
})

productSchema.virtual('discountPercentage').get(function(this: IProduct) {
  if (!this.originalPrice || this.originalPrice <= this.price) return null
  return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100)
})

productSchema.virtual('displayPrice').get(function(this: IProduct) {
  return `${this.price.toFixed(2)}€`
})

// Middleware pre-save pour générer le slug automatiquement
productSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
  }
  
  // Définir mainImage si non définie et qu'il y a des images
  if (!this.mainImage && this.images.length > 0) {
    this.mainImage = this.images[0]
  }
  
  next()
})

// Méthodes statiques
productSchema.statics.findAvailable = function(category?: ProductCategory) {
  const query: any = { status: 'available' }
  if (category) query.category = category
  return this.find(query).sort({ featured: -1, popularity: -1, createdAt: -1 })
}

productSchema.statics.findFeatured = function(limit: number = 6) {
  return this.find({ featured: true, status: 'available' })
    .sort({ popularity: -1, createdAt: -1 })
    .limit(limit)
}

productSchema.statics.findByCategory = function(category: ProductCategory) {
  return this.find({ category, status: 'available' })
    .sort({ featured: -1, popularity: -1, name: 1 })
}

productSchema.statics.searchProducts = function(searchTerm: string, filters: any = {}) {
  const query: any = {
    $text: { $search: searchTerm },
    status: 'available',
    ...filters
  }
  
  return this.find(query, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' }, featured: -1, popularity: -1 })
}

productSchema.statics.findByPriceRange = function(minPrice: number, maxPrice: number) {
  return this.find({
    price: { $gte: minPrice, $lte: maxPrice },
    status: 'available'
  }).sort({ price: 1 })
}

// Méthodes d'instance
productSchema.methods.updatePopularity = function(this: IProduct, increment: number = 1) {
  this.popularity = (this.popularity || 0) + increment
  return this.save()
}

productSchema.methods.updateRating = function(this: IProduct, newRating: number) {
  const currentTotal = (this.averageRating || 0) * (this.totalReviews || 0)
  this.totalReviews = (this.totalReviews || 0) + 1
  this.averageRating = (currentTotal + newRating) / this.totalReviews
  return this.save()
}

productSchema.methods.decreaseStock = function(this: IProduct, quantity: number = 1) {
  if (this.isUnlimited) return this
  
  this.stockQuantity = Math.max(0, (this.stockQuantity || 0) - quantity)
  if (this.stockQuantity === 0) {
    this.status = 'unavailable'
  }
  return this.save()
}

productSchema.methods.increaseStock = function(this: IProduct, quantity: number = 1) {
  if (this.isUnlimited) return this
  
  this.stockQuantity = (this.stockQuantity || 0) + quantity
  if (this.status === 'unavailable' && this.stockQuantity > 0) {
    this.status = 'available'
  }
  return this.save()
}

// Export du modèle
export const Product = models.Product || model<IProduct>('Product', productSchema)
export default Product