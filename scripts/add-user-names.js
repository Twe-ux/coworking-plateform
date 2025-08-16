#!/usr/bin/env node

/**
 * Script pour ajouter firstName et lastName à l'utilisateur NextAuth
 */

const mongoose = require('mongoose')

async function addUserNames() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/coworking-platform')
    console.log('✅ Connecté à MongoDB')

    const db = mongoose.connection.db
    const usersCollection = db.collection('users')

    // L'ID utilisateur NextAuth (admin@example.com)
    const nextAuthUserId = '689377c667fd70e1283b0377'
    
    const result = await usersCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(nextAuthUserId) },
      { 
        $set: { 
          firstName: 'Milone',
          lastName: 'Thierry',
          name: 'Milone Thierry',
          updatedAt: new Date()
        }
      }
    )

    if (result.modifiedCount > 0) {
      console.log('✅ Utilisateur mis à jour avec firstName et lastName')
    } else {
      console.log('❌ Utilisateur non trouvé ou pas de modification')
    }

    // Vérifier le résultat
    const user = await usersCollection.findOne({ _id: new mongoose.Types.ObjectId(nextAuthUserId) })
    if (user) {
      console.log('👤 Utilisateur mis à jour:')
      console.log('   Name:', user.name)
      console.log('   FirstName:', user.firstName)
      console.log('   LastName:', user.lastName)
      console.log('   Email:', user.email)
    }

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await mongoose.disconnect()
    console.log('🔚 Déconnecté de MongoDB')
  }
}

addUserNames()