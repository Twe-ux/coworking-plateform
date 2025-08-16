import mongoose, { Document, Schema, Types } from 'mongoose'

export interface IMessage extends Document {
  _id: Types.ObjectId
  content: string
  encryptedContent?: string
  messageType: 'text' | 'image' | 'file' | 'system' | 'ai_response'
  sender: Types.ObjectId
  channel: Types.ObjectId
  parentMessage?: Types.ObjectId // Pour les réponses
  editedAt?: Date
  deletedAt?: Date
  isDeleted: boolean
  isEdited: boolean
  reactions: {
    emoji: string
    users: Types.ObjectId[]
    count: number
  }[]
  attachments: {
    url: string
    type: 'image' | 'file'
    filename: string
    size: number
    mimeType: string
  }[]
  mentions: Types.ObjectId[]
  readBy: {
    user: Types.ObjectId
    readAt: Date
  }[]
  metadata: {
    ipAddress?: string
    userAgent?: string
    isFromAI?: boolean
    aiModel?: string
    processingTime?: number
  }
  createdAt: Date
  updatedAt: Date
}

const MessageSchema = new Schema<IMessage>({
  content: {
    type: String,
    required: true,
    maxlength: 10000,
    trim: true
  },
  encryptedContent: {
    type: String,
    select: false // Ne pas inclure par défaut
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'system', 'ai_response'],
    default: 'text',
    required: true
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  channel: {
    type: Schema.Types.ObjectId,
    ref: 'Channel',
    required: true,
    index: true
  },
  parentMessage: {
    type: Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  editedAt: {
    type: Date,
    default: null
  },
  deletedAt: {
    type: Date,
    default: null
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  reactions: [{
    emoji: {
      type: String,
      required: true,
      maxlength: 10
    },
    users: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    count: {
      type: Number,
      default: 0,
      min: 0
    }
  }],
  attachments: [{
    url: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['image', 'file'],
      required: true
    },
    filename: {
      type: String,
      required: true,
      maxlength: 255
    },
    size: {
      type: Number,
      required: true,
      min: 0,
      max: 50 * 1024 * 1024 // 50MB max
    },
    mimeType: {
      type: String,
      required: true,
      maxlength: 100
    }
  }],
  mentions: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  readBy: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    readAt: {
      type: Date,
      required: true,
      default: Date.now
    }
  }],
  metadata: {
    ipAddress: {
      type: String,
      maxlength: 45 // IPv6 max length
    },
    userAgent: {
      type: String,
      maxlength: 500
    },
    isFromAI: {
      type: Boolean,
      default: false
    },
    aiModel: {
      type: String,
      maxlength: 100
    },
    processingTime: {
      type: Number,
      min: 0
    }
  }
}, {
  timestamps: true,
  collection: 'messages'
})

// Index composé pour les requêtes fréquentes
MessageSchema.index({ channel: 1, createdAt: -1 })
MessageSchema.index({ sender: 1, createdAt: -1 })
MessageSchema.index({ channel: 1, isDeleted: 1, createdAt: -1 })
MessageSchema.index({ mentions: 1, createdAt: -1 })
MessageSchema.index({ 'readBy.user': 1 })

// Index pour la recherche de texte
MessageSchema.index({ 
  content: 'text',
  'attachments.filename': 'text'
}, {
  weights: {
    content: 10,
    'attachments.filename': 5
  },
  name: 'message_search_index'
})

// Méthodes d'instance
MessageSchema.methods.markAsRead = function(userId: string) {
  const existingRead = this.readBy.find(
    (read: any) => read.user.toString() === userId
  )
  
  if (!existingRead) {
    this.readBy.push({
      user: userId,
      readAt: new Date()
    })
    return this.save()
  }
  
  return Promise.resolve(this)
}

MessageSchema.methods.addReaction = function(emoji: string, userId: string) {
  const existingReaction = this.reactions.find(
    (reaction: any) => reaction.emoji === emoji
  )
  
  if (existingReaction) {
    if (!existingReaction.users.includes(userId)) {
      existingReaction.users.push(userId)
      existingReaction.count = existingReaction.users.length
    }
  } else {
    this.reactions.push({
      emoji,
      users: [userId],
      count: 1
    })
  }
  
  return this.save()
}

MessageSchema.methods.removeReaction = function(emoji: string, userId: string) {
  const reactionIndex = this.reactions.findIndex(
    (reaction: any) => reaction.emoji === emoji
  )
  
  if (reactionIndex !== -1) {
    const reaction = this.reactions[reactionIndex]
    const userIndex = reaction.users.indexOf(userId)
    
    if (userIndex !== -1) {
      reaction.users.splice(userIndex, 1)
      reaction.count = reaction.users.length
      
      if (reaction.count === 0) {
        this.reactions.splice(reactionIndex, 1)
      }
    }
  }
  
  return this.save()
}

