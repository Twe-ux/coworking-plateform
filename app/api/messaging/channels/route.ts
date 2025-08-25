import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db/mongoose'
import { Channel } from '@/lib/models/channel'
import { User } from '@/lib/models/user'
import IPRestrictionMiddleware from '@/lib/middleware/ipRestriction'
import { z } from 'zod'

const createChannelSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(500).optional(),
  type: z.enum(['public', 'private', 'ai_assistant']),
  members: z.array(z.string()).optional(),
  settings: z.object({
    allowFileUploads: z.boolean().optional(),
    allowReactions: z.boolean().optional(),
    maxMembers: z.number().min(1).max(1000).optional(),
    requireApprovalToJoin: z.boolean().optional(),
    slowModeSeconds: z.number().min(0).max(3600).optional()
  }).optional(),
  ipRestriction: z.object({
    allowedIPs: z.array(z.string()),
    isEnabled: z.boolean()
  }).optional(),
  aiSettings: z.object({
    provider: z.enum(['openai', 'anthropic', 'local']).optional(),
    model: z.string().optional(),
    apiKey: z.string().optional(),
    systemPrompt: z.string().max(2000).optional(),
    maxTokens: z.number().min(100).max(4000).optional(),
    temperature: z.number().min(0).max(2).optional()
  }).optional()
})

// GET /api/messaging/channels - Récupérer les channels de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    // Vérification IP
    const ipCheck = await IPRestrictionMiddleware.checkUserIPAccess(request)
    if (!ipCheck.allowed) {
      return NextResponse.json(
        { error: 'Accès refusé', message: ipCheck.reason },
        { status: 403 }
      )
    }

    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    await connectToDatabase()

    // Paramètres de requête
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const includeArchived = searchParams.get('includeArchived') === 'true'
    const search = searchParams.get('search')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Construire la requête
    let channels

    if (search) {
      // Recherche textuelle
      channels = await Channel.searchChannels(search, session.user.id, { limit, skip: offset })
    } else {
      // Récupération normale
      const typeFilter = type ? [type] : undefined
      channels = await Channel.findByUser(session.user.id, {
        includeArchived,
        type: typeFilter
      })
      
      // Pagination manuelle pour findByUser
      channels = channels.slice(offset, offset + limit)
    }

    // Ajouter les informations supplémentaires
    const enrichedChannels = await Promise.all(
      channels.map(async (channel: any) => {
        // Vérifier l'accès IP spécifique au channel
        const canAccess = await IPRestrictionMiddleware.checkChannelIPRestriction(
          channel._id.toString(),
          ipCheck.clientIP
        )

        if (!canAccess.allowed) {
          return null // Filtrer ce channel
        }

        // Calculer le nombre de messages non lus
        const Message = (await import('@/lib/models/message')).Message
        const unreadCount = await Message.getUnreadCount(session.user.id, channel._id.toString())

        // Obtenir le dernier message
        const lastMessage = await Message.findOne({
          channel: channel._id,
          isDeleted: false
        })
          .populate('sender', 'name avatar')
          .sort({ createdAt: -1 })
          .lean()

        return {
          ...channel,
          unreadCount,
          lastMessage: lastMessage ? {
            _id: lastMessage._id,
            content: lastMessage.content.substring(0, 100),
            sender: lastMessage.sender,
            createdAt: lastMessage.createdAt,
            messageType: lastMessage.messageType
          } : null,
          // Ne pas exposer les informations sensibles
          aiSettings: channel.aiSettings ? {
            ...channel.aiSettings,
            apiKey: undefined // Ne jamais exposer la clé API
          } : undefined
        }
      })
    )

    // Filtrer les channels null (accès refusé)
    const accessibleChannels = enrichedChannels.filter(Boolean)

    return NextResponse.json({
      success: true,
      data: {
        channels: accessibleChannels,
        total: accessibleChannels.length,
        hasMore: accessibleChannels.length === limit
      }
    })

  } catch (error) {
    console.error('Erreur lors de la récupération des channels:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', message: 'Impossible de récupérer les channels' },
      { status: 500 }
    )
  }
}

