import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db/mongoose'
import { Message } from '@/lib/models/message'
import { Channel } from '@/lib/models/channel'
import { User } from '@/lib/models/user'
import { WebSocket } from 'ws'

// Map pour stocker les connexions WebSocket par userId
const connections = new Map<string, AuthenticatedWebSocket>()

// Map pour stocker les utilisateurs en train de taper
const typingUsers = new Map<string, { userId: string, userName: string, timestamp: number }>()

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string
  userName?: string
  userEmail?: string
  userRole?: string
}

// Export GET requis pour next-ws
export async function GET() {
  return new Response('WebSocket endpoint', { status: 200 })
}

export async function UPGRADE(
  client: AuthenticatedWebSocket,
  server: any,
  request: NextRequest
) {
  console.log('🚀 Nouvelle connexion WebSocket reçue')

  // L'authentification se fera via le premier message du client
  let isAuthenticated = false
  let userId = ''
  let userName = ''

  // Gestionnaires d'événements
  client.on('message', async (rawData) => {
    try {
      const message = JSON.parse(rawData.toString())
      
      // Gérer l'authentification en premier
      if (message.type === 'auth' && !isAuthenticated) {
        const { userId: authUserId, userName: authUserName, userEmail, userRole } = message.data
        
        if (authUserId && authUserName) {
          client.userId = authUserId
          client.userName = authUserName
          client.userEmail = userEmail
          client.userRole = userRole
          
          userId = authUserId
          userName = authUserName
          isAuthenticated = true
          
          // Stocker la connexion
          connections.set(userId, client)
          
          // Marquer comme en ligne
          try {
            await connectToDatabase()
            await User.findByIdAndUpdate(userId, {
              isOnline: true,
              lastActive: new Date()
            })
            
            console.log(`✅ ${userName} authentifié et connecté`)
            
            // Notifier les autres utilisateurs
            broadcast({
              type: 'user_presence',
              data: {
                userId,
                status: 'online',
                userName
              }
            })

            // Envoyer la liste des utilisateurs en ligne
            const onlineUsersList = Array.from(connections.entries()).map(([id, conn]) => ({
              userId: id,
              userName: conn.userName,
              userEmail: conn.userEmail
            }))

            client.send(JSON.stringify({
              type: 'online_users_list',
              data: { users: onlineUsersList }
            }))

          } catch (error) {
            console.error('❌ Erreur authentification:', error)
          }
        }
        return
      }

      // Vérifier l'authentification pour les autres messages
      if (!isAuthenticated) {
        client.send(JSON.stringify({
          type: 'error',
          data: { message: 'Non authentifié' }
        }))
        return
      }

      console.log('📥 Message reçu:', message.type, 'de', userName)

      switch (message.type) {
        case 'send_message':
          await handleSendMessage(client, message.data)
          break

        case 'typing_start':
          handleTypingStart(client, message.data)
          break

        case 'typing_stop':
          handleTypingStop(client, message.data)
          break

        case 'mark_read':
          await handleMarkRead(client, message.data)
          break

        case 'join_channel':
          await handleJoinChannel(client, message.data)
          break

        case 'request_online_users':
          // Déjà envoyé à la connexion
          break

        default:
          console.warn('⚠️ Type de message inconnu:', message.type)
      }
    } catch (error) {
      console.error('❌ Erreur traitement message:', error)
      client.send(JSON.stringify({
        type: 'error',
        data: { message: 'Erreur de traitement du message' }
      }))
    }
  })

  client.on('close', async () => {
    console.log(`👋 ${userName} s'est déconnecté`)
    
    // Supprimer de la map des connexions
    connections.delete(userId)

    // Nettoyer les indicateurs de frappe
    for (const [key, typing] of typingUsers.entries()) {
      if (typing.userId === userId) {
        typingUsers.delete(key)
      }
    }

    // Marquer comme hors ligne après un délai
    setTimeout(async () => {
      // Vérifier si l'utilisateur n'a pas une autre connexion
      if (userId && !connections.has(userId)) {
        try {
          await User.findByIdAndUpdate(userId, {
            isOnline: false,
            lastActive: new Date()
          })
          
          // Notifier les autres
          broadcast({
            type: 'user_presence',
            data: {
              userId,
              status: 'offline',
              lastSeen: new Date()
            }
          })

          console.log(`✅ ${userName} marqué comme hors ligne`)
        } catch (error) {
          console.error('❌ Erreur mise à jour statut offline:', error)
        }
      }
    }, 2000)
  })

  client.on('error', (error) => {
    console.error('❌ Erreur WebSocket:', error)
  })
}

