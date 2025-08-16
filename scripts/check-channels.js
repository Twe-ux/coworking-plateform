#!/usr/bin/env node

/**
 * Script pour vérifier les channels et leurs membres
 */

const mongoose = require('mongoose')

async function checkChannels() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/coworking-platform')
    console.log('✅ Connecté à MongoDB')

    const db = mongoose.connection.db
    const channelsCollection = db.collection('channels')

    // Lister tous les channels
    const channels = await channelsCollection.find({}).toArray()
    
    console.log(`📊 Nombre de channels trouvés: ${channels.length}`)
    
    channels.forEach((channel, index) => {
      console.log(`\n📺 Channel ${index + 1}:`)
      console.log('   ID:', channel._id.toString())
      console.log('   Name:', channel.name)
      console.log('   Type:', channel.type)
      console.log('   Description:', channel.description)
      console.log('   Members:', channel.members?.length || 0)
      
      if (channel.members) {
        channel.members.forEach((member, i) => {
          console.log(`     👤 Membre ${i + 1}:`, {
            userId: member.user?.toString(),
            role: member.role
          })
        })
      }
      
      console.log('   IsActive:', channel.isActive)
    })

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await mongoose.disconnect()
    console.log('🔚 Déconnecté de MongoDB')
  }
}

checkChannels()