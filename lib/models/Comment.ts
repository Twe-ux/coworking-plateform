import { Document, Schema, model, models } from 'mongoose'
import { ObjectId } from 'mongodb'

// Types pour le système de commentaires
type CommentStatus = 'pending' | 'approved' | 'rejected' | 'spam'
type CommentType = 'comment' | 'reply'

// Interface principale pour le document Comment
export interface IComment extends Document {
  _id: ObjectId
  content: string
  author: ObjectId // Référence vers User
  authorName: string // Nom affiché pour l'auteur
  authorEmail: string // Email de l'auteur
  authorWebsite?: string // Site web de l'auteur (optionnel)
  authorAvatar?: string // Avatar de l'auteur
  article: ObjectId // Référence vers Article
  parentComment?: ObjectId // Référence vers Comment (pour les réponses)
  type: CommentType
  status: CommentStatus
  ipAddress: string
  userAgent: string
  isVerified: boolean // Si l'email de l'auteur est vérifié
  likes: number
  dislikes: number
  reports: Array<{
    reportedBy: ObjectId
    reason: string
    reportedAt: Date
  }>
  moderatedBy?: ObjectId // Référence vers User (modérateur)
  moderatedAt?: Date
  moderationNote?: string
  isEdited: boolean
  editedAt?: Date
  originalContent?: string // Contenu original avant édition
  metadata: {
    mentions: string[] // @username mentions dans le commentaire
    hashtags: string[] // #hashtag dans le commentaire
    links: string[] // Liens détectés dans le commentaire
  }
  createdAt: Date
  updatedAt: Date
  // Virtual properties
  hasReplies: boolean
  replyCount: number
  isReply: boolean
  likesRatio: number
  daysSincePosted: number
  isRecent: boolean
  // Methods
  extractMetadata(): void
}

// Schema Mongoose pour les commentaires
const commentSchema = new Schema<IComment>(
  {
    content: {
      type: String,
      required: [true, 'Le contenu du commentaire est obligatoire'],
      trim: true,
      minlength: [1, 'Le commentaire ne peut être vide'],
      maxlength: [2000, 'Le commentaire ne peut dépasser 2000 caractères'],
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'L\'auteur est obligatoire'],
      index: true,
    },
    authorName: {
      type: String,
      required: [true, 'Le nom de l\'auteur est obligatoire'],
      trim: true,
      minlength: [1, 'Le nom ne peut être vide'],
      maxlength: [100, 'Le nom ne peut dépasser 100 caractères'],
    },
    authorEmail: {
      type: String,
      required: [true, 'L\'email de l\'auteur est obligatoire'],
      trim: true,
      lowercase: true,
      index: true,
      validate: {
        validator: function (value: string) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        },
        message: 'Format d\'adresse email invalide',
      },
    },
    authorWebsite: {
      type: String,
      trim: true,
      validate: {
        validator: function (value: string) {
          return !value || /^https?:\/\/.+/.test(value)
        },
        message: 'Format d\'URL invalide',
      },
    },
    authorAvatar: {
      type: String,
      trim: true,
      validate: {
        validator: function (value: string) {
          return !value || /^(https?:\/\/|\/|data:image\/)/.test(value)
        },
        message: 'Format d\'avatar invalide',
      },
    },
    article: {
      type: Schema.Types.ObjectId,
      ref: 'Article',
      required: [true, 'L\'article est obligatoire'],
      index: true,
    },
    parentComment: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: ['comment', 'reply'],
        message: 'Type de commentaire invalide',
      },
      required: [true, 'Le type de commentaire est obligatoire'],
      default: 'comment',
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'approved', 'rejected', 'spam'],
        message: 'Statut invalide',
      },
      required: [true, 'Le statut est obligatoire'],
      default: 'pending',
      index: true,
    },
    ipAddress: {
      type: String,
      required: [true, 'L\'adresse IP est obligatoire'],
      validate: {
        validator: function (value: string) {
          // Valider IPv4 et IPv6
          const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
          const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
          return ipv4Regex.test(value) || ipv6Regex.test(value)
        },
        message: 'Format d\'adresse IP invalide',
      },
    },
    userAgent: {
      type: String,
      required: [true, 'Le user agent est obligatoire'],
      maxlength: [1000, 'Le user agent ne peut dépasser 1000 caractères'],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    likes: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },
    dislikes: {
      type: Number,
      default: 0,
      min: 0,
    },
    reports: [
      {
        reportedBy: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        reason: {
          type: String,
          required: true,
          enum: ['spam', 'harassment', 'inappropriate', 'fake', 'other'],
        },
        reportedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    moderatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    moderatedAt: {
      type: Date,
      default: null,
    },
    moderationNote: {
      type: String,
      trim: true,
      maxlength: [500, 'La note de modération ne peut dépasser 500 caractères'],
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
      default: null,
    },
    originalContent: {
      type: String,
      default: null,
    },
    metadata: {
      mentions: [
        {
          type: String,
          trim: true,
          lowercase: true,
        },
      ],
      hashtags: [
        {
          type: String,
          trim: true,
          lowercase: true,
        },
      ],
      links: [
        {
          type: String,
          trim: true,
        },
      ],
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc: any, ret: any) {
        // Masquer les informations sensibles
        if (ret.ipAddress) delete ret.ipAddress
        if (ret.userAgent) delete ret.userAgent
        if (ret.__v) delete ret.__v
        return ret
      },
    },
    toObject: { virtuals: true },
  }
)