// Fonction pour diffuser un message à tous les clients connectés
function broadcast(message: any, excludeUserId?: string) {
  const messageStr = JSON.stringify(message)
  for (const [userId, client] of connections) {
    if (userId !== excludeUserId && client.readyState === 1) { // OPEN
      client.send(messageStr)
    }
  }
}

// Gestionnaire d'envoi de message
async function handleSendMessage(client: AuthenticatedWebSocket, data: any) {
  const { channelId, content, messageType = 'text', attachments = [] } = data
  
  if (!channelId || !content?.trim()) {
    client.send(JSON.stringify({
      type: 'error',
      data: { message: 'Données de message manquantes' }
    }))
    return
  }

  try {
    await connectToDatabase()

    // Vérifier le channel
    const channel = await Channel.findById(channelId)
    if (!channel) {
      client.send(JSON.stringify({
        type: 'error',
        data: { message: 'Channel non trouvé' }
      }))
      return
    }

    // Vérifier l'accès
    const isMember = channel.members.some((member: any) => 
      member.user.toString() === client.userId
    )
    if (!isMember) {
      client.send(JSON.stringify({
        type: 'error',
        data: { message: 'Accès refusé au channel' }
      }))
      return
    }

    // Créer le message
    const message = new Message({
      content: content.trim(),
      messageType,
      sender: client.userId,
      channel: channelId,
      attachments,
      createdAt: new Date(),
      readBy: [{ user: client.userId, readAt: new Date() }]
    })

    await message.save()
    await message.populate('sender', 'name firstName lastName avatar role')

    // Diffuser à tous les membres du channel
    const messageData = {
      type: 'new_message',
      data: {
        _id: message._id,
        content: message.content,
        messageType: message.messageType,
        sender: {
          _id: message.sender._id,
          name: message.sender.firstName && message.sender.lastName 
            ? `${message.sender.firstName} ${message.sender.lastName}`
            : message.sender.name,
          avatar: message.sender.avatar,
          role: message.sender.role
        },
        channel: channelId,
        attachments: message.attachments,
        reactions: message.reactions,
        readBy: message.readBy,
        createdAt: message.createdAt
      }
    }

    // Envoyer à tous les membres connectés + gérer les notifications
    for (const member of channel.members) {
      const memberId = member.user.toString()
      const memberConnection = connections.get(memberId)
      
      if (memberConnection && memberConnection.readyState === 1) {
        // Envoyer le message
        memberConnection.send(JSON.stringify(messageData))
        
        // Si ce n'est pas l'expéditeur, envoyer aussi une notification
        if (memberId !== client.userId) {
          const notificationData = {
            type: 'notification_increment',
            data: {
              userId: memberId,
              channelId,
              channelType: channel.type,
              increment: 1,
              senderName: message.sender.firstName && message.sender.lastName 
                ? `${message.sender.firstName} ${message.sender.lastName}`
                : message.sender.name,
              previewText: content.substring(0, 100)
            }
          }
          memberConnection.send(JSON.stringify(notificationData))
        }
      }
    }

    console.log(`✅ Message et notifications diffusés dans ${channel.name}`)

  } catch (error) {
    console.error('❌ Erreur envoi message:', error)
    client.send(JSON.stringify({
      type: 'error',
      data: { message: 'Erreur lors de l\'envoi du message' }
    }))
  }
}

