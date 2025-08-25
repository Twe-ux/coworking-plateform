import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectMongoose } from '@/lib/mongoose'
import mongoose from 'mongoose'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 API création channel simple...')

    // Vérification de session
    const session = await getServerSession(authOptions)
    console.log('📋 Session:', session?.user?.email || 'Aucune session')

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non authentifié', message: 'Session requise' },
        { status: 401 }
      )
    }

    // Connexion DB
    await connectMongoose()
    console.log('✅ Connecté à MongoDB')

    // Récupérer les données
    const body = await request.json()
    console.log('📦 Données reçues:', body)

    const { name, type = 'public', description = '', targetUserId } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Validation', message: 'Le nom du channel est requis' },
        { status: 400 }
      )
    }

    // Créer le channel avec mongoose direct
    const db = mongoose.connection.db
    const channelsCollection = db.collection('channels')
    const usersCollection = db.collection('users')

    // Trouver l'utilisateur
    const user = await usersCollection.findOne({ email: session.user.email })
    console.log('👤 Utilisateur trouvé:', user?.name)

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé', message: 'Utilisateur invalide' },
        { status: 404 }
      )
    }

    // Pour les DMs, vérifier si une conversation existe déjà entre ces utilisateurs
    if (type === 'direct' && targetUserId) {
      const targetObjectId = new mongoose.Types.ObjectId(targetUserId)
      const userObjectId = user._id

      const existingDM = await channelsCollection.findOne({
        type: 'direct',
        isDeleted: { $ne: true },
        $and: [
          { 'members.user': userObjectId },
          { 'members.user': targetObjectId },
        ],
      })

      if (existingDM) {
        console.log('📨 DM existant trouvé:', existingDM._id)
        return NextResponse.json({
          success: true,
          channel: existingDM,
          message: 'Conversation directe récupérée',
        })
      }
    } else {
      // Pour les autres types de channels, vérifier par nom
      const existingChannel = await channelsCollection.findOne({
        name: name.trim(),
        isDeleted: { $ne: true },
      })

      if (existingChannel) {
        return NextResponse.json(
          { error: 'Conflit', message: 'Un channel avec ce nom existe déjà' },
          { status: 409 }
        )
      }
    }

    // Pour les chats directs, ajouter l'utilisateur cible
    let members = [
      {
        user: user._id,
        role: type === 'direct' ? 'member' : 'admin',
        joinedAt: new Date(),
        isMuted: false,
        permissions: {
          canWrite: true,
          canAddMembers: type !== 'direct',
          canDeleteMessages: type !== 'direct',
          canModerate: type !== 'direct',
        },
      },
    ]

    // Si c'est un chat direct, ajouter l'utilisateur cible
    let finalName = name.trim()
    if (type === 'direct' && targetUserId) {
      const targetUser = await usersCollection.findOne({
        _id: new mongoose.Types.ObjectId(targetUserId),
      })
      if (targetUser) {
        members.push({
          user: targetUser._id,
          role: 'member',
          joinedAt: new Date(),
          isMuted: false,
          permissions: {
            canWrite: true,
            canAddMembers: false,
            canDeleteMessages: false,
            canModerate: false,
          },
        })

        // Créer un nom unique basé sur les IDs des utilisateurs (toujours dans le même ordre)
        const sortedIds = [user._id.toString(), targetUserId].sort()
        finalName = `DM_${sortedIds[0]}_${sortedIds[1]}`
      }
    }

    // Créer le channel
    const newChannel = {
      name: finalName,
      slug: finalName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      description: description || `Channel ${finalName}`,
      type: type,
      isArchived: false,
      isDeleted: false,
      isActive: true,

      members: members,

      settings: {
        allowFileUploads: true,
        allowReactions: true,
        slowModeSeconds: 0,
        requireApproval: false,
        isReadOnly: false,
        maxMembers: 1000,
      },

      ipRestrictions: {
        enabled: false,
        allowedIPs: [],
        blockedIPs: [],
        whitelist: [],
      },

      aiSettings: {
        enabled: type === 'ai_assistant',
        provider: 'openai',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 1000,
        systemPrompt:
          type === 'ai_assistant'
            ? 'Tu es un assistant IA spécialisé dans les espaces de coworking.'
            : undefined,
      },

      createdBy: user._id,
      lastActivity: new Date(),
      messageCount: 0,
      tags: [type],

      audit: {
        createdAt: new Date(),
        updatedAt: new Date(),
        lastModifiedBy: user._id,
      },
    }

    const result = await channelsCollection.insertOne(newChannel)
    console.log('✅ Channel créé avec ID:', result.insertedId)

    return NextResponse.json(
      {
        success: true,
        channel: {
          _id: result.insertedId,
          name: newChannel.name,
          type: newChannel.type,
          description: newChannel.description,
          createdAt: newChannel.audit.createdAt,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('❌ Erreur création channel:', error)
    return NextResponse.json(
      {
        error: 'Erreur serveur',
        message: error.message,
        details:
          process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}

// Force Node.js runtime for middleware and database compatibility
export const runtime = 'nodejs'