// Index composites pour les requêtes fréquentes
commentSchema.index({ article: 1, status: 1, createdAt: -1 }, { name: 'article_status_created' })
commentSchema.index({ parentComment: 1, status: 1, createdAt: 1 }, { name: 'parent_status_created' })
commentSchema.index({ author: 1, status: 1, createdAt: -1 }, { name: 'author_status_created' })
commentSchema.index({ status: 1, createdAt: -1 }, { name: 'status_created' })
commentSchema.index({ status: 1, likes: -1 }, { name: 'status_likes' })
commentSchema.index({ authorEmail: 1, status: 1 }, { name: 'email_status' })
commentSchema.index({ ipAddress: 1, createdAt: -1 }, { name: 'ip_created' })

// Index de texte pour la recherche
commentSchema.index(
  {
    content: 'text',
    authorName: 'text',
  },
  {
    name: 'comment_text_search',
    weights: {
      content: 10,
      authorName: 5,
    },
  }
)

// Index pour les commentaires en attente de modération
commentSchema.index(
  { status: 1, createdAt: 1 },
  {
    name: 'pending_moderation',
    partialFilterExpression: { status: 'pending' },
  }
)

// Index TTL pour supprimer automatiquement les commentaires rejetés après 30 jours
commentSchema.index(
  { moderatedAt: 1 },
  {
    name: 'rejected_comments_ttl',
    expireAfterSeconds: 30 * 24 * 60 * 60, // 30 jours
    partialFilterExpression: { status: 'rejected' },
  }
)

// Propriétés virtuelles
commentSchema.virtual('hasReplies').get(function (this: IComment) {
  return this.replyCount > 0
})

commentSchema.virtual('replyCount').get(function (this: IComment) {
  // Cette propriété sera calculée dynamiquement via une requête
  return 0 // Placeholder
})

commentSchema.virtual('isReply').get(function (this: IComment) {
  return !!this.parentComment
})

commentSchema.virtual('likesRatio').get(function (this: IComment) {
  const total = this.likes + this.dislikes
  return total > 0 ? this.likes / total : 0
})

commentSchema.virtual('daysSincePosted').get(function (this: IComment) {
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - this.createdAt.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
})

commentSchema.virtual('isRecent').get(function (this: IComment) {
  return this.daysSincePosted <= 7 // Récent si posté il y a moins d'une semaine
})

// Méthodes d'instance
commentSchema.methods.approve = function (this: IComment, moderatedBy: ObjectId, note?: string) {
  this.status = 'approved'
  this.moderatedBy = moderatedBy
  this.moderatedAt = new Date()
  if (note) this.moderationNote = note
  return this.save()
}

commentSchema.methods.reject = function (this: IComment, moderatedBy: ObjectId, note?: string) {
  this.status = 'rejected'
  this.moderatedBy = moderatedBy
  this.moderatedAt = new Date()
  if (note) this.moderationNote = note
  return this.save()
}

