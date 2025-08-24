import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db/mongoose'
import { Message } from '@/lib/models/message'
import { Channel } from '@/lib/models/channel'
import IPRestrictionMiddleware from '@/lib/middleware/ipRestriction'
import { z } from 'zod'

const createMessageSchema = z.object({
  content: z.string().min(1).max(10000),
  channelId: z.string(),
  messageType: z.enum(['text', 'image', 'file']).optional(),
  parentMessageId: z.string().optional(),
  mentions: z.array(z.string()).optional(),
  attachments: z.array(z.object({
    url: z.string(),
    type: z.enum(['image', 'file']),
    filename: z.string(),
    size: z.number(),
    mimeType: z.string()
  })).optional()
})

// GET /api/messaging/messages - Récupérer les messages d'un channel
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
    const channelId = searchParams.get('channelId')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const before = searchParams.get('before') // Date ISO pour pagination
    const after = searchParams.get('after')
    const search = searchParams.get('search')

    if (!channelId) {
      return NextResponse.json(
        { error: 'Channel ID requis' },
        { status: 400 }
      )
    }

    // Vérifier l'accès au channel
    const channel = await Channel.findById(channelId)
    if (!channel) {
      return NextResponse.json(
        { error: 'Channel introuvable' },
        { status: 404 }
      )
    }

    // Vérifier que l'utilisateur est membre du channel
    const isMember = channel.members.some(
      (member: any) => member.user.toString() === session.user.id
    )
    
    if (!isMember && channel.type !== 'public') {
      return NextResponse.json(
        { error: 'Accès refusé au channel' },
        { status: 403 }
      )
    }

    // Vérifier les restrictions IP du channel
    const channelIPCheck = await IPRestrictionMiddleware.checkChannelIPRestriction(
      channelId,
      ipCheck.clientIP
    )
    
    if (!channelIPCheck.allowed) {
      return NextResponse.json(
        { error: 'Accès refusé', message: channelIPCheck.reason },
        { status: 403 }
      )
    }

    let messages

    if (search) {
      // Recherche dans les messages
      messages = await Message.searchMessages(search, [channelId], { limit })
    } else {
      // Récupération normale avec pagination
      const beforeDate = before ? new Date(before) : undefined
      const afterDate = after ? new Date(after) : undefined

      messages = await Message.findByChannel(channelId, {
        limit,
        before: beforeDate,
        after: afterDate,
        includeDeleted: false
      })
    }

    // Marquer les messages comme vus par l'utilisateur
    const messageIds = messages.map((msg: any) => msg._id.toString())
    if (messageIds.length > 0) {
      // Marquer en arrière-plan pour ne pas ralentir la réponse
      setImmediate(async () => {
        try {
          for (const messageId of messageIds) {
            const message = await Message.findById(messageId)
            if (message) {
              await message.markAsRead(session.user.id)
            }
          }
        } catch (error) {
          console.error('Erreur lors du marquage des messages lus:', error)
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        messages: messages.reverse(), // Ordre chronologique
        hasMore: messages.length === limit,
        channel: {
          _id: channel._id,
          name: channel.name,
          type: channel.type
        }
      }
    })

  } catch (error) {
    console.error('Erreur lors de la récupération des messages:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', message: 'Impossible de récupérer les messages' },
      { status: 500 }
    )
  }
}

// POST /api/messaging/messages - Créer un nouveau message
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

    // Valider les données
    const body = await request.json()
    const validatedData = createMessageSchema.parse(body)

    // Vérifier l'accès au channel
    const channel = await Channel.findById(validatedData.channelId)
    if (!channel) {
      return NextResponse.json(
        { error: 'Channel introuvable' },
        { status: 404 }
      )
    }

    // Vérifier que l'utilisateur est membre du channel
    const member = channel.members.find(
      (member: any) => member.user.toString() === session.user.id
    )
    
    if (!member) {
      return NextResponse.json(
        { error: 'Vous n\'êtes pas membre de ce channel' },
        { status: 403 }
      )
    }

    // Vérifier les permissions d'écriture
    if (!member.permissions.canWrite) {
      return NextResponse.json(
        { error: 'Permissions d\'écriture insuffisantes' },
        { status: 403 }
      )
    }

    // Vérifier les restrictions IP du channel
    const channelIPCheck = await IPRestrictionMiddleware.checkChannelIPRestriction(
      validatedData.channelId,
      ipCheck.clientIP
    )
    
    if (!channelIPCheck.allowed) {
      return NextResponse.json(
        { error: 'Accès refusé', message: channelIPCheck.reason },
        { status: 403 }
      )
    }

    // Vérifier le slow mode
    if (channel.settings.slowModeSeconds > 0) {
      const lastMessage = await Message.findOne({
        channel: validatedData.channelId,
        sender: session.user.id
      }).sort({ createdAt: -1 })

      if (lastMessage) {
        const timeSinceLastMessage = Date.now() - lastMessage.createdAt.getTime()
        const requiredDelay = channel.settings.slowModeSeconds * 1000

        if (timeSinceLastMessage < requiredDelay) {
          const remainingTime = Math.ceil((requiredDelay - timeSinceLastMessage) / 1000)
          return NextResponse.json(
            { 
              error: 'Slow mode actif',
              message: `Veuillez attendre ${remainingTime} secondes avant d'envoyer un autre message.`
            },
            { status: 429 }
          )
        }
      }
    }

    // Vérifier le message parent si fourni
    if (validatedData.parentMessageId) {
      const parentMessage = await Message.findById(validatedData.parentMessageId)
      if (!parentMessage || parentMessage.channel.toString() !== validatedData.channelId) {
        return NextResponse.json(
          { error: 'Message parent invalide' },
          { status: 400 }
        )
      }
    }

    // Créer le message
    const messageData = {
      content: validatedData.content.trim(),
      messageType: validatedData.messageType || 'text',
      sender: session.user.id,
      channel: validatedData.channelId,
      parentMessage: validatedData.parentMessageId || null,
      attachments: validatedData.attachments || [],
      mentions: validatedData.mentions || [],
      metadata: {
        ipAddress: ipCheck.clientIP,
        userAgent: request.headers.get('user-agent')
      }
    }

    const message = new Message(messageData)
    await message.save()

    // Peupler les données pour la réponse
    await message.populate('sender', 'name email avatar role')
    await message.populate('mentions', 'name email')
    if (message.parentMessage) {
      await message.populate({
        path: 'parentMessage',
        populate: {
          path: 'sender',
          select: 'name email avatar'
        }
      })
    }

    // Mettre à jour les statistiques du channel
    await Channel.findByIdAndUpdate(validatedData.channelId, {
      $inc: { 
        'stats.totalMessages': 1,
        'stats.createdMessages24h': 1
      },
      $set: { 'stats.lastActivity': new Date() }
    })

    // Note: Real-time broadcasting is now handled directly in the WebSocket API route
    // when messages are sent through WebSocket connections

    return NextResponse.json({
      success: true,
      data: { message },
      message: 'Message envoyé avec succès'
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

    console.error('Erreur lors de la création du message:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', message: 'Impossible d\'envoyer le message' },
      { status: 500 }
    )
  }
}