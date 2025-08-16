#!/usr/bin/env node

/**
 * Script pour nettoyer et corriger le channel Test
 */

const mongoose = require('mongoose')

async function cleanTestChannel() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/coworking-platform')
    console.log('✅ Connecté à MongoDB')

    const db = mongoose.connection.db
    const channelsCollection = db.collection('channels')
    const usersCollection = db.collection('users')

    // Trouver l'utilisateur admin (celui utilisé par Socket.IO)
    const socketUser = await usersCollection.findOne({ email: 'admin@test.com' })
    
    if (!socketUser) {
      console.log('❌ Utilisateur Socket.IO non trouvé')
      return
    }

    console.log('👤 Utilisateur Socket.IO:', socketUser.name, socketUser._id)

    // Supprimer l'ancien channel Test et le recréer proprement
    await channelsCollection.deleteMany({ name: 'Test' })
    console.log('🗑️ Ancien channel Test supprimé')

    // Créer le nouveau channel Test avec le bon utilisateur
    const newChannel = {
      name: 'Test',
      slug: 'test',
      description: 'Channel de test pour la messagerie',
      type: 'public',
      isArchived: false,
      isDeleted: false,
      isActive: true,
      
      members: [{
        user: socketUser._id,
        role: 'admin',
        joinedAt: new Date(),
        isMuted: false,
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
        slowModeSeconds: 0,
        requireApproval: false,
        isReadOnly: false,
        maxMembers: 1000
      },
      
      ipRestrictions: {
        enabled: false,
        allowedIPs: [],
        blockedIPs: [],
        whitelist: []
      },
      
      aiSettings: {
        enabled: false,
        provider: 'openai',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 1000,
        systemPrompt: undefined
      },
      
      createdBy: socketUser._id,
      lastActivity: new Date(),
      messageCount: 0,
      tags: ['public'],
      
      audit: {
        createdAt: new Date(),
        updatedAt: new Date(),
        lastModifiedBy: socketUser._id
      }
    }

    const result = await channelsCollection.insertOne(newChannel)
    console.log('✅ Nouveau channel Test créé:', result.insertedId)
    console.log('👥 Membre:', socketUser._id)

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await mongoose.disconnect()
    console.log('🔚 Déconnecté de MongoDB')
  }
}

cleanTestChannel()