commentSchema.methods.markAsSpam = function (this: IComment, moderatedBy: ObjectId, note?: string) {
  this.status = 'spam'
  this.moderatedBy = moderatedBy
  this.moderatedAt = new Date()
  if (note) this.moderationNote = note
  return this.save()
}

commentSchema.methods.addLike = function (this: IComment) {
  this.likes += 1
  return this.save()
}

commentSchema.methods.removeLike = function (this: IComment) {
  if (this.likes > 0) {
    this.likes -= 1
  }
  return this.save()
}

commentSchema.methods.addDislike = function (this: IComment) {
  this.dislikes += 1
  return this.save()
}

commentSchema.methods.removeDislike = function (this: IComment) {
  if (this.dislikes > 0) {
    this.dislikes -= 1
  }
  return this.save()
}

commentSchema.methods.addReport = function (
  this: IComment,
  reportedBy: ObjectId,
  reason: string
) {
  // Vérifier si l'utilisateur a déjà signalé ce commentaire
  const existingReport = this.reports.find(
    report => report.reportedBy.toString() === reportedBy.toString()
  )
  
  if (!existingReport) {
    this.reports.push({
      reportedBy,
      reason,
      reportedAt: new Date(),
    })
    
    // Marquer automatiquement comme spam si plus de 3 signalements
    if (this.reports.length >= 3 && this.status !== 'spam') {
      this.status = 'spam'
      this.moderatedAt = new Date()
      this.moderationNote = 'Marqué automatiquement comme spam suite à plusieurs signalements'
    }
  }
  
  return this.save()
}

commentSchema.methods.editContent = function (this: IComment, newContent: string) {
  if (!this.isEdited) {
    this.originalContent = this.content
    this.isEdited = true
  }
  this.content = newContent
  this.editedAt = new Date()
  
  // Réanalyser les métadonnées
  this.extractMetadata()
  
  return this.save()
}

commentSchema.methods.extractMetadata = function (this: IComment) {
  const content = this.content

  // Extraire les mentions (@username)
  const mentions = content.match(/@([a-zA-Z0-9_]+)/g) || []
  this.metadata.mentions = mentions.map(mention => mention.substring(1).toLowerCase())

  // Extraire les hashtags (#hashtag)
  const hashtags = content.match(/#([a-zA-Z0-9_]+)/g) || []
  this.metadata.hashtags = hashtags.map(hashtag => hashtag.substring(1).toLowerCase())

  // Extraire les liens
  const linkRegex = /(https?:\/\/[^\s]+)/g
  const links = content.match(linkRegex) || []
  this.metadata.links = links
}

commentSchema.methods.getReplyCount = async function (this: IComment) {
  return await (this.constructor as any).countDocuments({
    parentComment: this._id,
    status: 'approved',
  })
}

commentSchema.methods.getReplies = async function (this: IComment, limit: number = 10) {
  return await (this.constructor as any)
    .find({
      parentComment: this._id,
      status: 'approved',
    })
    .populate('author', 'firstName lastName image')
    .sort({ createdAt: 1 })
    .limit(limit)
}

// Méthodes statiques
commentSchema.statics.findByArticle = function (
  articleId: string,
  status: CommentStatus = 'approved',
  limit: number = 50
) {
  return this.find({
    article: articleId,
    status,
    parentComment: { $exists: false }, // Seulement les commentaires de niveau supérieur
  })
    .populate('author', 'firstName lastName image')
    .sort({ createdAt: -1 })
    .limit(limit)
}

commentSchema.statics.findPendingModeration = function (limit: number = 50) {
  return this.find({ status: 'pending' })
    .populate('author', 'firstName lastName email')
    .populate('article', 'title slug')
    .sort({ createdAt: 1 })
    .limit(limit)
}

commentSchema.statics.findByAuthor = function (
  authorId: string,
  status?: CommentStatus,
  limit: number = 20
) {
  const query: any = { author: authorId }
  if (status) query.status = status

  return this.find(query)
    .populate('article', 'title slug')
    .sort({ createdAt: -1 })
    .limit(limit)
}

commentSchema.statics.findByEmail = function (
  email: string,
  status?: CommentStatus,
  limit: number = 20
) {
  const query: any = { authorEmail: email.toLowerCase() }
  if (status) query.status = status

  return this.find(query)
    .populate('article', 'title slug')
    .sort({ createdAt: -1 })
    .limit(limit)
}

commentSchema.statics.searchComments = function (
  searchTerm: string,
  filters: {
    status?: CommentStatus
    article?: string
    author?: string
    startDate?: Date
    endDate?: Date
  } = {},
  limit: number = 20
) {
  const query: any = {
    $text: { $search: searchTerm },
  }

  // Appliquer les filtres
  if (filters.status) query.status = filters.status
  if (filters.article) query.article = filters.article
  if (filters.author) query.author = filters.author
  if (filters.startDate || filters.endDate) {
    query.createdAt = {}
    if (filters.startDate) query.createdAt.$gte = filters.startDate
    if (filters.endDate) query.createdAt.$lte = filters.endDate
  }

  return this.find(query, { score: { $meta: 'textScore' } })
    .populate('author', 'firstName lastName image')
    .populate('article', 'title slug')
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit)
}