MessageSchema.methods.softDelete = function() {
  this.isDeleted = true
  this.deletedAt = new Date()
  this.content = '[Message supprimé]'
  return this.save()
}

MessageSchema.methods.edit = function(newContent: string) {
  this.content = newContent
  this.isEdited = true
  this.editedAt = new Date()
  return this.save()
}

// Méthodes statiques
MessageSchema.statics.findByChannel = function(
  channelId: string,
  options: {
    limit?: number
    skip?: number
    before?: Date
    after?: Date
    includeDeleted?: boolean
  } = {}
) {
  const {
    limit = 50,
    skip = 0,
    before,
    after,
    includeDeleted = false
  } = options

  let query: any = { channel: channelId }
  
  if (!includeDeleted) {
    query.isDeleted = false
  }
  
  if (before) {
    query.createdAt = { ...query.createdAt, $lt: before }
  }
  
  if (after) {
    query.createdAt = { ...query.createdAt, $gt: after }
  }

  return this.find(query)
    .populate('sender', 'name email avatar role')
    .populate('mentions', 'name email')
    .populate({
      path: 'parentMessage',
      populate: {
        path: 'sender',
        select: 'name email avatar'
      }
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean()
}

MessageSchema.statics.searchMessages = function(
  query: string,
  channelIds: string[],
  options: {
    limit?: number
    skip?: number
  } = {}
) {
  const { limit = 20, skip = 0 } = options
  
  return this.find({
    $text: { $search: query },
    channel: { $in: channelIds },
    isDeleted: false
  })
    .populate('sender', 'name email avatar')
    .populate('channel', 'name type')
    .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean()
}

MessageSchema.statics.getUnreadCount = function(userId: string, channelId: string) {
  return this.countDocuments({
    channel: channelId,
    isDeleted: false,
    'readBy.user': { $ne: userId },
    sender: { $ne: userId }
  })
}

MessageSchema.statics.getMessageStats = function(channelId: string, dateRange?: { from: Date, to: Date }) {
  const matchCondition: any = {
    channel: channelId,
    isDeleted: false
  }

  if (dateRange) {
    matchCondition.createdAt = {
      $gte: dateRange.from,
      $lte: dateRange.to
    }
  }

  return this.aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: null,
        totalMessages: { $sum: 1 },
        uniqueSenders: { $addToSet: '$sender' },
        messageTypes: {
          $push: '$messageType'
        },
        totalAttachments: {
          $sum: { $size: '$attachments' }
        },
        totalReactions: {
          $sum: {
            $reduce: {
              input: '$reactions',
              initialValue: 0,
              in: { $add: ['$$value', '$$this.count'] }
            }
          }
        }
      }
    },
    {
      $project: {
        totalMessages: 1,
        uniqueSendersCount: { $size: '$uniqueSenders' },
        totalAttachments: 1,
        totalReactions: 1,
        messageTypeBreakdown: {
          $reduce: {
            input: '$messageTypes',
            initialValue: {},
            in: {
              $mergeObjects: [
                '$$value',
                {
                  $arrayToObject: [
                    [{ k: '$$this', v: { $add: [{ $ifNull: [{ $getField: { field: '$$this', input: '$$value' } }, 0] }, 1] } }]
                  ]
                }
              ]
            }
          }
        }
      }
    }
  ])
}

// Pre-hooks
MessageSchema.pre('save', function(next) {
  // Extraire les mentions du contenu
  if (this.isModified('content')) {
    const mentionRegex = /@(\w+)/g
    const mentions = this.content.match(mentionRegex)
    if (mentions) {
      // TODO: Résoudre les noms d'utilisateur en IDs
      // this.mentions = await resolveUserMentions(mentions)
    }
  }
  
  next()
})

// Post-hooks
MessageSchema.post('save', function(doc) {
  // Ici on pourrait émettre des événements WebSocket
  // ou envoyer des notifications push
})

// Validation personnalisée
MessageSchema.path('attachments').validate(function(attachments: any[]) {
  return attachments.length <= 10 // Maximum 10 attachments par message
}, 'Maximum 10 attachments autorisés par message')

MessageSchema.path('reactions').validate(function(reactions: any[]) {
  return reactions.length <= 20 // Maximum 20 types de réactions différentes
}, 'Maximum 20 réactions différentes par message')

export const Message = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema)