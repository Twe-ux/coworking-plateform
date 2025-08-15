import { Document, Schema, model, models } from 'mongoose'
import { ObjectId } from 'mongodb'

// Types pour le système d'articles
type ArticleStatus = 'draft' | 'published' | 'archived'
type ContentType = 'article' | 'news' | 'tutorial' | 'announcement'

// Interface pour les métadonnées SEO
export interface ISEOMetadata {
  title?: string
  description?: string
  keywords?: string[]
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  twitterTitle?: string
  twitterDescription?: string
  twitterImage?: string
  canonicalUrl?: string
  robots?: string
}

// Interface pour les statistiques d'article
export interface IArticleStats {
  views: number
  likes: number
  shares: number
  comments: number
  readingTime: number // en minutes
  lastViewed?: Date
}

// Interface principale pour le document Article
export interface IArticle extends Document {
  _id: ObjectId
  title: string
  slug: string
  excerpt: string
  content: string // Contenu MDX
  coverImage?: string
  gallery?: string[]
  status: ArticleStatus
  contentType: ContentType
  author: ObjectId // Référence vers User
  category: ObjectId // Référence vers Category
  tags: string[]
  featured: boolean
  allowComments: boolean
  seoMetadata: ISEOMetadata
  stats: IArticleStats
  publishedAt?: Date
  archivedAt?: Date
  lastEditedBy?: ObjectId // Référence vers User
  version: number
  revisions?: Array<{
    version: number
    content: string
    editedBy: ObjectId
    editedAt: Date
    changeNote?: string
  }>
  scheduledPublishAt?: Date
  expiresAt?: Date
  createdAt: Date
  updatedAt: Date
  // Virtual properties
  isPublished: boolean
  isScheduled: boolean
  isExpired: boolean
  fullUrl: string
  estimatedReadingTime: number
  daysSincePublished: number | null
}

