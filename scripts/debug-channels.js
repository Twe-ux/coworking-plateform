#!/usr/bin/env node

/**
 * Script de debug pour vérifier les channels et messages
 */

const mongoose = require('mongoose')

async function debugChannels() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/coworking-platform')
    console.log('✅ Connecté à MongoDB')

    const db = mongoose.connection.db
    const channelsCollection = db.collection('channels')
    const messagesCollection = db.collection('messages')

    // Lister tous les channels
    console.log('\n📋 Channels dans la base:')
    const channels = await channelsCollection.find({}).toArray()
    
    for (const channel of channels) {
      console.log(`\n🔹 ${channel.name} (${channel._id})`)
      console.log(`   Type: ${channel.type}`)
      console.log(`   Membres: ${channel.members?.length || 0}`)
      console.log(`   Actif: ${channel.isActive}`)
      console.log(`   Supprimé: ${channel.isDeleted || false}`)
      
      // Compter les messages pour ce channel
      const messageCount = await messagesCollection.countDocuments({ 
        channel: channel._id,
        isDeleted: { $ne: true }
      })
      console.log(`   Messages: ${messageCount}`)
      
      // Afficher les derniers messages
      if (messageCount > 0) {
        const lastMessages = await messagesCollection
          .find({ 
            channel: channel._id,
            isDeleted: { $ne: true }
          })
          .sort({ createdAt: -1 })
          .limit(3)
          .toArray()
          
        console.log(`   Derniers messages:`)
        lastMessages.forEach(msg => {
          console.log(`     - "${msg.content}" (${new Date(msg.createdAt).toLocaleString()})`)
        })
      }
    }

    // Vérifier le channel "test" spécifiquement
    console.log('\n🔍 Debug channel "test":')
    const testChannel = await channelsCollection.findOne({ 
      $or: [
        { name: /test/i },
        { slug: /test/i }
      ]
    })
    
    if (testChannel) {
      console.log('✅ Channel test trouvé:', testChannel._id)
      console.log('   Nom:', testChannel.name)
      console.log('   Slug:', testChannel.slug)
      console.log('   Actif:', testChannel.isActive)
      console.log('   Supprimé:', testChannel.isDeleted)
      
      const testMessages = await messagesCollection.find({ 
        channel: testChannel._id 
      }).toArray()
      console.log('   Messages totaux:', testMessages.length)
      
      testMessages.forEach(msg => {
        console.log(`   - "${msg.content}" (supprimé: ${msg.isDeleted || false})`)
      })
    } else {
      console.log('❌ Aucun channel test trouvé')
    }

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await mongoose.disconnect()
    console.log('\n🔚 Déconnecté de MongoDB')
  }
}

debugChannels()