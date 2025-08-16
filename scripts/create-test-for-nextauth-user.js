#!/usr/bin/env node

/**
 * Script pour créer le channel Test pour l'utilisateur NextAuth
 */

const mongoose = require('mongoose')

async function createTestForNextAuthUser() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/coworking-platform')
    console.log('✅ Connecté à MongoDB')

    const db = mongoose.connection.db
    const channelsCollection = db.collection('channels')

    // L'ID utilisateur qui apparaît dans les logs NextAuth
    const nextAuthUserId = '689377c667fd70e1283b0377'
    
    console.log('👤 Création channel Test pour utilisateur NextAuth:', nextAuthUserId)

    // Supprimer tous les anciens channels Test
    await channelsCollection.deleteMany({ name: 'Test' })
    console.log('🗑️ Anciens channels Test supprimés')

    // Créer le channel Test pour l'utilisateur NextAuth
    const newChannel = {
      name: 'Test',
      slug: 'test',
      description: 'Channel de test pour la messagerie',
      type: 'public',
      isArchived: false,
      isDeleted: false,
      isActive: true,
      
      members: [{
        user: new mongoose.Types.ObjectId(nextAuthUserId),
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
      
      createdBy: new mongoose.Types.ObjectId(nextAuthUserId),
      lastActivity: new Date(),
      messageCount: 0,
      tags: ['public'],
      
      audit: {
        createdAt: new Date(),
        updatedAt: new Date(),
        lastModifiedBy: new mongoose.Types.ObjectId(nextAuthUserId)
      }
    }

    const result = await channelsCollection.insertOne(newChannel)
    console.log('✅ Channel Test créé pour NextAuth user:', result.insertedId)
    console.log('👥 Membre autorisé:', nextAuthUserId)

    // Maintenant corrigeons Socket.IO pour utiliser cet utilisateur
    console.log('\n🔧 Il faut maintenant corriger Socket.IO pour utiliser cet ID utilisateur')
    console.log('   ID à utiliser dans Socket.IO:', nextAuthUserId)

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await mongoose.disconnect()
    console.log('🔚 Déconnecté de MongoDB')
  }
}

createTestForNextAuthUser()