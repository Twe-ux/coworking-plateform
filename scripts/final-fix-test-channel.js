#!/usr/bin/env node

/**
 * Script pour corriger définitivement le channel Test
 */

const mongoose = require('mongoose')

async function finalFixTestChannel() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/coworking-platform')
    console.log('✅ Connecté à MongoDB')

    const db = mongoose.connection.db
    const channelsCollection = db.collection('channels')
    const usersCollection = db.collection('users')

    // Trouver l'utilisateur admin utilisé par Socket.IO
    // D'après les logs, c'est celui avec email admin@test.com
    const socketUser = await usersCollection.findOne({ email: 'admin@test.com' })
    
    if (!socketUser) {
      console.log('❌ Utilisateur Socket.IO non trouvé')
      return
    }

    console.log('👤 Utilisateur Socket.IO correct:', socketUser.name, socketUser._id)

    // Supprimer tous les channels Test existants
    await channelsCollection.deleteMany({ name: 'Test' })
    console.log('🗑️ Anciens channels Test supprimés')

    // Créer le channel Test avec le bon utilisateur Socket.IO
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
    console.log('✅ Channel Test final créé:', result.insertedId)
    console.log('👥 Membre autorisé:', socketUser._id)

    // Vérification
    console.log('\n🔍 Vérification finale:')
    console.log('   - Utilisateur Socket.IO:', socketUser._id.toString())
    console.log('   - Channel Test créé pour:', socketUser._id.toString())
    console.log('   - Correspondance:', socketUser._id.toString() === socketUser._id.toString() ? '✅' : '❌')

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await mongoose.disconnect()
    console.log('🔚 Déconnecté de MongoDB')
  }
}

finalFixTestChannel()