#!/usr/bin/env node

/**
 * Script pour créer le channel test manquant
 */

const mongoose = require('mongoose')

async function createTestChannel() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/coworking-platform')
    console.log('✅ Connecté à MongoDB')

    const db = mongoose.connection.db
    const channelsCollection = db.collection('channels')
    const usersCollection = db.collection('users')

    // Trouver l'utilisateur admin
    const adminUser = await usersCollection.findOne({ role: 'admin' })
    
    if (!adminUser) {
      console.log('❌ Utilisateur admin non trouvé')
      return
    }

    console.log('👤 Utilisateur admin trouvé:', adminUser.name)

    // Vérifier si le channel test existe déjà
    const existingChannel = await channelsCollection.findOne({ 
      name: 'Test',
      isDeleted: { $ne: true }
    })

    if (existingChannel) {
      console.log('✅ Channel Test existe déjà')
      return
    }

    // Créer le channel Test
    const newChannel = {
      name: 'Test',
      slug: 'test',
      description: 'Channel de test pour la messagerie',
      type: 'public',
      isArchived: false,
      isDeleted: false,
      isActive: true,
      
      members: [{
        user: adminUser._id,
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
      
      createdBy: adminUser._id,
      lastActivity: new Date(),
      messageCount: 0,
      tags: ['public'],
      
      audit: {
        createdAt: new Date(),
        updatedAt: new Date(),
        lastModifiedBy: adminUser._id
      }
    }

    const result = await channelsCollection.insertOne(newChannel)
    console.log('✅ Channel Test créé avec ID:', result.insertedId)

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await mongoose.disconnect()
    console.log('🔚 Déconnecté de MongoDB')
  }
}

createTestChannel()