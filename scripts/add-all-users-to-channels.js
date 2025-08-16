#!/usr/bin/env node

/**
 * Script pour ajouter tous les utilisateurs aux channels publics
 */

const mongoose = require('mongoose')

async function addUsersToChannels() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/coworking-platform')
    console.log('✅ Connecté à MongoDB')

    const db = mongoose.connection.db
    const channelsCollection = db.collection('channels')
    const usersCollection = db.collection('users')

    // Récupérer tous les utilisateurs actifs
    const users = await usersCollection.find({ 
      isActive: { $ne: false },
      role: { $in: ['admin', 'manager', 'staff', 'client'] }
    }).toArray()
    
    console.log(`👥 Utilisateurs trouvés: ${users.length}`)
    users.forEach(user => {
      console.log(`   - ${user.firstName || user.name || 'N/A'} ${user.lastName || ''} (${user.role}) - ID: ${user._id}`)
    })

    // Récupérer tous les channels publics
    const publicChannels = await channelsCollection.find({ 
      type: 'public',
      isActive: true 
    }).toArray()
    
    console.log(`\n📺 Channels publics trouvés: ${publicChannels.length}`)
    
    for (const channel of publicChannels) {
      console.log(`\n🔄 Traitement du channel: ${channel.name}`)
      
      // Créer la liste des membres avec tous les utilisateurs
      const newMembers = users.map(user => ({
        user: user._id,
        role: user.role === 'admin' ? 'admin' : 'member',
        joinedAt: new Date()
      }))
      
      // Mettre à jour le channel
      const result = await channelsCollection.updateOne(
        { _id: channel._id },
        { 
          $set: { 
            members: newMembers,
            updatedAt: new Date()
          }
        }
      )
      
      if (result.modifiedCount > 0) {
        console.log(`✅ Channel "${channel.name}" mis à jour avec ${newMembers.length} membres`)
      } else {
        console.log(`⚠️ Channel "${channel.name}" pas modifié`)
      }
    }

    console.log('\n🎉 Tous les utilisateurs ont été ajoutés aux channels publics!')

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await mongoose.disconnect()
    console.log('🔚 Déconnecté de MongoDB')
  }
}

addUsersToChannels()