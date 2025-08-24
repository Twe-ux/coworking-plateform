import { NextRequest } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { Message } from '@/lib/models/message'
import { User } from '@/lib/models/user'
import { Channel } from '@/lib/models/channel'
import { WebSocket } from 'ws'

// Interface pour les messages WebSocket
interface WSMessage {
  type: 'auth' | 'message' | 'join_channel' | 'leave_channel' | 'typing' | 'stop_typing' | 'mark_read' | 'request_online_users'
  channelId?: string
  content?: string
  messageType?: 'text' | 'image' | 'file'
  messageIds?: string[]
  isTyping?: boolean
  // Auth data
  userId?: string
  userRole?: string
  userName?: string
  userEmail?: string
}

// Interface pour les données utilisateur
interface WSUser {
  id: string
  name: string
  email: string
  role: string
}

// Map pour stocker les connexions par canal
const channelConnections = new Map<string, Set<WebSocket>>()
// Map pour stocker les informations utilisateur par connexion
const connectionUsers = new Map<WebSocket, WSUser>()
// Map pour stocker les utilisateurs en ligne
const onlineUsers = new Set<string>()

export function GET() {
  return new Response('WebSocket endpoint', { status: 426, statusText: 'Upgrade Required' })
}

export function SOCKET(client: WebSocket, request: any, server: any) {
  console.log('🔌 New WebSocket connection established')
  
  let currentUser: WSUser | null = null

  // Envoyer un message de bienvenue
  client.send(JSON.stringify({ 
    type: 'connected', 
    message: 'WebSocket connection established' 
  }))

  // Écouter les messages du client
  client.on('message', async (rawData: Buffer) => {
    try {
      const data: WSMessage = JSON.parse(rawData.toString())
      console.log('📨 WebSocket message received:', data.type, data.channelId)

      // Authentifier l'utilisateur si pas encore fait
      if (!currentUser && data.type === 'auth') {
        await connectToDatabase()
        const user = await User.findOne({ email: data.userEmail })
        if (!user) {
          client.send(JSON.stringify({ 
            type: 'error', 
            message: 'User not found' 
          }))
          client.close()
          return
        }

        currentUser = {
          id: user._id.toString(),
          name: (user.firstName && user.lastName) ? `${user.firstName} ${user.lastName}` : user.name || 'Unknown',
          email: user.email,
          role: user.role
        }

        connectionUsers.set(client, currentUser)
        onlineUsers.add(currentUser.id)
        
        console.log('✅ User authenticated:', currentUser.name)
        
        // Notifier les autres utilisateurs que cet utilisateur est en ligne
        broadcastToAll({
          type: 'user_online',
          userId: currentUser.id,
          userName: currentUser.name
        }, client)
        
        // Envoyer confirmation d'authentification
        client.send(JSON.stringify({
          type: 'auth_success',
          message: 'Authentication successful',
          user: currentUser
        }))
        
        return
      }

      // Skip autres actions si pas authentifié
      if (!currentUser) {
        client.send(JSON.stringify({ 
          type: 'error', 
          message: 'Authentication required' 
        }))
        return
      }

      switch (data.type) {
        case 'join_channel':
          await handleJoinChannel(client, currentUser, data.channelId!)
          break
          
        case 'leave_channel':
          await handleLeaveChannel(client, currentUser, data.channelId!)
          break
          
        case 'message':
          await handleSendMessage(client, currentUser, data)
          break
          
        case 'typing':
          await handleTyping(client, currentUser, data.channelId!, data.isTyping || false)
          break
          
        case 'mark_read':
          await handleMarkRead(client, currentUser, data.channelId!, data.messageIds || [])
          break

        case 'request_online_users':
          await handleRequestOnlineUsers(client, currentUser)
          break
          
        default:
          console.warn('⚠️ Unknown message type:', data.type)
      }
      
    } catch (error) {
      console.error('❌ Error processing WebSocket message:', error)
      client.send(JSON.stringify({ 
        type: 'error', 
        message: 'Failed to process message' 
      }))
    }
  })

  // Gérer la fermeture de connexion
  client.on('close', () => {
    console.log('🔌 WebSocket connection closed')
    
    if (currentUser) {
      onlineUsers.delete(currentUser.id)
      connectionUsers.delete(client)
      
      // Retirer de tous les canaux
      for (const [channelId, connections] of Array.from(channelConnections.entries())) {
        connections.delete(client)
        if (connections.size === 0) {
          channelConnections.delete(channelId)
        }
      }
      
      // Notifier les autres utilisateurs que cet utilisateur est hors ligne
      broadcastToAll({
        type: 'user_offline',
        userId: currentUser.id,
        userName: currentUser.name
      }, client)
    }
  })

  // Gérer les erreurs
  client.on('error', (error) => {
    console.error('❌ WebSocket error:', error)
  })
}

// Rejoindre un canal
async function handleJoinChannel(client: WebSocket, user: WSUser, channelId: string) {
  console.log(`📺 User ${user.name} joining channel: ${channelId}`)
  
  try {
    // Vérifier que le canal existe et que l'utilisateur a accès
    await connectToDatabase()
    const channel = await Channel.findById(channelId)
    if (!channel) {
      client.send(JSON.stringify({ 
        type: 'error', 
        message: 'Channel not found' 
      }))
      return
    }

    // Ajouter la connexion au canal
    if (!channelConnections.has(channelId)) {
      channelConnections.set(channelId, new Set())
    }
    channelConnections.get(channelId)!.add(client)
    
    // Confirmer l'adhésion
    client.send(JSON.stringify({
      type: 'channel_joined',
      channelId,
      channelName: channel.name
    }))
    
    console.log(`✅ User ${user.name} joined channel ${channelId}`)
  } catch (error) {
    console.error('❌ Error joining channel:', error)
    client.send(JSON.stringify({
      type: 'error',
      message: 'Failed to join channel'
    }))
  }
}

