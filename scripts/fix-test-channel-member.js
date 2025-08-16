#!/usr/bin/env node

/**
 * Script pour corriger l'appartenance au channel Test
 */

const mongoose = require('mongoose')

async function fixTestChannelMember() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/coworking-platform')
    console.log('✅ Connecté à MongoDB')

    const db = mongoose.connection.db
    const channelsCollection = db.collection('channels')
    const usersCollection = db.collection('users')

    // Trouver l'utilisateur admin
    const adminUser = await usersCollection.findOne({ email: 'admin@test.com' })
    
    if (!adminUser) {
      console.log('❌ Utilisateur admin non trouvé')
      return
    }

    console.log('👤 Utilisateur admin trouvé:', adminUser.name, adminUser._id)

    // Trouver le channel Test
    const testChannel = await channelsCollection.findOne({ name: 'Test' })
    
    if (!testChannel) {
      console.log('❌ Channel Test non trouvé')
      return
    }

    console.log('📋 Channel Test trouvé:', testChannel._id)
    console.log('👥 Membres actuels:', testChannel.members?.length || 0)

    // Vérifier si l'admin est déjà membre
    const isAlreadyMember = testChannel.members?.some(
      member => member.user.toString() === adminUser._id.toString()
    )

    if (isAlreadyMember) {
      console.log('✅ Admin déjà membre du channel Test')
    } else {
      console.log('🔧 Ajout de l\'admin au channel Test...')
      
      // Ajouter l'admin aux membres
      const newMember = {
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
      }

      await channelsCollection.updateOne(
        { _id: testChannel._id },
        { 
          $push: { members: newMember },
          $set: { 'audit.updatedAt': new Date() }
        }
      )

      console.log('✅ Admin ajouté au channel Test')
    }

    // Vérification finale
    const updatedChannel = await channelsCollection.findOne({ name: 'Test' })
    console.log('📋 Membres finaux:', updatedChannel.members?.length || 0)
    
    updatedChannel.members?.forEach(member => {
      console.log(`   - Utilisateur: ${member.user} (${member.role})`)
    })

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await mongoose.disconnect()
    console.log('🔚 Déconnecté de MongoDB')
  }
}

fixTestChannelMember()