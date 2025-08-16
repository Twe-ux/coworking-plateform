import mongoose, { Document, Schema, Types } from 'mongoose'

export interface IChannel extends Document {
  _id: Types.ObjectId
  name: string
  slug: string
  description?: string
  type: 'public' | 'private' | 'direct' | 'ai_assistant'
  avatar?: string
  isArchived: boolean
  isDeleted: boolean
  
  // Membres et permissions
  members: {
    user: Types.ObjectId
    role: 'owner' | 'admin' | 'moderator' | 'member'
    joinedAt: Date
    lastSeen?: Date
    isMuted: boolean
    permissions: {
      canWrite: boolean
      canAddMembers: boolean
      canDeleteMessages: boolean
      canModerate: boolean
    }
  }[]
  
  // Paramètres du channel
  settings: {
    allowFileUploads: boolean
    allowReactions: boolean
    allowThreads: boolean
    maxMembers: number
    messageRetentionDays: number
    requireApprovalToJoin: boolean
    allowGuestAccess: boolean
    slowModeSeconds: number
  }
  
  // Modération
  moderation: {
    autoModeration: boolean
    bannedWords: string[]
    allowedFileTypes: string[]
    maxFileSize: number
    requireMessageApproval: boolean
  }
  
  // Statistiques
  stats: {
    totalMessages: number
    totalMembers: number
    lastActivity: Date
    createdMessages24h: number
    activeMembers24h: number
  }
  
  // Pour les channels IA
  aiSettings?: {
    provider: 'openai' | 'anthropic' | 'local'
    model: string
    apiKey?: string
    systemPrompt?: string
    maxTokens: number
    temperature: number
    isEnabled: boolean
    rateLimitPerUser: {
      requestsPerHour: number
      requestsPerDay: number
    }
  }
  
  // Métadonnées
  metadata: {
    ipRestriction?: {
      allowedIPs: string[]
      isEnabled: boolean
    }
    integrations: {
      webhookUrl?: string
      slackChannelId?: string
      discordChannelId?: string
    }
  }
  
  // Audit
  auditLog: {
    action: string
    performedBy: Types.ObjectId
    timestamp: Date
    details: any
  }[]
  
