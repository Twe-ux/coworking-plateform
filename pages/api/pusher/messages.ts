import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { connectToDatabase } from '@/lib/db/mongoose'
import { Message } from '@/lib/models/message'
import { Channel } from '@/lib/models/channel'
import { User } from '@/lib/models/user'
import { triggerPusherEvent, PUSHER_EVENTS, PUSHER_CHANNELS } from '@/lib/pusher'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    await connectToDatabase()

    // Vérifier l'authentification
    const session = await getServerSession(req, res, authOptions)
    if (!session?.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const { action } = req.query
    const userId = session.user.id

    switch (action) {
      case 'send':
        return await handleSendMessage(req, res, userId)
      case 'mark-read':
        return await handleMarkRead(req, res, userId)
      case 'typing':
        return await handleTyping(req, res, userId)
      default:
        return res.status(400).json({ message: 'Invalid action' })
    }
  } catch (error) {
    console.error('Erreur API messages:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

async function handleSendMessage(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const {
      channelId,
      content,
      messageType = 'text',
      attachments = [],
    } = req.body

    if (!channelId || !content) {
      return res.status(400).json({ message: 'Channel ID et contenu requis' })
    }

    // Vérifier l'accès au channel
    const channel = await Channel.findById(channelId)
    if (!channel) {
      return res.status(404).json({ message: 'Channel non trouvé' })
    }

    const isMember = channel.members.some(
      (member: any) => member.user.toString() === userId
    )
    if (!isMember) {
      return res.status(403).json({ message: 'Accès refusé au channel' })
    }

    // Créer le message
    const message = new Message({
      content,
      messageType,
      sender: userId,
      channel: channelId,
      attachments,
      createdAt: new Date(),
      readBy: [{ user: userId, readAt: new Date() }],
    })

    await message.save()
    await message.populate('sender', 'name firstName lastName email image')

    // Préparer les données pour Pusher
    const messageData = {
      id: message._id.toString(),
      content: message.content,
      messageType: message.messageType,
      sender: {
        id: message.sender._id.toString(),
        name: message.sender.firstName && message.sender.lastName 
          ? `${message.sender.firstName} ${message.sender.lastName}`
          : message.sender.name,
        firstName: message.sender.firstName,
        lastName: message.sender.lastName,
        email: message.sender.email,
        image: message.sender.image,
      },
      channel: channelId,
      attachments: message.attachments,
      reactions: message.reactions || [],
      readBy: message.readBy || [],
      createdAt: message.createdAt.toISOString(),
      updatedAt: message.updatedAt.toISOString(),
    }

    // Diffuser via Pusher
    const channelName = PUSHER_CHANNELS.PUBLIC(channelId)
    console.log('📢 Sending Pusher message event to channel:', channelName, 'Event:', PUSHER_EVENTS.MESSAGE_SENT)
    console.log('📢 Message data:', messageData)
    await triggerPusherEvent(channelName, PUSHER_EVENTS.MESSAGE_SENT, messageData)
    console.log('✅ Pusher message event sent successfully')

    // Notifier les membres du channel (sauf l'expéditeur)
    const notifications = channel.members
      .filter((member: any) => member.user.toString() !== userId)
      .map((member: any) => ({
        channel: PUSHER_CHANNELS.USER(member.user.toString()),
        name: PUSHER_EVENTS.NOTIFICATION,
        data: {
          type: 'new_message',
          channelId,
          channelName: channel.name,
          messageId: message._id.toString(),
          senderName: messageData.sender.name,
          content: content.length > 50 ? content.substring(0, 50) + '...' : content,
        },
      }))

    if (notifications.length > 0) {
      const { triggerPusherBatch } = await import('@/lib/pusher')
      await triggerPusherBatch(notifications)
    }

    return res.status(201).json({
      success: true,
      message: messageData,
    })
  } catch (error) {
    console.error('Erreur envoi message:', error)
    return res.status(500).json({ message: 'Erreur lors de l\'envoi du message' })
  }
}

async function handleMarkRead(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const { channelId, messageIds } = req.body

    if (!channelId || !messageIds || !Array.isArray(messageIds)) {
      return res.status(400).json({ message: 'Channel ID et message IDs requis' })
    }

    // Vérifier l'accès au channel
    const channel = await Channel.findById(channelId)
    if (!channel) {
      return res.status(404).json({ message: 'Channel non trouvé' })
    }

    const isMember = channel.members.some(
      (member: any) => member.user.toString() === userId
    )
    if (!isMember) {
      return res.status(403).json({ message: 'Accès refusé au channel' })
    }

    // Marquer les messages comme lus
    const updateResult = await Message.updateMany(
      {
        _id: { $in: messageIds },
        channel: channelId,
        'readBy.user': { $ne: userId },
      },
      {
        $push: {
          readBy: { user: userId, readAt: new Date() },
        },
      }
    )

    // Notifier via Pusher
    const channelName = PUSHER_CHANNELS.PUBLIC(channelId)
    await triggerPusherEvent(channelName, 'messages_read', {
      userId,
      messageIds,
      readAt: new Date().toISOString(),
    })

    return res.status(200).json({
      success: true,
      markedCount: updateResult.modifiedCount,
    })
  } catch (error) {
    console.error('Erreur mark read:', error)
    return res.status(500).json({ message: 'Erreur lors du marquage comme lu' })
  }
}

async function handleTyping(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const { channelId, isTyping } = req.body

    if (!channelId || typeof isTyping !== 'boolean') {
      return res.status(400).json({ message: 'Channel ID et isTyping requis' })
    }

    // Récupérer les infos utilisateur
    const user = await User.findById(userId).select('name firstName lastName')
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' })
    }

    const userName = user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}`
      : user.name

    // Diffuser via Pusher
    const channelName = PUSHER_CHANNELS.PUBLIC(channelId)
    const event = isTyping ? PUSHER_EVENTS.USER_TYPING : PUSHER_EVENTS.USER_STOP_TYPING
    
    await triggerPusherEvent(channelName, event, {
      userId,
      userName,
      channelId,
      isTyping,
    })

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Erreur typing:', error)
    return res.status(500).json({ message: 'Erreur lors de la notification de saisie' })
  }
}