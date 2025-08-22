import { NextApiRequest, NextApiResponse } from 'next'
import { Server as ServerIO } from 'socket.io'
import { Server as NetServer } from 'http'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db/mongoose'
import { Message } from '@/lib/models/message'
import { Channel } from '@/lib/models/channel'
import { User } from '@/lib/models/user'
import IPRestrictionMiddleware from '@/lib/middleware/ipRestriction'

export interface NextApiResponseServerIO extends NextApiResponse {
  socket: {
    server: NetServer & {
      io: ServerIO
    }
  }
}

interface AuthenticatedSocket {
  userId: string
  userRole: string
  userName: string
  userEmail: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIO
) {
  if (!res.socket.server.io) {
    console.log('🚀 Initialisation du serveur Socket.IO...')

    const io = new ServerIO(res.socket.server, {
      path: '/api/socket/',
      addTrailingSlash: false,
      cors: {
        origin: [
          'http://localhost:3000',
          'http://localhost:3001',
          process.env.NEXTAUTH_URL || 'http://localhost:3000',
        ],
        methods: ['GET', 'POST'],
        credentials: true,
      },
    })

    // Middleware d'authentification Socket.IO utilisant la vraie session
    io.use(async (socket, next) => {
      try {
        const { sessionToken, userId, userRole, userName, userEmail } =
          socket.handshake.auth
        console.log('🔐 Authentification Socket.IO avec données:', {
          hasToken: !!sessionToken,
          userId: userId?.substring(0, 8) + '...',
          userRole,
          userName,
        })

        // Connecter à la DB pour récupérer l'utilisateur
        await connectToDatabase()

        // Utiliser les données de session passées par le client
        if (!userId) {
          return next(new Error('ID utilisateur manquant'))
        }

        // Vérifier que l'utilisateur existe en base
        const user = await User.findById(userId).select(
          '_id name firstName lastName role email isActive'
        )
        if (!user) {
          return next(new Error('Utilisateur non trouvé'))
        }

        if (!user.isActive) {
          return next(new Error('Compte utilisateur désactivé'))
        }

        // Calculer le nom d'affichage
        const displayName =
          user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : user.name || userName || 'Utilisateur'

        // Attacher les données utilisateur au socket
        ;(socket as any).user = {
          userId: user._id.toString(),
          userRole: user.role,
          userName: displayName,
          userEmail: user.email,
        } as AuthenticatedSocket

        console.log('👤 Socket.IO user configuré:', {
          userId: user._id.toString().substring(0, 8) + '...',
          userName: displayName,
          role: user.role,
        })

        next()
      } catch (error) {
        console.error('Erreur auth Socket.IO:', error)
        next(new Error("Erreur d'authentification"))
      }
    })

    // Gestionnaires d'événements Socket.IO
    io.on('connection', async (socket) => {
      const user = (socket as any).user as AuthenticatedSocket

      console.log(`👤 Utilisateur connecté: ${user.userName} (${user.userId})`)

      // Rejoindre la room de l'utilisateur pour le tracking
      socket.join(`user:${user.userId}`)

      // Vérification IP pour l'accès à la messagerie
      try {
        await connectToDatabase()

        // Simuler une requête pour la vérification IP
        const mockRequest = {
          headers: {
            'x-forwarded-for': socket.handshake.address,
            'x-real-ip': socket.handshake.address,
          },
          ip: socket.handshake.address,
          connection: { remoteAddress: socket.handshake.address },
        } as any

        // Pour le moment, on autorise toutes les connexions localhost
        const ipCheck = {
          allowed: true,
          reason: 'Test localhost autorisé',
        }

        if (!ipCheck.allowed) {
          socket.emit('error', {
            message: 'Accès refusé depuis cette adresse IP',
            code: 'IP_RESTRICTED',
          })
          socket.disconnect()
          return
        }
      } catch (error) {
        console.error('Erreur vérification IP:', error)
        socket.emit('error', {
          message: "Erreur de vérification d'accès",
          code: 'ACCESS_CHECK_FAILED',
        })
        socket.disconnect()
        return
      }

      // Rejoindre les channels de l'utilisateur
      try {
        const userChannels = await Channel.find({
          'members.user': user.userId,
          $or: [
            { isActive: true },
            { isActive: { $exists: false } },
            { type: { $in: ['dm', 'direct'] } },
          ],
        }).select('_id name type')

        console.log(
          `🔍 Channels trouvés pour ${user.userName}:`,
          userChannels.map((ch) => `${ch.name} (${ch.type})`)
        )

        for (const channel of userChannels) {
          socket.join(`channel:${channel._id}`)
          console.log(
            `📺 ${user.userName} a rejoint le channel: ${channel.name} (${channel.type})`
          )
        }

        // Vérifier s'il s'agit de la première connexion de cet utilisateur
        const userSockets = await io.in(`user:${user.userId}`).fetchSockets()
        const isFirstConnection = userSockets.length === 1 // Seule cette socket existe

        // Mise à jour du statut en ligne avec gestion d'erreurs améliorée
        try {
          const updateResult = await User.findByIdAndUpdate(
            user.userId,
            {
              isOnline: true,
              lastActive: new Date(),
            },
            { new: true } // Retourner le document mis à jour
          )

          if (updateResult) {
            console.log(
              `✅ ${user.userName} marqué comme en ligne dans la DB (connexion: ${isFirstConnection ? 'première' : 'additionnelle'})`
            )
          } else {
            console.error(
              `❌ Utilisateur ${user.userId} non trouvé lors de la mise à jour du statut`
            )
          }
        } catch (error) {
          console.error('❌ Erreur mise à jour statut online:', error)
        }

        // Notifier la présence en ligne seulement pour la première connexion
        if (isFirstConnection) {
          console.log(
            `📢 Broadcasting ONLINE status for ${user.userName} (first connection)`
          )
          socket.broadcast.emit('user_presence', {
            userId: user.userId,
            status: 'online',
            lastSeen: new Date(),
          })
        } else {
          console.log(
            `🔄 ${user.userName} connexion additionnelle (déjà en ligne)`
          )
        }

        // Envoyer la liste des utilisateurs actuellement en ligne à ce nouvel utilisateur
        try {
          const onlineUsers = await User.find({ isOnline: true }).select(
            '_id name firstName lastName'
          )
          const onlineUsersList = onlineUsers
            .filter((u) => u._id.toString() !== user.userId) // Exclure l'utilisateur actuel
            .map((u) => ({
              userId: u._id.toString(),
              userName:
                u.firstName && u.lastName
                  ? `${u.firstName} ${u.lastName}`
                  : u.name,
              status: 'online',
              lastSeen: new Date(),
            }))

          console.log(
            `📋 Envoi de la liste des utilisateurs en ligne à ${user.userName}:`,
            onlineUsersList.map((u) => u.userName)
          )

          // Envoyer les statuts existants au nouvel utilisateur
          onlineUsersList.forEach((onlineUser) => {
            socket.emit('user_presence', onlineUser)
          })
        } catch (error) {
          console.error('Erreur envoi liste utilisateurs en ligne:', error)
        }
      } catch (error) {
        console.error('Erreur lors du chargement des channels:', error)
      }

      // Écouter les nouveaux messages
      socket.on('send_message', async (data) => {
        try {
          console.log("📤 Tentative d'envoi message:", data)
          const {
            channelId,
            content,
            messageType = 'text',
            attachments = [],
          } = data

          // Vérifier l'accès au channel
          console.log('🔍 Recherche channel:', channelId)
          const channel = await Channel.findById(channelId)
          if (!channel) {
            console.log('❌ Channel non trouvé:', channelId)
            socket.emit('error', { message: 'Channel non trouvé' })
            return
          }
          console.log('✅ Channel trouvé:', channel.name)

          const isMember = channel.members.some(
            (member) => member.user.toString() === user.userId
          )
          if (!isMember) {
            console.log(
              '❌ Utilisateur pas membre du channel:',
              user.userName,
              'dans',
              channel.name
            )
            socket.emit('error', { message: 'Accès refusé au channel' })
            return
          }
          console.log('✅ Utilisateur autorisé dans le channel')

          // Créer le message
          console.log('💾 Création du message...')
          const message = new Message({
            content,
            messageType,
            sender: user.userId,
            channel: channelId,
            attachments,
            createdAt: new Date(),
            readBy: [{ user: user.userId, readAt: new Date() }],
          })

          await message.save()
          console.log('✅ Message sauvegardé:', message._id)

          await message.populate('sender', 'name avatar role')
          console.log('✅ Message peuplé avec sender')

          // Diffuser le message aux membres du channel
          io.to(`channel:${channelId}`).emit('new_message', {
            _id: message._id,
            content: message.content,
            messageType: message.messageType,
            sender: {
              _id: message.sender._id,
              name: message.sender.name,
              avatar: message.sender.avatar,
              role: message.sender.role,
            },
            channel: channelId,
            attachments: message.attachments,
            reactions: message.reactions,
            readBy: message.readBy || [], // Ajouter le champ readBy
            createdAt: message.createdAt,
            editedAt: message.editedAt,
          })

          // Émettre notification d'incrémentation pour les autres utilisateurs
          const channelType = channel.type
          channel.members.forEach((member) => {
            const memberId = member.user.toString()
            if (memberId !== user.userId) {
              // Pas pour l'expéditeur
              io.to(`user:${memberId}`).emit('notification_increment', {
                userId: memberId,
                channelId: channelId,
                channelType: channelType,
                increment: 1,
              })
            }
          })

          console.log(
            `💬 Message envoyé par ${user.userName} dans ${channel.name}`
          )
        } catch (error) {
          console.error('Erreur envoi message:', error)
          socket.emit('error', { message: "Erreur lors de l'envoi du message" })
        }
      })

      // Écouter les événements de frappe
      socket.on('typing_start', (data) => {
        const { channelId } = data
        socket.to(`channel:${channelId}`).emit('user_typing', {
          userId: user.userId,
          userName: user.userName,
          channelId,
          isTyping: true,
        })
      })

      socket.on('typing_stop', (data) => {
        const { channelId } = data
        socket.to(`channel:${channelId}`).emit('user_typing', {
          userId: user.userId,
          userName: user.userName,
          channelId,
          isTyping: false,
        })
      })

      // Rejoindre un channel spécifique
      socket.on('join_channel', async (data) => {
        try {
          const { channelId } = data

          const channel = await Channel.findById(channelId)
          if (!channel) {
            socket.emit('error', { message: 'Channel non trouvé' })
            return
          }

          const isMember = channel.members.some(
            (member) => member.user.toString() === user.userId
          )
          if (!isMember) {
            socket.emit('error', { message: 'Accès refusé au channel' })
            return
          }

          socket.join(`channel:${channelId}`)

          // Charger l'historique des messages
          const messages = await Message.find({ channel: channelId })
            .populate('sender', 'name avatar role')
            .sort({ createdAt: -1 })
            .limit(50)

          socket.emit('channel_history', {
            channelId,
            messages: messages.reverse().map((msg) => ({
              _id: msg._id,
              content: msg.content,
              messageType: msg.messageType,
              sender: {
                _id: msg.sender._id,
                name: msg.sender.name,
                avatar: msg.sender.avatar,
                role: msg.sender.role,
              },
              channel: msg.channel,
              attachments: msg.attachments,
              reactions: msg.reactions,
              readBy: msg.readBy || [], // Ajouter le champ readBy
              createdAt: msg.createdAt,
              editedAt: msg.editedAt,
            })),
            hasMore: false,
          })

          console.log(
            `📺 ${user.userName} a rejoint le channel: ${channel.name}`
          )
        } catch (error) {
          console.error('Erreur join channel:', error)
          socket.emit('error', {
            message: 'Erreur lors de la connexion au channel',
          })
        }
      })

      // Quitter un channel
      socket.on('leave_channel', (data) => {
        const { channelId } = data
        socket.leave(`channel:${channelId}`)
        console.log(`📺 ${user.userName} a quitté le channel: ${channelId}`)
      })

      // Réactions aux messages
      socket.on('add_reaction', async (data) => {
        try {
          const { messageId, emoji } = data

          const message = await Message.findById(messageId)
          if (!message) {
            socket.emit('error', { message: 'Message non trouvé' })
            return
          }

          // Vérifier l'accès au channel
          const channel = await Channel.findById(message.channel)
          if (
            !channel ||
            !channel.members.some((m) => m.user.toString() === user.userId)
          ) {
            socket.emit('error', { message: 'Accès refusé' })
            return
          }

          // Ajouter ou retirer la réaction
          const existingReaction = message.reactions.find(
            (r) => r.emoji === emoji && r.users.includes(user.userId)
          )

          if (existingReaction) {
            // Retirer la réaction
            existingReaction.users = existingReaction.users.filter(
              (id) => id !== user.userId
            )
            if (existingReaction.users.length === 0) {
              message.reactions = message.reactions.filter(
                (r) => r.emoji !== emoji
              )
            }
          } else {
            // Ajouter la réaction
            const reactionIndex = message.reactions.findIndex(
              (r) => r.emoji === emoji
            )
            if (reactionIndex >= 0) {
              message.reactions[reactionIndex].users.push(user.userId)
            } else {
              message.reactions.push({ emoji, users: [user.userId] })
            }
          }

          await message.save()

          // Diffuser la mise à jour
          io.to(`channel:${message.channel}`).emit('reaction_updated', {
            messageId,
            reactions: message.reactions,
          })
        } catch (error) {
          console.error('Erreur réaction:', error)
          socket.emit('error', {
            message: "Erreur lors de l'ajout de la réaction",
          })
        }
      })

      // Demande de la liste des utilisateurs en ligne
      socket.on('request_online_users', async () => {
        try {
          console.log(
            `📋 ${user.userName} (${user.userRole}) demande la liste des utilisateurs en ligne`
          )

          const onlineUsers = await User.find({ isOnline: true }).select(
            '_id name firstName lastName role'
          )
          const onlineUsersList = onlineUsers
            .filter((u) => u._id.toString() !== user.userId) // Exclure l'utilisateur actuel
            .map((u) => ({
              userId: u._id.toString(),
              userName:
                u.firstName && u.lastName
                  ? `${u.firstName} ${u.lastName}`
                  : u.name,
              userRole: u.role,
              status: 'online',
              lastSeen: new Date(),
            }))

          console.log(
            `📋 Envoi à ${user.userName} (${user.userRole}):`,
            onlineUsersList.map((u) => `${u.userName} (${u.userRole})`)
          )

          // ENVOI GROUPÉ pour éviter les conflits avec les événements individuels
          socket.emit('online_users_list', {
            users: onlineUsersList,
            timestamp: new Date(),
          })

          // NE PLUS envoyer individuellement pour éviter les doublons et conflits
          // Les événements user_presence individuels seront uniquement pour les changements en temps réel
        } catch (error) {
          console.error('Erreur demande liste utilisateurs en ligne:', error)
        }
      })

      // Marquer les messages comme lus
      socket.on('mark_read', async (data) => {
        try {
          const { channelId, messageIds } = data
          console.log(
            `👁️ ${user.userName} marque ${messageIds.length} messages comme lus dans channel ${channelId}`
          )

          const updateResult = await Message.updateMany(
            {
              _id: { $in: messageIds },
              channel: channelId,
              'readBy.user': { $ne: user.userId },
            },
            {
              $push: {
                readBy: { user: user.userId, readAt: new Date() },
              },
            }
          )

          console.log(
            `✅ ${updateResult.modifiedCount} messages mis à jour en base`
          )

          // Diffuser à tous les autres utilisateurs du channel
          const readEvent = {
            userId: user.userId,
            messageIds,
            readAt: new Date().toISOString(),
          }

          socket.to(`channel:${channelId}`).emit('messages_read', readEvent)
          console.log(
            `📢 Événement messages_read diffusé pour channel ${channelId}:`,
            readEvent
          )

          // Récupérer le type de channel pour l'événement
          const channel = await Channel.findById(channelId).select('type')

          // Émettre notification de lecture à TOUTES les sessions de l'utilisateur
          io.to(`user:${user.userId}`).emit('notifications_read', {
            userId: user.userId,
            channelId: channelId,
            channelType: channel?.type || 'public',
          })

          console.log(
            `📢 Notification 'notifications_read' diffusée à user:${user.userId} pour channel ${channelId}`
          )
        } catch (error) {
          console.error('Erreur mark read:', error)
        }
      })

      // Déconnexion - Logique simplifiée et robuste
      socket.on('disconnect', async (reason) => {
        console.log(`👋 ${user.userName} s'est déconnecté (raison: ${reason})`)

        // Délai réduit pour une meilleure réactivité
        const DISCONNECT_DELAY = 2000 // 2 secondes au lieu de 5

        // Délai avant de marquer hors ligne (gérer les reconnexions rapides)
        setTimeout(async () => {
          try {
            const timestamp = new Date().toLocaleTimeString()
            console.log(
              `⏰ [${timestamp}] Vérification déconnexion pour ${user.userName}...`
            )

            // Vérifier si l'utilisateur a d'autres sockets actives
            const userSockets = await io
              .in(`user:${user.userId}`)
              .fetchSockets()
            console.log(
              `🔍 [${timestamp}] Sockets actives pour ${user.userName}:`,
              userSockets.length
            )

            if (userSockets.length === 0) {
              // Vraiment déconnecté - Mise à jour DB avec gestion d'erreurs
              try {
                const updateResult = await User.findByIdAndUpdate(
                  user.userId,
                  {
                    isOnline: false,
                    lastActive: new Date(),
                  },
                  { new: true } // Retourner le document mis à jour
                )

                if (updateResult) {
                  console.log(
                    `✅ [${timestamp}] ${user.userName} marqué comme hors ligne dans la DB`
                  )

                  // Broadcast uniquement si la DB a été mise à jour avec succès
                  io.emit('user_presence', {
                    userId: user.userId,
                    status: 'offline',
                    lastSeen: new Date(),
                  })
                  console.log(
                    `📢 [${timestamp}] Statut OFFLINE diffusé pour ${user.userName}`
                  )
                } else {
                  console.error(
                    `❌ [${timestamp}] Utilisateur ${user.userId} non trouvé en DB`
                  )
                }
              } catch (dbError) {
                console.error(
                  `❌ [${timestamp}] Erreur mise à jour DB pour ${user.userName}:`,
                  dbError
                )
              }
            } else {
              console.log(
                `🔄 [${timestamp}] ${user.userName} a d'autres connexions actives, statut en ligne maintenu`
              )
            }
          } catch (error) {
            console.error(
              `❌ Erreur lors de la vérification de déconnexion:`,
              error
            )
          }
        }, DISCONNECT_DELAY)

        console.log(
          `⏰ Vérification de déconnexion programmée pour ${user.userName} dans ${DISCONNECT_DELAY}ms`
        )
      })
    })

    res.socket.server.io = io
    console.log('✅ Serveur Socket.IO initialisé')
  } else {
    console.log("♻️  Serveur Socket.IO déjà en cours d'exécution")
  }

  res.end()
}