  createdBy: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const ChannelSchema = new Schema<IChannel>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
    minlength: 1
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[a-z0-9-]+$/,
    maxlength: 50
  },
  description: {
    type: String,
    maxlength: 500,
    trim: true
  },
  type: {
    type: String,
    enum: ['public', 'private', 'direct', 'ai_assistant'],
    required: true,
    index: true
  },
  avatar: {
    type: String,
    default: null
  },
  isArchived: {
    type: Boolean,
    default: false,
    index: true
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  
  members: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'moderator', 'member'],
      default: 'member',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now,
      required: true
    },
    lastSeen: {
      type: Date,
      default: null
    },
    isMuted: {
      type: Boolean,
      default: false
    },
    permissions: {
      canWrite: {
        type: Boolean,
        default: true
      },
      canAddMembers: {
        type: Boolean,
        default: false
      },
      canDeleteMessages: {
        type: Boolean,
        default: false
      },
      canModerate: {
        type: Boolean,
        default: false
      }
    }
  }],
  
  settings: {
    allowFileUploads: {
      type: Boolean,
      default: true
    },
    allowReactions: {
      type: Boolean,
      default: true
    },
    allowThreads: {
      type: Boolean,
      default: true
    },
    maxMembers: {
      type: Number,
      default: 100,
      min: 1,
      max: 1000
    },
    messageRetentionDays: {
      type: Number,
      default: 0, // 0 = jamais supprimer
      min: 0,
      max: 365
    },
    requireApprovalToJoin: {
      type: Boolean,
      default: false
    },
    allowGuestAccess: {
      type: Boolean,
      default: false
    },
    slowModeSeconds: {
      type: Number,
      default: 0,
      min: 0,
      max: 3600
    }
  },
  
  moderation: {
    autoModeration: {
      type: Boolean,
      default: false
    },
    bannedWords: [{
      type: String,
      maxlength: 50
    }],
    allowedFileTypes: [{
      type: String,
      maxlength: 20
    }],
    maxFileSize: {
      type: Number,
      default: 10 * 1024 * 1024, // 10MB
      min: 0,
      max: 50 * 1024 * 1024 // 50MB
    },
    requireMessageApproval: {
      type: Boolean,
      default: false
    }
  },
  
  stats: {
    totalMessages: {
      type: Number,
      default: 0,
      min: 0
    },
    totalMembers: {
      type: Number,
      default: 0,
      min: 0
    },
    lastActivity: {
      type: Date,
      default: Date.now
    },
    createdMessages24h: {
      type: Number,
      default: 0,
      min: 0
    },
    activeMembers24h: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  
  aiSettings: {
    provider: {
      type: String,
      enum: ['openai', 'anthropic', 'local'],
      default: 'openai'
    },
    model: {
      type: String,
      default: 'gpt-3.5-turbo',
      maxlength: 100
    },
    apiKey: {
      type: String,
      select: false // Ne jamais inclure dans les requêtes normales
    },
    systemPrompt: {
      type: String,
      maxlength: 2000,
      default: 'Tu es un assistant IA utile dans un espace de coworking.'
    },
    maxTokens: {
      type: Number,
      default: 1000,
      min: 100,
      max: 4000
    },
    temperature: {
      type: Number,
      default: 0.7,
      min: 0,
      max: 2
    },
    isEnabled: {
      type: Boolean,
      default: false
    },
    rateLimitPerUser: {
      requestsPerHour: {
        type: Number,
        default: 20,
        min: 1,
        max: 100
      },
      requestsPerDay: {
        type: Number,
        default: 100,
        min: 1,
        max: 1000
      }
    }
  },
  
  metadata: {
    ipRestriction: {
      allowedIPs: [{
        type: String,
        validate: {
          validator: function(ip: string) {
            // Validation IP simple (IPv4 et IPv6)
            const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
            const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
            return ipv4Regex.test(ip) || ipv6Regex.test(ip)
          },
          message: 'Format d\'adresse IP invalide'
        }
      }],
      isEnabled: {
        type: Boolean,
        default: false
      }
    },
    integrations: {
      webhookUrl: {
        type: String,
        validate: {
          validator: function(url: string) {
            if (!url) return true
            try {
              new URL(url)
              return true
            } catch {
              return false
            }
          },
          message: 'URL de webhook invalide'
        }
      },
      slackChannelId: String,
      discordChannelId: String
    }
  },
  
  auditLog: [{
    action: {
      type: String,
      required: true,
      maxlength: 100
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true
    },
    details: Schema.Types.Mixed
  }],
  
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  }
}, {
  timestamps: true,
  collection: 'channels'
})

// Index composés
ChannelSchema.index({ type: 1, isDeleted: 1, isArchived: 1 })
ChannelSchema.index({ 'members.user': 1, isDeleted: 1 })
ChannelSchema.index({ createdBy: 1, createdAt: -1 })
ChannelSchema.index({ 'stats.lastActivity': -1 })

// Index pour la recherche
ChannelSchema.index({
  name: 'text',
  description: 'text'
}, {
  weights: {
    name: 10,
    description: 5
  },
  name: 'channel_search_index'
})

// Méthodes d'instance
ChannelSchema.methods.addMember = function(
  userId: string,
  role: 'owner' | 'admin' | 'moderator' | 'member' = 'member',
  permissions?: any
) {
  const existingMember = this.members.find(
    (member: any) => member.user.toString() === userId
  )
  
  if (existingMember) {
    throw new Error('L\'utilisateur est déjà membre de ce channel')
  }
  
  if (this.members.length >= this.settings.maxMembers) {
    throw new Error('Le channel a atteint sa capacité maximale')
  }
  
  const defaultPermissions = {
    canWrite: true,
    canAddMembers: role === 'admin' || role === 'owner',
    canDeleteMessages: role === 'admin' || role === 'owner' || role === 'moderator',
    canModerate: role === 'admin' || role === 'owner' || role === 'moderator'
  }
  
  this.members.push({
    user: userId,
    role,
    joinedAt: new Date(),
    isMuted: false,
    permissions: { ...defaultPermissions, ...permissions }
  })
  
  this.stats.totalMembers = this.members.length
  
  // Ajouter à l'audit log
  this.auditLog.push({
    action: 'member_added',
    performedBy: userId,
    timestamp: new Date(),
    details: { userId, role }
  })
  
  return this.save()
}

