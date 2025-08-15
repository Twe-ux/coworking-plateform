import { Document, Schema, model, models, Model } from 'mongoose'
import { ObjectId } from 'mongodb'

// Interface pour les méthodes statiques
interface ICategoryModel extends Model<ICategory> {
  buildCategoryTree(): Promise<any[]>
}

// Interface principale pour le document Category
export interface ICategory extends Document {
  _id: ObjectId
  name: string
  slug: string
  description?: string
  color: string
  icon?: string
  parentCategory?: ObjectId // Référence vers Category (pour les sous-catégories)
  isActive: boolean
  sortOrder: number
  seoMetadata: {
    title?: string
    description?: string
    keywords?: string[]
  }
  stats: {
    articleCount: number
    totalViews: number
    lastArticleAt?: Date
  }
  createdBy: ObjectId // Référence vers User
  updatedBy?: ObjectId // Référence vers User
  createdAt: Date
  updatedAt: Date
  // Virtual properties
  fullPath: string
  hasSubCategories: boolean
  isSubCategory: boolean
  articleCountRecursive: number
  // Instance methods
  incrementArticleCount(): Promise<this>
  decrementArticleCount(): Promise<this>
  incrementViews(viewCount?: number): Promise<this>
  getAncestors(): Promise<ICategory[]>
  getDescendants(): Promise<ICategory[]>
  getAllDescendants(): Promise<ICategory[]>
  getFullPath(): Promise<string>
  canBeDeleted(): Promise<boolean>
}

// Schema Mongoose pour les catégories
const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, 'Le nom de la catégorie est obligatoire'],
      trim: true,
      minlength: [2, 'Le nom doit contenir au moins 2 caractères'],
      maxlength: [100, 'Le nom ne peut dépasser 100 caractères'],
      index: true,
    },
    slug: {
      type: String,
      required: [true, 'Le slug est obligatoire'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
      validate: {
        validator: function (value: string) {
          return /^[a-z0-9-]+$/.test(value)
        },
        message: 'Le slug ne peut contenir que des lettres minuscules, chiffres et tirets',
      },
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'La description ne peut dépasser 500 caractères'],
    },
    color: {
      type: String,
      required: [true, 'La couleur est obligatoire'],
      trim: true,
      validate: {
        validator: function (value: string) {
          return /^#[0-9A-F]{6}$/i.test(value)
        },
        message: 'La couleur doit être au format hexadécimal (#RRGGBB)',
      },
      default: '#3B82F6',
    },
    icon: {
      type: String,
      trim: true,
      maxlength: [50, 'Le nom de l\'icône ne peut dépasser 50 caractères'],
      validate: {
        validator: function (value: string) {
          return !value || /^[a-zA-Z0-9-_]+$/.test(value)
        },
        message: 'Le nom de l\'icône ne peut contenir que des lettres, chiffres, tirets et underscores',
      },
    },
    parentCategory: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
      min: [0, 'L\'ordre de tri ne peut être négatif'],
      index: true,
    },
    seoMetadata: {
      title: {
        type: String,
        trim: true,
        maxlength: [60, 'Le titre SEO ne peut dépasser 60 caractères'],
      },
      description: {
        type: String,
        trim: true,
        maxlength: [160, 'La description SEO ne peut dépasser 160 caractères'],
      },
      keywords: [
        {
          type: String,
          trim: true,
          lowercase: true,
        },
      ],
    },
    stats: {
      articleCount: { type: Number, default: 0, min: 0 },
      totalViews: { type: Number, default: 0, min: 0 },
      lastArticleAt: { type: Date, default: null },
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Le créateur est obligatoire'],
      index: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.__v
        return ret
      },
    },
    toObject: { virtuals: true },
  }
)

// Index composites pour les requêtes fréquentes
categorySchema.index({ isActive: 1, sortOrder: 1 }, { name: 'active_sort_order' })
categorySchema.index({ parentCategory: 1, isActive: 1, sortOrder: 1 }, { name: 'parent_active_sort' })
categorySchema.index({ 'stats.articleCount': -1, isActive: 1 }, { name: 'article_count_active' })
categorySchema.index({ createdAt: -1, isActive: 1 }, { name: 'created_active' })

// Index de texte pour la recherche
categorySchema.index(
  {
    name: 'text',
    description: 'text',
  },
  {
    name: 'category_text_search',
    weights: {
      name: 10,
      description: 1,
    },
  }
)

// Propriétés virtuelles
categorySchema.virtual('fullPath').get(function (this: ICategory) {
  // Cette propriété sera populée par une méthode statique si nécessaire
  return this.slug
})

categorySchema.virtual('hasSubCategories').get(function (this: ICategory) {
  // Cette propriété sera calculée dynamiquement via une requête
  return false // Placeholder - sera override par les méthodes
})

categorySchema.virtual('isSubCategory').get(function (this: ICategory) {
  return !!this.parentCategory
})