// Gestionnaire d'indicateurs de frappe
function handleTypingStart(client: AuthenticatedWebSocket, data: any) {
  const { channelId } = data
  if (!channelId) return

  const key = `${channelId}-${client.userId}`
  typingUsers.set(key, {
    userId: client.userId!,
    userName: client.userName!,
    timestamp: Date.now()
  })

  // Diffuser aux autres utilisateurs
  broadcast({
    type: 'user_typing',
    data: {
      userId: client.userId,
      userName: client.userName,
      channelId,
      isTyping: true
    }
  }, client.userId)
}

function handleTypingStop(client: AuthenticatedWebSocket, data: any) {
  const { channelId } = data
  if (!channelId) return

  const key = `${channelId}-${client.userId}`
  typingUsers.delete(key)

  // Diffuser aux autres utilisateurs
  broadcast({
    type: 'user_typing',
    data: {
      userId: client.userId,
      userName: client.userName,
      channelId,
      isTyping: false
    }
  }, client.userId)
}

// Gestionnaire de lecture de messages
async function handleMarkRead(client: AuthenticatedWebSocket, data: any) {
  const { channelId, messageIds } = data
  
  if (!channelId || !messageIds?.length) return

  try {
    await connectToDatabase()

    const result = await Message.updateMany(
      {
        _id: { $in: messageIds },
        channel: channelId,
        'readBy.user': { $ne: client.userId }
      },
      {
        $push: {
          readBy: { user: client.userId, readAt: new Date() }
        }
      }
    )

    console.log(`✅ ${result.modifiedCount} messages marqués comme lus`)

    // Diffuser l'événement de lecture
    broadcast({
      type: 'messages_read',
      data: {
        userId: client.userId,
        messageIds,
        readAt: new Date().toISOString()
      }
    })

    // Envoyer notification de lecture pour réinitialiser le compteur
    if (client.userId && result.modifiedCount > 0) {
      const clientConnection = connections.get(client.userId)
      if (clientConnection && clientConnection.readyState === 1) {
        clientConnection.send(JSON.stringify({
          type: 'notifications_read',
          data: {
            userId: client.userId,
            channelId,
            channelType: 'public' // TODO: récupérer le vrai type du channel
          }
        }))
      }
    }

  } catch (error) {
    console.error('❌ Erreur mark read:', error)
  }
}

// Gestionnaire de rejoindre un channel
async function handleJoinChannel(client: AuthenticatedWebSocket, data: any) {
  const { channelId } = data
  
  if (!channelId) return

  try {
    await connectToDatabase()

    const channel = await Channel.findById(channelId)
    if (!channel) {
      client.send(JSON.stringify({
        type: 'error',
        data: { message: 'Channel non trouvé' }
      }))
      return
    }

    const isMember = channel.members.some((member: any) => 
      member.user.toString() === client.userId
    )
    if (!isMember) {
      client.send(JSON.stringify({
        type: 'error',
        data: { message: 'Accès refusé au channel' }
      }))
      return
    }

    // Charger l'historique des messages
    const messages = await Message.find({ channel: channelId })
      .populate('sender', 'name firstName lastName avatar role')
      .sort({ createdAt: -1 })
      .limit(50)

    const messagesData = messages.reverse().map(msg => ({
      _id: msg._id,
      content: msg.content,
      messageType: msg.messageType,
      sender: {
        _id: msg.sender._id,
        name: msg.sender.firstName && msg.sender.lastName 
          ? `${msg.sender.firstName} ${msg.sender.lastName}`
          : msg.sender.name,
        avatar: msg.sender.avatar,
        role: msg.sender.role
      },
      channel: msg.channel,
      attachments: msg.attachments,
      reactions: msg.reactions,
      readBy: msg.readBy,
      createdAt: msg.createdAt
    }))

    client.send(JSON.stringify({
      type: 'channel_history',
      data: {
        channelId,
        messages: messagesData,
        hasMore: false
      }
    }))

    console.log(`✅ Historique envoyé pour ${channel.name}`)

  } catch (error) {
    console.error('❌ Erreur join channel:', error)
    client.send(JSON.stringify({
      type: 'error',
      data: { message: 'Erreur lors de la connexion au channel' }
    }))
  }
}