ChannelSchema.methods.removeMember = function(userId: string, removedBy: string) {
  const memberIndex = this.members.findIndex(
    (member: any) => member.user.toString() === userId
  )
  
  if (memberIndex === -1) {
    throw new Error('L\'utilisateur n\'est pas membre de ce channel')
  }
  
  this.members.splice(memberIndex, 1)
  this.stats.totalMembers = this.members.length
  
  // Ajouter à l'audit log
  this.auditLog.push({
    action: 'member_removed',
    performedBy: removedBy,
    timestamp: new Date(),
    details: { userId }
  })
  
  return this.save()
}

ChannelSchema.methods.updateMemberRole = function(
  userId: string,
  newRole: 'owner' | 'admin' | 'moderator' | 'member',
  updatedBy: string
) {
  const member = this.members.find(
    (member: any) => member.user.toString() === userId
  )
  
  if (!member) {
    throw new Error('L\'utilisateur n\'est pas membre de ce channel')
  }
  
  const oldRole = member.role
  member.role = newRole
  
  // Mettre à jour les permissions selon le rôle
  member.permissions = {
    canWrite: true,
    canAddMembers: newRole === 'admin' || newRole === 'owner',
    canDeleteMessages: newRole === 'admin' || newRole === 'owner' || newRole === 'moderator',
    canModerate: newRole === 'admin' || newRole === 'owner' || newRole === 'moderator'
  }
  
  // Ajouter à l'audit log
  this.auditLog.push({
    action: 'member_role_updated',
    performedBy: updatedBy,
    timestamp: new Date(),
    details: { userId, oldRole, newRole }
  })
  
  return this.save()
}

ChannelSchema.methods.updateLastSeen = function(userId: string) {
  const member = this.members.find(
    (member: any) => member.user.toString() === userId
  )
  
  if (member) {
    member.lastSeen = new Date()
    return this.save()
  }
  
  return Promise.resolve(this)
}

ChannelSchema.methods.canUserAccess = function(userId: string, userIP?: string) {
  // Vérifier si le channel est supprimé
  if (this.isDeleted) {
    return false
  }
  
  // Vérifier la restriction IP si activée
  if (this.metadata.ipRestriction?.isEnabled && userIP) {
    const allowedIPs = this.metadata.ipRestriction.allowedIPs
    if (allowedIPs.length > 0 && !allowedIPs.includes(userIP)) {
      return false
    }
  }
  
  // Vérifier si l'utilisateur est membre (sauf pour les channels publics)
  if (this.type !== 'public') {
    const isMember = this.members.some(
      (member: any) => member.user.toString() === userId
    )
    return isMember
  }
  
  return true
}

ChannelSchema.methods.getUnreadCountForUser = function(userId: string) {
  // Cette méthode sera appelée avec le modèle Message
  const Message = mongoose.models.Message
  if (!Message) return 0
  
  return Message.countDocuments({
    channel: this._id,
    isDeleted: false,
    'readBy.user': { $ne: userId },
    sender: { $ne: userId }
  })
}

// Méthodes statiques
ChannelSchema.statics.findByUser = function(
  userId: string,
  options: {
    includeArchived?: boolean
    type?: string[]
  } = {}
) {
  const { includeArchived = false, type } = options
  
  const query: any = {
    'members.user': userId,
    isDeleted: false
  }
  
  if (!includeArchived) {
    query.isArchived = false
  }
  
  if (type && type.length > 0) {
    query.type = { $in: type }
  }
  
  return this.find(query)
    .populate('members.user', 'name email avatar role')
    .sort({ 'stats.lastActivity': -1 })
    .lean()
}

