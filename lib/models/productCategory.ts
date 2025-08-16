import { Document, Schema, model, models } from 'mongoose'
import { ObjectId } from 'mongodb'

export interface IProductCategory extends Document {
  _id: ObjectId
  name: string
  slug: string
  description?: string
  icon?: string
  color?: string
  image?: string
  isActive: boolean
  sortOrder: number
  parentCategoryId?: ObjectId
  metaTitle?: string
  metaDescription?: string
  createdBy: ObjectId
  createdAt: Date
  updatedAt: Date
  // Virtual properties
  hasChildren: boolean
  productCount: number
}

const productCategorySchema = new Schema<IProductCategory>(
  {
    name: {
      type: String,
      required: [true, 'Le nom de la catégorie est obligatoire'],
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
      trim: true,
      maxlength: [500, 'La description ne peut dépasser 500 caractères']
    },
    icon: {
      type: String,
      trim: true,
      maxlength: [10, 'L\'icône ne peut dépasser 10 caractères']
    },
    color: {
      type: String,
      trim: true,
      validate: {
        validator: function(value: string) {
          return !value || /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value)
        },
        message: 'La couleur doit être un code hexadécimal valide (#RRGGBB ou #RGB)'
      }
    },
    image: {
      type: String,
      trim: true,
      validate: {
        validator: function(value: string) {
          return !value || /^(https?:\/\/|\/|data:image\/)/.test(value)
        },
        message: 'Format d\'image invalide'
      }
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    sortOrder: {
      type: Number,
      default: 0,
      index: true
    },
    parentCategoryId: {
      type: Schema.Types.ObjectId,
      ref: 'ProductCategory',
      default: null,
      index: true
    },
    metaTitle: {
      type: String,
      trim: true,
      maxlength: [60, 'Le titre SEO ne peut dépasser 60 caractères']
    },
    metaDescription: {
      type: String,
      trim: true,
      maxlength: [160, 'La description SEO ne peut dépasser 160 caractères']
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
productCategorySchema.index({ name: 1, isActive: 1 })
productCategorySchema.index({ parentCategoryId: 1, sortOrder: 1 })
productCategorySchema.index({ slug: 1, isActive: 1 })

// Index de texte pour la recherche
productCategorySchema.index({
  name: 'text',
  description: 'text'
}, {
  name: 'category_text_search',
  weights: {
    name: 10,
    description: 1
  }
})

// Propriétés virtuelles
productCategorySchema.virtual('hasChildren').get(function(this: IProductCategory) {
  // Cette propriété sera calculée lors des requêtes avec aggregation
  return false
})

productCategorySchema.virtual('productCount').get(function(this: IProductCategory) {
  // Cette propriété sera calculée lors des requêtes avec aggregation
  return 0
})

// Middleware pre-save pour générer le slug automatiquement
productCategorySchema.pre('save', function(next) {
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
  
  // Générer automatiquement les meta tags SEO si non définis
  if (!this.metaTitle) {
    this.metaTitle = this.name
  }
  
  if (!this.metaDescription && this.description) {
    this.metaDescription = this.description.substring(0, 160)
  }
  
  next()
})

// Middleware pour empêcher la suppression d'une catégorie qui a des enfants
productCategorySchema.pre('deleteOne', async function(next) {
  const docToDelete = await this.model.findOne(this.getQuery())
  if (docToDelete) {
    const childrenCount = await this.model.countDocuments({ 
      parentCategoryId: docToDelete._id 
    })
    
    if (childrenCount > 0) {
      const error = new Error('Impossible de supprimer une catégorie qui contient des sous-catégories')
      return next(error)
    }
  }
  next()
})

// Méthodes statiques
productCategorySchema.statics.findActive = function(parentId?: string) {
  const query: any = { isActive: true }
  if (parentId !== undefined) {
    query.parentCategoryId = parentId || null
  }
  return this.find(query).sort({ sortOrder: 1, name: 1 })
}

productCategorySchema.statics.findBySlug = function(slug: string) {
  return this.findOne({ slug, isActive: true })
}

productCategorySchema.statics.findHierarchy = function() {
  return this.aggregate([
    { $match: { isActive: true } },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: 'categoryId',
        as: 'products'
      }
    },
    {
      $addFields: {
        productCount: { $size: '$products' }
      }
    },
    {
      $lookup: {
        from: 'productcategories',
        localField: '_id',
        foreignField: 'parentCategoryId',
        as: 'children'
      }
    },
    {
      $addFields: {
        hasChildren: { $gt: [{ $size: '$children' }, 0] }
      }
    },
    {
      $sort: { sortOrder: 1, name: 1 }
    },
    {
      $project: {
        products: 0,
        children: 0
      }
    }
  ])
}

productCategorySchema.statics.findTree = function() {
  return this.aggregate([
    { $match: { isActive: true } },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: 'categoryId',
        as: 'products'
      }
    },
    {
      $addFields: {
        productCount: { $size: '$products' }
      }
    },
    {
      $graphLookup: {
        from: 'productcategories',
        startWith: '$_id',
        connectFromField: '_id',
        connectToField: 'parentCategoryId',
        as: 'descendants',
        maxDepth: 3
      }
    },
    {
      $sort: { sortOrder: 1, name: 1 }
    }
  ])
}

productCategorySchema.statics.searchCategories = function(
  searchTerm: string,
  activeOnly: boolean = true,
  limit: number = 20
) {
  const query: any = {
    $text: { $search: searchTerm }
  }
  
  if (activeOnly) {
    query.isActive = true
  }
  
  return this.find(query, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' }, sortOrder: 1 })
    .limit(limit)
}

// Méthodes d'instance
productCategorySchema.methods.getAncestors = function(this: IProductCategory) {
  return this.model('ProductCategory').aggregate([
    { $match: { _id: this._id } },
    {
      $graphLookup: {
        from: 'productcategories',
        startWith: '$parentCategoryId',
        connectFromField: 'parentCategoryId',
        connectToField: '_id',
        as: 'ancestors'
      }
    },
    {
      $unwind: {
        path: '$ancestors',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $replaceRoot: { newRoot: '$ancestors' }
    },
    {
      $sort: { sortOrder: 1, name: 1 }
    }
  ])
}

productCategorySchema.methods.getChildren = function(this: IProductCategory, activeOnly: boolean = true) {
  const query: any = { parentCategoryId: this._id }
  if (activeOnly) {
    query.isActive = true
  }
  return this.model('ProductCategory').find(query).sort({ sortOrder: 1, name: 1 })
}

productCategorySchema.methods.getDescendants = function(this: IProductCategory, maxDepth: number = 3) {
  return this.model('ProductCategory').aggregate([
    { $match: { _id: this._id } },
    {
      $graphLookup: {
        from: 'productcategories',
        startWith: '$_id',
        connectFromField: '_id',
        connectToField: 'parentCategoryId',
        as: 'descendants',
        maxDepth: maxDepth
      }
    },
    {
      $unwind: '$descendants'
    },
    {
      $replaceRoot: { newRoot: '$descendants' }
    },
    {
      $sort: { sortOrder: 1, name: 1 }
    }
  ])
}

productCategorySchema.methods.updateSortOrder = function(this: IProductCategory, newOrder: number) {
  this.sortOrder = newOrder
  return this.save()
}

productCategorySchema.methods.toggleActive = function(this: IProductCategory) {
  this.isActive = !this.isActive
  return this.save()
}

// Export du modèle
export const ProductCategory = models.ProductCategory || model<IProductCategory>('ProductCategory', productCategorySchema)
export default ProductCategory