categorySchema.virtual('articleCountRecursive').get(function (this: ICategory) {
  // Cette propriété sera calculée dynamiquement via une requête
  return this.stats.articleCount // Placeholder
})

// Méthodes d'instance
categorySchema.methods.incrementArticleCount = function (this: ICategory) {
  this.stats.articleCount += 1
  this.stats.lastArticleAt = new Date()
  return this.save()
}

categorySchema.methods.decrementArticleCount = function (this: ICategory) {
  if (this.stats.articleCount > 0) {
    this.stats.articleCount -= 1
  }
  return this.save()
}

categorySchema.methods.incrementViews = function (this: ICategory, viewCount: number = 1) {
  this.stats.totalViews += viewCount
  return this.save()
}

categorySchema.methods.getAncestors = async function (this: ICategory) {
  const ancestors: ICategory[] = []
  let current = this

  while (current.parentCategory) {
    const parent = await (this.constructor as any).findById(current.parentCategory)
    if (!parent) break
    ancestors.unshift(parent)
    current = parent
  }

  return ancestors
}

categorySchema.methods.getDescendants = async function (this: ICategory) {
  return await (this.constructor as any).find({ parentCategory: this._id }).populate('parentCategory')
}

categorySchema.methods.getAllDescendants = async function (this: ICategory) {
  const descendants: ICategory[] = []
  const directChildren = await this.getDescendants()

  for (const child of directChildren) {
    descendants.push(child)
    const grandChildren = await child.getAllDescendants()
    descendants.push(...grandChildren)
  }

  return descendants
}

categorySchema.methods.getFullPath = async function (this: ICategory): Promise<string> {
  const ancestors = await this.getAncestors()
  const pathSegments = ancestors.map(ancestor => ancestor.slug)
  pathSegments.push(this.slug)
  return pathSegments.join('/')
}

categorySchema.methods.canBeDeleted = async function (this: ICategory): Promise<boolean> {
  // Vérifier s'il y a des articles dans cette catégorie
  if (this.stats.articleCount > 0) return false

  // Vérifier s'il y a des sous-catégories
  const Article = models.Article
  const subCategories = await (this.constructor as any).countDocuments({ parentCategory: this._id })
  if (subCategories > 0) return false

  // Vérifier s'il y a des articles dans les sous-catégories
  if (Article) {
    const articlesInSubCategories = await Article.countDocuments({
      category: { $in: await this.getAllDescendants().then(desc => desc.map(d => d._id)) }
    })
    if (articlesInSubCategories > 0) return false
  }

  return true
}

// Méthodes statiques
categorySchema.statics.findActive = function (includeSubCategories: boolean = true) {
  const query: any = { isActive: true }
  if (!includeSubCategories) {
    query.parentCategory = { $exists: false }
  }
  return this.find(query).sort({ sortOrder: 1, name: 1 })
}

categorySchema.statics.findBySlug = function (slug: string) {
  return this.findOne({ slug, isActive: true }).populate('parentCategory', 'name slug color icon')
}

categorySchema.statics.findTopLevel = function () {
  return this.find({
    parentCategory: { $exists: false },
    isActive: true,
  }).sort({ sortOrder: 1, name: 1 })
}

categorySchema.statics.findWithSubCategories = function (categoryId?: string) {
  const query: any = { isActive: true }
  if (categoryId) {
    query.$or = [
      { _id: categoryId },
      { parentCategory: categoryId }
    ]
  }
  
  return this.find(query)
    .populate('parentCategory', 'name slug color icon')
    .sort({ parentCategory: 1, sortOrder: 1, name: 1 })
}

categorySchema.statics.searchCategories = function (
  searchTerm: string,
  includeInactive: boolean = false,
  limit: number = 20
) {
  const query: any = {
    $text: { $search: searchTerm },
  }

  if (!includeInactive) {
    query.isActive = true
  }

  return this.find(query, { score: { $meta: 'textScore' } })
    .populate('parentCategory', 'name slug color icon')
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit)
}

categorySchema.statics.findMostPopular = function (limit: number = 10) {
  return this.find({ isActive: true })
    .sort({ 'stats.articleCount': -1, 'stats.totalViews': -1 })
    .limit(limit)
}

categorySchema.statics.findWithRecentActivity = function (days: number = 30, limit: number = 10) {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  return this.find({
    isActive: true,
    'stats.lastArticleAt': { $gte: cutoff },
  })
    .sort({ 'stats.lastArticleAt': -1 })
    .limit(limit)
}

categorySchema.statics.buildCategoryTree = async function () {
  const categories = await this.find({ isActive: true })
    .sort({ sortOrder: 1, name: 1 })
    .lean()

  const categoryMap = new Map()
  const tree: any[] = []

  // Créer une map de toutes les catégories
  categories.forEach(category => {
    categoryMap.set(category._id.toString(), {
      ...category,
      children: []
    })
  })

  // Construire l'arbre
  categories.forEach(category => {
    const categoryNode = categoryMap.get(category._id.toString())
    
    if (category.parentCategory) {
      const parent = categoryMap.get(category.parentCategory.toString())
      if (parent) {
        parent.children.push(categoryNode)
      }
    } else {
      tree.push(categoryNode)
    }
  })

  return tree
}

categorySchema.statics.reorderCategories = async function (
  categoryIds: string[],
  parentCategoryId?: string
) {
  const updates = categoryIds.map((id, index) => ({
    updateOne: {
      filter: {
        _id: id,
        parentCategory: parentCategoryId || { $exists: false }
      },
      update: { sortOrder: index }
    }
  }))

  return await this.bulkWrite(updates)
}

// Validation pour éviter les références circulaires
categorySchema.pre('validate', async function (next) {
  if (this.parentCategory && this._id) {
    // Vérifier que la catégorie parent n'est pas elle-même ou un descendant
    let current = await (this.constructor as any).findById(this.parentCategory)
    
    while (current) {
      if (current._id.toString() === this._id.toString()) {
        return next(new Error('Une catégorie ne peut pas être sa propre parente'))
      }
      current = current.parentCategory ? 
        await (this.constructor as any).findById(current.parentCategory) : 
        null
    }
  }
  next()
})

// Middleware pre-save pour générer le slug automatiquement
categorySchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .substring(0, 50)
  }
  next()
})

// Middleware pre-save pour gérer les métadonnées SEO automatiques
categorySchema.pre('save', function (next) {
  if (this.isModified('name') || this.isModified('description')) {
    if (!this.seoMetadata.title) {
      this.seoMetadata.title = this.name.substring(0, 60)
    }
    if (!this.seoMetadata.description && this.description) {
      this.seoMetadata.description = this.description.substring(0, 160)
    }
  }
  next()
})

// Middleware pour mettre à jour updatedBy
categorySchema.pre('save', function (next) {
  if (this.isModified() && !this.isNew && this.updatedBy) {
    // updatedBy sera défini par le contrôleur
  }
  next()
})

// Middleware post-remove pour nettoyer les références
categorySchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  try {
    // Déplacer les sous-catégories vers la catégorie parent
    if (this.parentCategory) {
      await (this.constructor as any).updateMany(
        { parentCategory: this._id },
        { parentCategory: this.parentCategory }
      )
    } else {
      // Si c'est une catégorie de niveau supérieur, faire des sous-catégories des catégories de niveau supérieur
      await (this.constructor as any).updateMany(
        { parentCategory: this._id },
        { $unset: { parentCategory: 1 } }
      )
    }

    // Optionnel : déplacer les articles vers une catégorie par défaut
    const Article = models.Article
    if (Article) {
      const defaultCategory = await (this.constructor as any).findOne({ slug: 'general' })
      if (defaultCategory) {
        await Article.updateMany(
          { category: this._id },
          { category: defaultCategory._id }
        )
      }
    }

    next()
  } catch (error: any) {
    next(error)
  }
})

// Catégories par défaut à insérer
export const defaultCategories = [
  {
    name: 'Général',
    slug: 'general',
    description: 'Articles généraux et divers',
    color: '#6B7280',
    icon: 'folder',
    sortOrder: 0,
  },
  {
    name: 'Actualités',
    slug: 'actualites',
    description: 'Dernières nouvelles et actualités',
    color: '#EF4444',
    icon: 'newspaper',
    sortOrder: 1,
  },
  {
    name: 'Coworking',
    slug: 'coworking',
    description: 'Tout sur l\'univers du coworking',
    color: '#3B82F6',
    icon: 'users',
    sortOrder: 2,
  },
  {
    name: 'Conseils',
    slug: 'conseils',
    description: 'Conseils et bonnes pratiques',
    color: '#10B981',
    icon: 'lightbulb',
    sortOrder: 3,
  },
  {
    name: 'Événements',
    slug: 'evenements',
    description: 'Événements et activités',
    color: '#F59E0B',
    icon: 'calendar',
    sortOrder: 4,
  },
  {
    name: 'Tutoriels',
    slug: 'tutoriels',
    description: 'Guides et tutoriels pratiques',
    color: '#8B5CF6',
    icon: 'academic-cap',
    sortOrder: 5,
  },
]

// Fonction utilitaire pour insérer les catégories par défaut
export async function insertDefaultCategories(createdBy: ObjectId) {
  const existingCategories = await Category.countDocuments()
  
  if (existingCategories === 0) {
    const categoriesToInsert = defaultCategories.map(cat => ({
      ...cat,
      createdBy,
    }))
    
    await Category.insertMany(categoriesToInsert)
    console.log('Catégories par défaut insérées avec succès')
  }
}

// Exporter le modèle
export const Category = (models.Category || model<ICategory, ICategoryModel>('Category', categorySchema)) as ICategoryModel

// Export par défaut
export default Category