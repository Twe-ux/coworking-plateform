const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')
const { getServerSession } = require('next-auth')
const mongoose = require('mongoose')

const dev = process.env.NODE_ENV !== 'production'
const hostname = dev ? 'localhost' : '0.0.0.0'
const port = process.env.PORT || 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// Socket.IO server state
const userConnections = new Map() // userId -> socketId
const socketUsers = new Map() // socketId -> userId
const typingUsers = new Map() // channelId-userId -> typing data

// Connect to MongoDB
async function connectMongoDB() {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/coworking')
      console.log('📊 MongoDB connected for Socket.IO server')
    }
    return mongoose.connection.db
  } catch (error) {
    console.error('❌ MongoDB connection error:', error)
    return null
  }
}

// Calculate and send notification counts to user
async function sendNotificationCounts(socket, userId) {
  try {
    const db = await connectMongoDB()
    if (!db) return

    console.log('🔔 Calculating notification counts for user:', userId)

    // Find all channels the user is member of
    const channels = await db.collection('channels').find({
      'members.user': new mongoose.Types.ObjectId(userId),
      isDeleted: { $ne: true }
    }).toArray()

    let totalUnread = 0
    let messagesDMs = 0
    let channelsCount = 0
    const channelBreakdown = {}

    for (const channel of channels) {
      // Count unread messages in this channel
      const unreadCount = await db.collection('messages').countDocuments({
        channel: channel._id,
        'readBy.user': { $ne: new mongoose.Types.ObjectId(userId) }
      })

      if (unreadCount > 0) {
        channelBreakdown[channel._id.toString()] = unreadCount
        totalUnread += unreadCount

        if (channel.type === 'direct') {
          messagesDMs += unreadCount
        } else {
          channelsCount += unreadCount
        }
      }
    }

    const counts = {
      totalUnread,
      messagesDMs,
      channels: channelsCount,
      channelBreakdown
    }

    console.log('🔔 Sending initial notification counts:', counts)
    socket.emit('initial_notification_counts', counts)

  } catch (error) {
    console.error('❌ Error calculating notification counts:', error)
  }
}

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  // Initialize Socket.IO
  const io = new Server(server, {
    path: '/api/socket/',
    cors: {
      origin: dev 
        ? 'http://localhost:3000' 
        : [
            process.env.NEXTAUTH_URL,
            process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
            'https://*.northflank.app',
            'https://coworking-plateform.vercel.app'
          ].filter(Boolean),
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000
  })

  io.on('connection', (socket) => {
    console.log(`🔌 Socket.IO client connected: ${socket.id}`)

    // Authentication handler
    socket.on('authenticate', async (auth) => {
      try {
        const { userId, userName, userEmail, userRole } = auth
        
        if (!userId || !userName) {
          socket.emit('error', { message: 'Authentication failed: missing credentials' })
          return
        }

        // Store connection mappings
        userConnections.set(userId, socket.id)
        socketUsers.set(socket.id, userId)
        socket.data.userId = userId
        socket.data.userName = userName
        socket.data.userEmail = userEmail
        socket.data.userRole = userRole

        console.log(`🔐 User authenticated: ${userName} (${userId})`)

        // Update user online status
        const db = await connectMongoDB()
        if (db) {
          await db.collection('users').updateOne(
            { _id: new mongoose.Types.ObjectId(userId) },
            { 
              $set: { 
                isOnline: true, 
                lastActive: new Date() 
              } 
            }
          )
        }

        // Notify others of user coming online
        socket.broadcast.emit('user_presence', {
          userId,
          userName,
          status: 'online'
        })

        // Send list of online users to the new connection
        const onlineUsers = Array.from(userConnections.entries()).map(([uid, sid]) => {
          const userSocket = io.sockets.sockets.get(sid)
          return {
            userId: uid,
            userName: userSocket?.data?.userName || 'Unknown',
            userEmail: userSocket?.data?.userEmail || ''
          }
        })

        socket.emit('online_users_list', { users: onlineUsers })
        socket.emit('authenticated', { success: true })

        // Send initial notification counts
        await sendNotificationCounts(socket, userId)

      } catch (error) {
        console.error('❌ Authentication error:', error)
        socket.emit('error', { message: 'Authentication failed' })
      }
    })

    // Join channel/room
    socket.on('join_channel', async (data) => {
      try {
        const { channelId } = data
        const userId = socket.data.userId

        if (!userId || !channelId) {
          socket.emit('error', { message: 'Missing userId or channelId' })
          return
        }

        console.log(`🚪 User ${socket.data.userName} joining channel: ${channelId}`)

        // Verify user has access to channel
        const db = await connectMongoDB()
        if (!db) {
          socket.emit('error', { message: 'Database connection failed' })
          return
        }

        const channel = await db.collection('channels').findOne({
          _id: new mongoose.Types.ObjectId(channelId),
          'members.user': new mongoose.Types.ObjectId(userId),
          isDeleted: { $ne: true }
        })

        if (!channel) {
          socket.emit('error', { message: 'Channel not found or access denied' })
          return
        }

        // Join the Socket.IO room
        await socket.join(`channel:${channelId}`)

        // Load and send channel history
        const messages = await db.collection('messages')
          .aggregate([
            { $match: { channel: new mongoose.Types.ObjectId(channelId) } },
            { $sort: { createdAt: -1 } },
            { $limit: 50 },
            {
              $lookup: {
                from: 'users',
                localField: 'sender',
                foreignField: '_id',
                as: 'sender'
              }
            },
            { $unwind: '$sender' }
          ])
          .toArray()

        const formattedMessages = messages.reverse().map(msg => ({
          _id: msg._id,
          content: msg.content,
          messageType: msg.messageType,
          sender: {
            _id: msg.sender._id,
            name: msg.sender.firstName && msg.sender.lastName 
              ? `${msg.sender.firstName} ${msg.sender.lastName}`
              : msg.sender.name,
            firstName: msg.sender.firstName,
            lastName: msg.sender.lastName,
            avatar: msg.sender.avatar,
            email: msg.sender.email
          },
          channel: msg.channel,
          attachments: msg.attachments || [],
          reactions: msg.reactions || [],
          readBy: msg.readBy || [],
          createdAt: msg.createdAt
        }))

        socket.emit('channel_history', {
          channelId,
          messages: formattedMessages,
          hasMore: messages.length === 50
        })

      } catch (error) {
        console.error('❌ Join channel error:', error)
        socket.emit('error', { message: 'Failed to join channel' })
      }
    })

    // Leave channel/room
    socket.on('leave_channel', async (data) => {
      const { channelId } = data
      console.log(`🚪 User ${socket.data.userName} leaving channel: ${channelId}`)
      await socket.leave(`channel:${channelId}`)
    })

    // Send message
    socket.on('send_message', async (data) => {
      try {
        const { channelId, content, messageType = 'text', attachments = [] } = data
        const userId = socket.data.userId
        const userName = socket.data.userName

        if (!userId || !channelId || !content?.trim()) {
          socket.emit('error', { message: 'Missing required fields' })
          return
        }

        console.log(`📤 Message from ${userName} to channel ${channelId}: ${content.substring(0, 50)}...`)

        const db = await connectMongoDB()
        if (!db) {
          socket.emit('error', { message: 'Database connection failed' })
          return
        }

        // Verify channel access
        const channel = await db.collection('channels').findOne({
          _id: new mongoose.Types.ObjectId(channelId),
          'members.user': new mongoose.Types.ObjectId(userId),
          isDeleted: { $ne: true }
        })

        if (!channel) {
          socket.emit('error', { message: 'Channel not found or access denied' })
          return
        }

        // Get user info
        const user = await db.collection('users').findOne({
          _id: new mongoose.Types.ObjectId(userId)
        })

        if (!user) {
          socket.emit('error', { message: 'User not found' })
          return
        }

        // Create message document
        const messageDoc = {
          content: content.trim(),
          messageType,
          sender: new mongoose.Types.ObjectId(userId),
          channel: new mongoose.Types.ObjectId(channelId),
          attachments,
          reactions: [],
          readBy: [{ user: new mongoose.Types.ObjectId(userId), readAt: new Date() }],
          createdAt: new Date(),
          updatedAt: new Date()
        }

        // Insert message
        const messageResult = await db.collection('messages').insertOne(messageDoc)

        // Update channel last activity
        await db.collection('channels').updateOne(
          { _id: new mongoose.Types.ObjectId(channelId) },
          { 
            $set: { lastActivity: new Date() },
            $inc: { messageCount: 1 }
          }
        )

        // Format message for broadcast
        const newMessage = {
          _id: messageResult.insertedId,
          content: messageDoc.content,
          messageType: messageDoc.messageType,
          sender: {
            _id: user._id,
            name: user.firstName && user.lastName 
              ? `${user.firstName} ${user.lastName}`
              : user.name,
            firstName: user.firstName,
            lastName: user.lastName,
            avatar: user.avatar,
            email: user.email
          },
          channel: channelId,
          attachments: messageDoc.attachments,
          reactions: messageDoc.reactions,
          readBy: messageDoc.readBy,
          createdAt: messageDoc.createdAt
        }

        // Broadcast message to all channel members instantly
        io.to(`channel:${channelId}`).emit('new_message', newMessage)

        // Send notifications to channel members (except sender)
        const channelMembers = channel.members || []
        for (const member of channelMembers) {
          const memberId = member.user.toString()
          if (memberId !== userId) {
            const memberSocketId = userConnections.get(memberId)
            if (memberSocketId) {
              io.to(memberSocketId).emit('notification_increment', {
                userId: memberId,
                channelId,
                channelType: channel.type,
                increment: 1,
                senderName: newMessage.sender.name,
                previewText: content.substring(0, 100)
              })
            }
          }
        }

        console.log(`✅ Message sent and broadcasted to channel ${channelId}`)

      } catch (error) {
        console.error('❌ Send message error:', error)
        socket.emit('error', { message: 'Failed to send message' })
      }
    })

    // Typing indicators
    socket.on('typing_start', (data) => {
      const { channelId } = data
      const userId = socket.data.userId
      const userName = socket.data.userName

      if (!channelId || !userId) return

      const key = `${channelId}-${userId}`
      typingUsers.set(key, {
        userId,
        userName,
        timestamp: Date.now()
      })

      // Broadcast to channel (except sender)
      socket.to(`channel:${channelId}`).emit('user_typing', {
        userId,
        userName,
        channelId,
        isTyping: true
      })
    })

    socket.on('typing_stop', (data) => {
      const { channelId } = data
      const userId = socket.data.userId
      const userName = socket.data.userName

      if (!channelId || !userId) return

      const key = `${channelId}-${userId}`
      typingUsers.delete(key)

      // Broadcast to channel (except sender)
      socket.to(`channel:${channelId}`).emit('user_typing', {
        userId,
        userName,
        channelId,
        isTyping: false
      })
    })

    // Mark messages as read
    socket.on('mark_read', async (data) => {
      try {
        const { channelId, messageIds } = data
        const userId = socket.data.userId

        if (!userId || !channelId || !messageIds?.length) return

        const db = await connectMongoDB()
        if (!db) return

        // Update read status
        const result = await db.collection('messages').updateMany(
          {
            _id: { $in: messageIds.map(id => new mongoose.Types.ObjectId(id)) },
            channel: new mongoose.Types.ObjectId(channelId),
            'readBy.user': { $ne: new mongoose.Types.ObjectId(userId) }
          },
          {
            $push: {
              readBy: { user: new mongoose.Types.ObjectId(userId), readAt: new Date() }
            }
          }
        )

        if (result.modifiedCount > 0) {
          // Get channel type for proper notification handling
          const channel = await db.collection('channels').findOne({
            _id: new mongoose.Types.ObjectId(channelId)
          })

          // Broadcast read status to channel
          io.to(`channel:${channelId}`).emit('messages_read', {
            userId,
            messageIds,
            readAt: new Date().toISOString()
          })

          // Send notification reset to the user with correct channel type
          socket.emit('notifications_read', {
            userId,
            channelId,
            channelType: channel?.type || 'public'
          })

          console.log(`✅ ${result.modifiedCount} messages marked as read by ${socket.data.userName} in ${channel?.type || 'unknown'} channel`)
        }

      } catch (error) {
        console.error('❌ Mark read error:', error)
      }
    })

    // Handle disconnection
    socket.on('disconnect', async (reason) => {
      const userId = socket.data.userId
      const userName = socket.data.userName

      console.log(`👋 Socket.IO client disconnected: ${socket.id} (${userName}) - ${reason}`)

      if (userId) {
        // Clean up connection mappings
        userConnections.delete(userId)
        socketUsers.delete(socket.id)

        // Clean up typing indicators
        for (const [key, typing] of typingUsers.entries()) {
          if (typing.userId === userId) {
            typingUsers.delete(key)
          }
        }

        // Update user offline status after delay
        setTimeout(async () => {
          // Check if user has reconnected
          if (!userConnections.has(userId)) {
            try {
              const db = await connectMongoDB()
              if (db) {
                await db.collection('users').updateOne(
                  { _id: new mongoose.Types.ObjectId(userId) },
                  { 
                    $set: { 
                      isOnline: false, 
                      lastActive: new Date() 
                    } 
                  }
                )

                // Notify others of user going offline
                socket.broadcast.emit('user_presence', {
                  userId,
                  userName,
                  status: 'offline',
                  lastSeen: new Date()
                })

                console.log(`✅ User ${userName} marked as offline`)
              }
            } catch (error) {
              console.error('❌ Error updating offline status:', error)
            }
          }
        }, 5000) // 5 second delay to allow for reconnection
      }
    })

    // Request online users
    socket.on('request_online_users', () => {
      const onlineUsers = Array.from(userConnections.entries()).map(([uid, sid]) => {
        const userSocket = io.sockets.sockets.get(sid)
        return {
          userId: uid,
          userName: userSocket?.data?.userName || 'Unknown',
          userEmail: userSocket?.data?.userEmail || ''
        }
      })

      socket.emit('online_users_list', { users: onlineUsers })
    })
  })

  server
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
      console.log(`🚀 Socket.IO server running on port ${port}`)
    })
})