ChannelSchema.statics.createDirectChannel = function(user1Id: string, user2Id: string) {
  // Vérifier si un channel direct existe déjà
  return this.findOne({
    type: 'direct',
    isDeleted: false,
    $and: [
      { 'members.user': user1Id },
      { 'members.user': user2Id }
    ]
  }).then((existingChannel: any) => {
    if (existingChannel) {
      return existingChannel
    }
    
    // Créer un nouveau channel direct
    const slug = `direct-${Date.now()}-${Math.random().toString(36).substring(7)}`
    
    return this.create({
      name: 'Discussion privée',
      slug,
      type: 'direct',
      members: [
        {
          user: user1Id,
          role: 'member',
          joinedAt: new Date(),
          permissions: {
            canWrite: true,
            canAddMembers: false,
            canDeleteMessages: false,
            canModerate: false
          }
        },
        {
          user: user2Id,
          role: 'member',
          joinedAt: new Date(),
          permissions: {
            canWrite: true,
            canAddMembers: false,
            canDeleteMessages: false,
            canModerate: false
          }
        }
      ],
      stats: {
        totalMembers: 2,
        totalMessages: 0,
        lastActivity: new Date(),
        createdMessages24h: 0,
        activeMembers24h: 0
      },
      createdBy: user1Id
    })
  })
}

ChannelSchema.statics.createAIChannel = function(creatorId: string, aiConfig: any) {
  const slug = `ai-${Date.now()}-${Math.random().toString(36).substring(7)}`
  
  return this.create({
    name: aiConfig.name || 'Assistant IA',
    slug,
    type: 'ai_assistant',
    description: aiConfig.description || 'Channel avec assistant IA',
    members: [{
      user: creatorId,
      role: 'owner',
      joinedAt: new Date(),
      permissions: {
        canWrite: true,
        canAddMembers: true,
        canDeleteMessages: true,
        canModerate: true
      }
    }],
    aiSettings: {
      ...aiConfig,
      isEnabled: true
    },
    settings: {
      allowFileUploads: false,
      allowReactions: true,
      allowThreads: false,
      maxMembers: 10,
      messageRetentionDays: 30,
      requireApprovalToJoin: true,
      allowGuestAccess: false,
      slowModeSeconds: 5
    },
    stats: {
      totalMembers: 1,
      totalMessages: 0,
      lastActivity: new Date(),
      createdMessages24h: 0,
      activeMembers24h: 0
    },
    createdBy: creatorId
  })
}

ChannelSchema.statics.searchChannels = function(
  query: string,
  userId: string,
  options: { limit?: number; skip?: number } = {}
) {
  const { limit = 20, skip = 0 } = options
  
  return this.find({
    $text: { $search: query },
    $or: [
      { type: 'public' },
      { 'members.user': userId }
    ],
    isDeleted: false,
    isArchived: false
  })
    .populate('members.user', 'name email avatar')
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit)
    .skip(skip)
    .lean()
}

// Pre-hooks
ChannelSchema.pre('save', function(next) {
  // Générer le slug si ce n'est pas fait
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50)
    
    // Ajouter timestamp si nécessaire pour l'unicité
    if (this.isNew) {
      this.slug += `-${Date.now()}`
    }
  }
  
  // Mettre à jour le compteur de membres
  this.stats.totalMembers = this.members.length
  
  next()
})

// Post-hooks
ChannelSchema.post('save', function(doc) {
  // Ici on pourrait émettre des événements WebSocket
  // pour notifier les changements de channel
})

// Validation personnalisée
ChannelSchema.path('members').validate(function(members: any[]) {
  // Vérifier qu'il y a au moins un owner
  const owners = members.filter(member => member.role === 'owner')
  return owners.length >= 1
}, 'Un channel doit avoir au moins un propriétaire')

ChannelSchema.path('aiSettings.apiKey').validate(function(apiKey: string) {
  if (this.type === 'ai_assistant' && this.aiSettings?.isEnabled) {
    return !!apiKey
  }
  return true
}, 'Une clé API est requise pour les channels IA activés')

export const Channel = mongoose.models.Channel || mongoose.model<IChannel>('Channel', ChannelSchema)