// Schema Mongoose pour les articles
const articleSchema = new Schema<IArticle>(
  {
    title: {
      type: String,
      required: [true, 'Le titre est obligatoire'],
      trim: true,
      minlength: [3, 'Le titre doit contenir au moins 3 caractères'],
      maxlength: [200, 'Le titre ne peut dépasser 200 caractères'],
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
    excerpt: {
      type: String,
      required: [true, 'L\'extrait est obligatoire'],
      trim: true,
      maxlength: [500, 'L\'extrait ne peut dépasser 500 caractères'],
    },
    content: {
      type: String,
      required: [true, 'Le contenu est obligatoire'],
      minlength: [50, 'Le contenu doit contenir au moins 50 caractères'],
    },
    coverImage: {
      type: String,
      trim: true,
      validate: {
        validator: function (value: string) {
          return !value || /^(https?:\/\/|\/|data:image\/)/.test(value)
        },
        message: 'Format d\'image invalide',
      },
    },
    gallery: [
      {
        type: String,
        trim: true,
        validate: {
          validator: function (value: string) {
            return /^(https?:\/\/|\/|data:image\/)/.test(value)
          },
          message: 'Format d\'image invalide',
        },
      },
    ],
    status: {
      type: String,
      enum: {
        values: ['draft', 'published', 'archived'],
        message: 'Statut invalide',
      },
      required: [true, 'Le statut est obligatoire'],
      default: 'draft',
      index: true,
    },
    contentType: {
      type: String,
      enum: {
        values: ['article', 'news', 'tutorial', 'announcement'],
        message: 'Type de contenu invalide',
      },
      required: [true, 'Le type de contenu est obligatoire'],
      default: 'article',
      index: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'L\'auteur est obligatoire'],
      index: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'La catégorie est obligatoire'],
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
        maxlength: [50, 'Un tag ne peut dépasser 50 caractères'],
        validate: {
          validator: function (value: string) {
            return /^[a-zA-Z0-9\s-àáâãäåæçèéêëìíîïñòóôõöøùúûüýÿ]+$/.test(value)
          },
          message: 'Format de tag invalide',
        },
      },
    ],
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    allowComments: {
      type: Boolean,
      default: true,
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
      ogTitle: {
        type: String,
        trim: true,
        maxlength: [60, 'Le titre Open Graph ne peut dépasser 60 caractères'],
      },
      ogDescription: {
        type: String,
        trim: true,
        maxlength: [160, 'La description Open Graph ne peut dépasser 160 caractères'],
      },
      ogImage: {
        type: String,
        trim: true,
        validate: {
          validator: function (value: string) {
            return !value || /^(https?:\/\/|\/|data:image\/)/.test(value)
          },
          message: 'Format d\'image Open Graph invalide',
        },
      },
      twitterTitle: {
        type: String,
        trim: true,
        maxlength: [70, 'Le titre Twitter ne peut dépasser 70 caractères'],
      },
      twitterDescription: {
        type: String,
        trim: true,
        maxlength: [200, 'La description Twitter ne peut dépasser 200 caractères'],
      },
      twitterImage: {
        type: String,
        trim: true,
        validate: {
          validator: function (value: string) {
            return !value || /^(https?:\/\/|\/|data:image\/)/.test(value)
          },
          message: 'Format d\'image Twitter invalide',
        },
      },
      canonicalUrl: {
        type: String,
        trim: true,
        validate: {
          validator: function (value: string) {
            return !value || /^https?:\/\/.+/.test(value)
          },
          message: 'Format d\'URL canonique invalide',
        },
      },
      robots: {
        type: String,
        trim: true,
        default: 'index,follow',
      },
    },
    stats: {
      views: { type: Number, default: 0, min: 0 },
      likes: { type: Number, default: 0, min: 0 },
      shares: { type: Number, default: 0, min: 0 },
      comments: { type: Number, default: 0, min: 0 },
      readingTime: { type: Number, default: 0, min: 0 },
      lastViewed: { type: Date, default: null },
    },
    publishedAt: {
      type: Date,
      default: null,
      index: true,
    },
    archivedAt: {
      type: Date,
      default: null,
    },
    lastEditedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    version: {
      type: Number,
      default: 1,
      min: 1,
    },
    revisions: [
      {
        version: { type: Number, required: true },
        content: { type: String, required: true },
        editedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        editedAt: { type: Date, required: true, default: Date.now },
        changeNote: { type: String, trim: true },
      },
    ],
    scheduledPublishAt: {
      type: Date,
      default: null,
      index: true,
    },
    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        // Optimiser l'output JSON
        delete ret.__v
        return ret
      },
    },
    toObject: { virtuals: true },
  }
)

// Index composites pour les requêtes fréquentes
articleSchema.index({ status: 1, publishedAt: -1 }, { name: 'status_published' })
articleSchema.index({ author: 1, status: 1, createdAt: -1 }, { name: 'author_status_created' })
articleSchema.index({ category: 1, status: 1, publishedAt: -1 }, { name: 'category_status_published' })
articleSchema.index({ featured: 1, status: 1, publishedAt: -1 }, { name: 'featured_status_published' })
articleSchema.index({ contentType: 1, status: 1, publishedAt: -1 }, { name: 'type_status_published' })
articleSchema.index({ 'stats.views': -1, status: 1 }, { name: 'popular_articles' })
articleSchema.index({ scheduledPublishAt: 1 }, { name: 'scheduled_publish' })
articleSchema.index({ expiresAt: 1 }, { name: 'article_expiration' })

// Index de texte pour la recherche full-text
articleSchema.index(
  {
    title: 'text',
    excerpt: 'text',
    content: 'text',
    tags: 'text',
  },
  {
    name: 'article_text_search',
    weights: {
      title: 10,
      excerpt: 5,
      tags: 3,
      content: 1,
    },
  }
)

// Index sparse pour les tags
articleSchema.index({ tags: 1 }, { name: 'tags_index', sparse: true })

// Index TTL pour supprimer automatiquement les articles expirés
articleSchema.index(
  { expiresAt: 1 },
  {
    name: 'article_ttl',
    expireAfterSeconds: 0,
    partialFilterExpression: { expiresAt: { $exists: true } },
  }
)

// Propriétés virtuelles
articleSchema.virtual('isPublished').get(function (this: IArticle) {
  return this.status === 'published' && (!this.scheduledPublishAt || this.scheduledPublishAt <= new Date())
})

articleSchema.virtual('isScheduled').get(function (this: IArticle) {
  return this.status === 'published' && this.scheduledPublishAt && this.scheduledPublishAt > new Date()
})

articleSchema.virtual('isExpired').get(function (this: IArticle) {
  return this.expiresAt && this.expiresAt <= new Date()
})

articleSchema.virtual('fullUrl').get(function (this: IArticle) {
  return `/blog/${this.slug}`
})

articleSchema.virtual('estimatedReadingTime').get(function (this: IArticle) {
  if (this.stats.readingTime > 0) return this.stats.readingTime
  // Calcul approximatif : 200 mots par minute
  const wordCount = this.content.split(/\s+/).length
  return Math.ceil(wordCount / 200)
})

articleSchema.virtual('daysSincePublished').get(function (this: IArticle) {
  if (!this.publishedAt) return null
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - this.publishedAt.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
})

// Méthodes d'instance
articleSchema.methods.incrementViews = function (this: IArticle) {
  this.stats.views += 1
  this.stats.lastViewed = new Date()
  return this.save()
}

articleSchema.methods.incrementLikes = function (this: IArticle) {
  this.stats.likes += 1
  return this.save()
}

articleSchema.methods.incrementShares = function (this: IArticle) {
  this.stats.shares += 1
  return this.save()
}

articleSchema.methods.publish = function (this: IArticle, publishedBy?: ObjectId) {
  this.status = 'published'
  this.publishedAt = new Date()
  if (publishedBy) this.lastEditedBy = publishedBy
  return this.save()
}

articleSchema.methods.archive = function (this: IArticle, archivedBy?: ObjectId) {
  this.status = 'archived'
  this.archivedAt = new Date()
  if (archivedBy) this.lastEditedBy = archivedBy
  return this.save()
}

articleSchema.methods.createRevision = function (
  this: IArticle,
  newContent: string,
  editedBy: ObjectId,
  changeNote?: string
) {
  // Sauvegarder l'ancienne version
  if (!this.revisions) this.revisions = []
  
  this.revisions.push({
    version: this.version,
    content: this.content,
    editedBy: this.lastEditedBy || this.author,
    editedAt: this.updatedAt || new Date(),
    changeNote,
  })

  // Mettre à jour avec le nouveau contenu
  this.content = newContent
  this.version += 1
  this.lastEditedBy = editedBy

  // Garder seulement les 20 dernières révisions
  if (this.revisions.length > 20) {
    this.revisions = this.revisions.slice(-20)
  }

  return this.save()
}

// Méthodes statiques
articleSchema.statics.findPublished = function (limit: number = 10) {
  return this.find({
    status: 'published',
    $or: [
      { scheduledPublishAt: { $lte: new Date() } },
      { scheduledPublishAt: { $exists: false } },
    ],
    $or: [
      { expiresAt: { $gt: new Date() } },
      { expiresAt: { $exists: false } },
    ],
  })
    .populate('author', 'firstName lastName email image')
    .populate('category', 'name slug color')
    .sort({ publishedAt: -1 })
    .limit(limit)
}

articleSchema.statics.findBySlug = function (slug: string) {
  return this.findOne({ slug })
    .populate('author', 'firstName lastName email image bio')
    .populate('category', 'name slug color icon description')
}

articleSchema.statics.findByCategory = function (categoryId: string, limit: number = 10) {
  return this.find({
    category: categoryId,
    status: 'published',
    $or: [
      { scheduledPublishAt: { $lte: new Date() } },
      { scheduledPublishAt: { $exists: false } },
    ],
  })
    .populate('author', 'firstName lastName email image')
    .sort({ publishedAt: -1 })
    .limit(limit)
}

articleSchema.statics.findByTags = function (tags: string[], limit: number = 10) {
  return this.find({
    tags: { $in: tags },
    status: 'published',
  })
    .populate('author', 'firstName lastName email image')
    .populate('category', 'name slug color')
    .sort({ publishedAt: -1 })
    .limit(limit)
}

