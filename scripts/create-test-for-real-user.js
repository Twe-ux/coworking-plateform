#!/usr/bin/env node

/**
 * Script pour créer le channel Test pour le vrai utilisateur connecté
 */

const mongoose = require('mongoose')

async function createTestForRealUser() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/coworking-platform')
    console.log('✅ Connecté à MongoDB')

    const db = mongoose.connection.db
    const channelsCollection = db.collection('channels')
    const usersCollection = db.collection('users')

    // Trouver l'utilisateur réel connecté (admin@coworking.com)
    const realUser = await usersCollection.findOne({ 
      email: 'admin@coworking.com'
    })
    
    if (!realUser) {
      console.log('❌ Utilisateur réel non trouvé: admin@coworking.com')
      return
    }

    console.log('👤 Utilisateur réel trouvé:', realUser.name || 'Sans nom', realUser.email)

    // Supprimer tous les anciens channels Test
    await channelsCollection.deleteMany({ name: 'Test' })
    console.log('🗑️ Anciens channels Test supprimés')

    // Créer le channel Test pour le vrai utilisateur
    const newChannel = {
      name: 'Test',
      slug: 'test',
      description: 'Channel de test pour la messagerie',
      type: 'public',
      isArchived: false,
      isDeleted: false,
      isActive: true,
      
      members: [{
        user: realUser._id,
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
      
      createdBy: realUser._id,
      lastActivity: new Date(),
      messageCount: 0,
      tags: ['public'],
      
      audit: {
        createdAt: new Date(),
        updatedAt: new Date(),
        lastModifiedBy: realUser._id
      }
    }

    const result = await channelsCollection.insertOne(newChannel)
    console.log('✅ Channel Test créé pour le vrai utilisateur:', result.insertedId)
    console.log('👥 Membre autorisé:', realUser._id)

    // Vérification finale
    console.log('\n🔍 Vérification finale:')
    console.log('   - Utilisateur connecté: admin@example.com')
    console.log('   - Channel Test créé pour:', realUser._id.toString())
    console.log('   - ID utilisateur:', realUser._id.toString())

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await mongoose.disconnect()
    console.log('🔚 Déconnecté de MongoDB')
  }
}

createTestForRealUser()