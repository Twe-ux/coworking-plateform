#!/usr/bin/env node

/**
 * Script pour débugger les utilisateurs
 */

const mongoose = require('mongoose')

async function debugUsers() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/coworking-platform')
    console.log('✅ Connecté à MongoDB')

    const db = mongoose.connection.db
    const usersCollection = db.collection('users')

    // Lister tous les utilisateurs
    console.log('\n👥 Utilisateurs dans la base:')
    const users = await usersCollection.find({}).toArray()
    
    users.forEach(user => {
      console.log(`🔹 ${user.name} (${user._id})`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Role: ${user.role}`)
      console.log('')
    })

    // Celui utilisé par Socket.IO
    console.log('🔍 Utilisateur utilisé par Socket.IO:')
    console.log('   ID: 68a0890d755fd164249625aa')
    
    const socketUser = await usersCollection.findOne({ 
      _id: new mongoose.Types.ObjectId('68a0890d755fd164249625aa') 
    })
    
    if (socketUser) {
      console.log(`   ✅ Trouvé: ${socketUser.name} (${socketUser.email})`)
    } else {
      console.log('   ❌ Non trouvé')
    }

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await mongoose.disconnect()
    console.log('🔚 Déconnecté de MongoDB')
  }
}

debugUsers()