articleSchema.statics.searchArticles = function (
  searchTerm: string,
  filters: {
    category?: string
    author?: string
    tags?: string[]
    contentType?: ContentType
    status?: ArticleStatus
  } = {},
  limit: number = 20
) {
  const query: any = {
    $text: { $search: searchTerm },
  }

  // Appliquer les filtres
  if (filters.category) query.category = filters.category
  if (filters.author) query.author = filters.author
  if (filters.tags && filters.tags.length > 0) query.tags = { $in: filters.tags }
  if (filters.contentType) query.contentType = filters.contentType
  if (filters.status) query.status = filters.status

  return this.find(query, { score: { $meta: 'textScore' } })
    .populate('author', 'firstName lastName email image')
    .populate('category', 'name slug color')
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit)
}

articleSchema.statics.findFeatured = function (limit: number = 5) {
  return this.find({
    featured: true,
    status: 'published',
    $or: [
      { scheduledPublishAt: { $lte: new Date() } },
      { scheduledPublishAt: { $exists: false } },
    ],
  })
    .populate('author', 'firstName lastName email image')
    .populate('category', 'name slug color')
    .sort({ publishedAt: -1 })
    .limit(limit)
}

articleSchema.statics.findMostViewed = function (days: number = 7, limit: number = 10) {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  return this.find({
    status: 'published',
    publishedAt: { $gte: cutoff },
  })
    .populate('author', 'firstName lastName email image')
    .populate('category', 'name slug color')
    .sort({ 'stats.views': -1 })
    .limit(limit)
}

articleSchema.statics.findScheduledToPublish = function () {
  return this.find({
    status: 'published',
    scheduledPublishAt: { $lte: new Date() },
  })
}

// Middleware pre-save pour générer le slug automatiquement
articleSchema.pre('save', function (next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .substring(0, 100)
  }
  next()
})

// Middleware pre-save pour calculer le temps de lecture
articleSchema.pre('save', function (next) {
  if (this.isModified('content')) {
    const wordCount = this.content.split(/\s+/).length
    this.stats.readingTime = Math.ceil(wordCount / 200)
  }
  next()
})

// Middleware pre-save pour gérer les métadonnées SEO automatiques
articleSchema.pre('save', function (next) {
  if (this.isModified('title') || this.isModified('excerpt')) {
    if (!this.seoMetadata.title) {
      this.seoMetadata.title = this.title.substring(0, 60)
    }
    if (!this.seoMetadata.description) {
      this.seoMetadata.description = this.excerpt.substring(0, 160)
    }
    if (!this.seoMetadata.ogTitle) {
      this.seoMetadata.ogTitle = this.title.substring(0, 60)
    }
    if (!this.seoMetadata.ogDescription) {
      this.seoMetadata.ogDescription = this.excerpt.substring(0, 160)
    }
    if (!this.seoMetadata.twitterTitle) {
      this.seoMetadata.twitterTitle = this.title.substring(0, 70)
    }
    if (!this.seoMetadata.twitterDescription) {
      this.seoMetadata.twitterDescription = this.excerpt.substring(0, 200)
    }
  }
  next()
})

// Middleware post-save pour gérer la publication automatique
articleSchema.post('save', function (this: IArticle) {
  if (this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date()
    this.save()
  }
})

// Interface pour les méthodes statiques
interface ArticleStaticMethods {
  findPublished(limit?: number): Promise<IArticle[]>
  findBySlug(slug: string): Promise<IArticle | null>
  findByCategory(categoryId: string, limit?: number): Promise<IArticle[]>
  findByTags(tags: string[], limit?: number): Promise<IArticle[]>
  searchArticles(
    searchTerm: string,
    filters?: {
      category?: string
      author?: string
      tags?: string[]
      contentType?: ContentType
      status?: ArticleStatus
    },
    limit?: number
  ): Promise<IArticle[]>
  findFeatured(limit?: number): Promise<IArticle[]>
  findMostViewed(days?: number, limit?: number): Promise<IArticle[]>
  findScheduledToPublish(): Promise<IArticle[]>
}

// Exporter le modèle
export const Article = models.Article || model<IArticle, {}, {}, {}, any, ArticleStaticMethods>('Article', articleSchema)

// Export par défaut
export default Article