// POST /api/messaging/channels - Créer un nouveau channel
export async function POST(request: NextRequest) {
  try {
    // Vérification IP
    const ipCheck = await IPRestrictionMiddleware.checkUserIPAccess(request)
    if (!ipCheck.allowed) {
      return NextResponse.json(
        { error: 'Accès refusé', message: ipCheck.reason },
        { status: 403 }
      )
    }

    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    await connectToDatabase()

    // Vérifier les permissions
    const user = await User.findById(session.user.id)
    if (!user || !['admin', 'manager'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Permissions insuffisantes', message: 'Seuls les admins et managers peuvent créer des channels' },
        { status: 403 }
      )
    }

    // Valider les données
    const body = await request.json()
    const validatedData = createChannelSchema.parse(body)

    // Générer un slug unique
    const baseSlug = validatedData.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 30)
    
    let slug = baseSlug
    let counter = 1
    while (await Channel.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    // Préparer les données du channel
    const channelData: any = {
      name: validatedData.name,
      slug,
      description: validatedData.description,
      type: validatedData.type,
      createdBy: session.user.id,
      members: [{
        user: session.user.id,
        role: 'owner',
        joinedAt: new Date(),
        permissions: {
          canWrite: true,
          canAddMembers: true,
          canDeleteMessages: true,
          canModerate: true
        }
      }],
      settings: {
        allowFileUploads: true,
        allowReactions: true,
        allowThreads: true,
        maxMembers: 100,
        messageRetentionDays: 0,
        requireApprovalToJoin: validatedData.type === 'private',
        allowGuestAccess: false,
        slowModeSeconds: 0,
        ...validatedData.settings
      },
      stats: {
        totalMessages: 0,
        totalMembers: 1,
        lastActivity: new Date(),
        createdMessages24h: 0,
        activeMembers24h: 1
      }
    }

    // Configuration IP si fournie
    if (validatedData.ipRestriction) {
      channelData.metadata = {
        ipRestriction: validatedData.ipRestriction
      }
    }

    // Configuration IA si c'est un channel IA
    if (validatedData.type === 'ai_assistant' && validatedData.aiSettings) {
      channelData.aiSettings = {
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        maxTokens: 1000,
        temperature: 0.7,
        isEnabled: false, // Désactivé par défaut jusqu'à configuration complète
        rateLimitPerUser: {
          requestsPerHour: 20,
          requestsPerDay: 100
        },
        ...validatedData.aiSettings
      }
    }

    // Créer le channel
    const channel = new Channel(channelData)
    await channel.save()

    // Ajouter les membres supplémentaires si fournis
    if (validatedData.members && validatedData.members.length > 0) {
      for (const memberId of validatedData.members) {
        if (memberId !== session.user.id) {
          const memberUser = await User.findById(memberId)
          if (memberUser) {
            await channel.addMember(memberId, 'member')
          }
        }
      }
    }

    // Peupler les données pour la réponse
    await channel.populate('members.user', 'name email avatar role')
    await channel.populate('createdBy', 'name email avatar')

    // Préparer la réponse (sans informations sensibles)
    const responseData = {
      ...channel.toObject(),
      aiSettings: channel.aiSettings ? {
        ...channel.aiSettings,
        apiKey: undefined
      } : undefined
    }

    return NextResponse.json({
      success: true,
      data: { channel: responseData },
      message: 'Channel créé avec succès'
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Données invalides',
          message: 'Les données fournies ne sont pas valides',
          details: error.errors
        },
        { status: 400 }
      )
    }

    console.error('Erreur lors de la création du channel:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', message: 'Impossible de créer le channel' },
      { status: 500 }
    )
  }
}

// Force Node.js runtime for WebSocket and database compatibility
export const runtime = 'nodejs'