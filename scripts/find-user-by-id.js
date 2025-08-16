#!/usr/bin/env node

/**
 * Script pour chercher un utilisateur par ID
 */

const mongoose = require('mongoose')

async function findUserById() {
  try {
    const userId = process.argv[2]
    if (!userId) {
      console.log('Usage: node find-user-by-id.js <user_id>')
      return
    }

    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/coworking-platform')
    console.log('✅ Connecté à MongoDB')

    const db = mongoose.connection.db
    const usersCollection = db.collection('users')

    // Chercher l'utilisateur par ID
    const user = await usersCollection.findOne({ _id: new mongoose.Types.ObjectId(userId) })
    
    if (user) {
      console.log(`✅ Utilisateur trouvé pour ID ${userId}:`)
      console.log('   ID:', user._id.toString())
      console.log('   Email:', user.email)
      console.log('   Name:', user.name)
      console.log('   FirstName:', user.firstName)
      console.log('   LastName:', user.lastName)
      console.log('   Role:', user.role)
    } else {
      console.log(`❌ Aucun utilisateur trouvé pour ID ${userId}`)
    }

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await mongoose.disconnect()
    console.log('🔚 Déconnecté de MongoDB')
  }
}

findUserById()