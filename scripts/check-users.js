#!/usr/bin/env node

/**
 * Script pour vérifier les utilisateurs existants
 */

const mongoose = require('mongoose')

async function checkUsers() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/coworking-platform')
    console.log('✅ Connecté à MongoDB')

    const db = mongoose.connection.db
    const usersCollection = db.collection('users')

    // Lister tous les utilisateurs
    const users = await usersCollection.find({}).toArray()
    
    console.log(`📊 Nombre d'utilisateurs trouvés: ${users.length}`)
    
    users.forEach((user, index) => {
      console.log(`\n👤 Utilisateur ${index + 1}:`)
      console.log('   ID:', user._id.toString())
      console.log('   Email:', user.email)
      console.log('   Name:', user.name)
      console.log('   FirstName:', user.firstName)
      console.log('   LastName:', user.lastName)
      console.log('   Role:', user.role)
    })

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await mongoose.disconnect()
    console.log('🔚 Déconnecté de MongoDB')
  }
}

checkUsers()