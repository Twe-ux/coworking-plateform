#!/usr/bin/env node

/**
 * Script pour chercher un utilisateur par email
 */

const mongoose = require('mongoose')

async function findUserByEmail() {
  try {
    const email = process.argv[2]
    if (!email) {
      console.log('Usage: node find-user-by-email.js <email>')
      return
    }

    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/coworking-platform')
    console.log('✅ Connecté à MongoDB')

    const db = mongoose.connection.db
    const usersCollection = db.collection('users')

    // Chercher l'utilisateur par email
    const user = await usersCollection.findOne({ email: email })
    
    if (user) {
      console.log(`✅ Utilisateur trouvé pour ${email}:`)
      console.log('   ID:', user._id.toString())
      console.log('   Email:', user.email)
      console.log('   Name:', user.name)
      console.log('   FirstName:', user.firstName)
      console.log('   LastName:', user.lastName)
      console.log('   Role:', user.role)
    } else {
      console.log(`❌ Aucun utilisateur trouvé pour ${email}`)
    }

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await mongoose.disconnect()
    console.log('🔚 Déconnecté de MongoDB')
  }
}

findUserByEmail()