commentSchema.statics.findMostLiked = function (
  articleId?: string,
  days: number = 7,
  limit: number = 10
) {
  const query: any = {
    status: 'approved',
    likes: { $gt: 0 },
  }

  if (articleId) query.article = articleId

  if (days > 0) {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    query.createdAt = { $gte: cutoff }
  }

  return this.find(query)
    .populate('author', 'firstName lastName image')
    .populate('article', 'title slug')
    .sort({ likes: -1, createdAt: -1 })
    .limit(limit)
}

commentSchema.statics.findRecentActivity = function (
  authorId?: string,
  limit: number = 10
) {
  const query: any = { status: 'approved' }
  if (authorId) query.author = authorId

  return this.find(query)
    .populate('author', 'firstName lastName image')
    .populate('article', 'title slug')
    .sort({ createdAt: -1 })
    .limit(limit)
}

commentSchema.statics.findSuspiciousComments = function (limit: number = 20) {
  return this.find({
    $or: [
      { 'reports.0': { $exists: true } }, // A au moins un signalement
      { likes: 0, dislikes: { $gte: 3 } }, // Beaucoup de dislikes, aucun like
      { 'metadata.links.0': { $exists: true } }, // Contient des liens
    ],
    status: { $ne: 'spam' },
  })
    .populate('author', 'firstName lastName email')
    .populate('article', 'title slug')
    .sort({ 'reports.length': -1, createdAt: 1 })
    .limit(limit)
}

commentSchema.statics.getCommentStats = async function (articleId?: string) {
  const matchStage: any = {}
  if (articleId) matchStage.article = new ObjectId(articleId)

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalLikes: { $sum: '$likes' },
        totalDislikes: { $sum: '$dislikes' },
      },
    },
  ])

  return stats.reduce((acc: any, stat: any) => {
    acc[stat._id] = {
      count: stat.count,
      totalLikes: stat.totalLikes,
      totalDislikes: stat.totalDislikes,
    }
    return acc
  }, {})
}

// Middleware pre-save pour extraire les métadonnées
commentSchema.pre('save', function (next) {
  if (this.isModified('content')) {
    this.extractMetadata()
  }
  next()
})

// Middleware pre-save pour définir le type automatiquement
commentSchema.pre('save', function (next) {
  this.type = this.parentComment ? 'reply' : 'comment'
  next()
})

// Middleware post-save pour mettre à jour les statistiques d'article
commentSchema.post('save', async function (this: IComment) {
  if (this.status === 'approved') {
    const Article = models.Article
    if (Article) {
      await Article.updateOne(
        { _id: this.article },
        { $inc: { 'stats.comments': 1 } }
      )
    }
  }
})

// Middleware pre-remove pour mettre à jour les statistiques
commentSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  if (this.status === 'approved') {
    const Article = models.Article
    if (Article) {
      await Article.updateOne(
        { _id: this.article },
        { $inc: { 'stats.comments': -1 } }
      )
    }
  }

  // Supprimer également les réponses
  await (this.constructor as any).deleteMany({ parentComment: this._id })
  
  next()
})

// Exporter le modèle
export const Comment = models.Comment || model<IComment>('Comment', commentSchema)

// Export par défaut
export default Comment