// Quitter un canal
async function handleLeaveChannel(client: WebSocket, user: WSUser, channelId: string) {
  console.log(`📺 User ${user.name} leaving channel: ${channelId}`)
  
  const connections = channelConnections.get(channelId)
  if (connections) {
    connections.delete(client)
    if (connections.size === 0) {
      channelConnections.delete(channelId)
    }
  }
  
  client.send(JSON.stringify({
    type: 'channel_left',
    channelId
  }))
}

// Envoyer un message
async function handleSendMessage(client: WebSocket, user: WSUser, data: WSMessage) {
  console.log(`📤 User ${user.name} sending message to channel: ${data.channelId}`)
  
  try {
    await connectToDatabase()
    
    // Créer le message en base de données
    const message = new Message({
      content: data.content,
      messageType: data.messageType || 'text',
      sender: user.id,
      channel: data.channelId,
      attachments: [],
      reactions: [],
      readBy: [{ user: user.id, readAt: new Date() }],
    })
    
    await message.save()
    await message.populate('sender', 'firstName lastName email avatar role')
    
    const messageData = {
      type: 'message_received',
      message: {
        _id: message._id.toString(),
        content: message.content,
        messageType: message.messageType,
        sender: {
          _id: (message.sender as any)._id.toString(),
          name: (message.sender as any).firstName && (message.sender as any).lastName
            ? `${(message.sender as any).firstName} ${(message.sender as any).lastName}`
            : (message.sender as any).name || 'Unknown User',
          email: (message.sender as any).email,
          avatar: (message.sender as any).avatar,
          role: (message.sender as any).role
        },
        channel: message.channel.toString(),
        createdAt: message.createdAt,
        reactions: message.reactions,
        attachments: message.attachments,
        readBy: message.readBy
      }
    }
    
    // Diffuser le message à tous les clients connectés au canal
    broadcastToChannel(data.channelId!, messageData)
    
    console.log('✅ Message sent and broadcasted to channel:', data.channelId)
    
  } catch (error) {
    console.error('❌ Error sending message:', error)
    client.send(JSON.stringify({
      type: 'error',
      message: 'Failed to send message'
    }))
  }
}

// Gérer les indicateurs de frappe
async function handleTyping(client: WebSocket, user: WSUser, channelId: string, isTyping: boolean) {
  const connections = channelConnections.get(channelId)
  if (!connections) return
  
  const typingData = {
    type: isTyping ? 'user_typing' : 'user_stop_typing',
    userId: user.id,
    userName: user.name,
    channelId
  }
  
  // Diffuser à tous les autres clients du canal (pas à l'expéditeur)
  connections.forEach(conn => {
    if (conn !== client && conn.readyState === WebSocket.OPEN) {
      conn.send(JSON.stringify(typingData))
    }
  })
}

// Marquer les messages comme lus
async function handleMarkRead(client: WebSocket, user: WSUser, channelId: string, messageIds: string[]) {
  if (messageIds.length === 0) return
  
  try {
    await connectToDatabase()
    
    // Mettre à jour les messages en base
    await Message.updateMany(
      { _id: { $in: messageIds } },
      { $addToSet: { readBy: { user: user.id, readAt: new Date() } } }
    )
    
    const readData = {
      type: 'messages_read',
      userId: user.id,
      messageIds,
      readAt: new Date().toISOString()
    }
    
    // Diffuser à tous les clients du canal
    broadcastToChannel(channelId, readData)
    
  } catch (error) {
    console.error('❌ Error marking messages as read:', error)
  }
}

// Gérer la demande de liste des utilisateurs en ligne
async function handleRequestOnlineUsers(client: WebSocket, user: WSUser) {
  console.log(`📋 User ${user.name} requesting online users list`)
  
  // Construire la liste des utilisateurs en ligne
  const onlineUsersList = Array.from(onlineUsers).map(userId => {
    const userInfo = Array.from(connectionUsers.values()).find(u => u.id === userId)
    return {
      userId,
      userName: userInfo?.name || 'Unknown',
      userRole: userInfo?.role || 'user',
      lastSeen: new Date()
    }
  })

  client.send(JSON.stringify({
    type: 'online_users_list',
    users: onlineUsersList,
    timestamp: new Date()
  }))
}

// Diffuser un message à tous les clients d'un canal
function broadcastToChannel(channelId: string, data: any) {
  const connections = channelConnections.get(channelId)
  if (!connections) return
  
  const message = JSON.stringify(data)
  connections.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message)
    }
  })
}

// Diffuser un message à tous les clients connectés
function broadcastToAll(data: any, excludeClient?: WebSocket) {
  const message = JSON.stringify(data)
  
  for (const connections of Array.from(channelConnections.values())) {
    connections.forEach(client => {
      if (client !== excludeClient && client.readyState === WebSocket.OPEN) {
        client.send(message)
      }
    })
  }
}