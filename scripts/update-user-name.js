#!/usr/bin/env node

/**
 * Script pour ajouter un nom à l'utilisateur admin
 */

const mongoose = require('mongoose')

async function updateUserName() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/coworking-platform')
    console.log('✅ Connecté à MongoDB')

    const db = mongoose.connection.db
    const usersCollection = db.collection('users')

    // Mettre à jour l'utilisateur avec l'ID NextAuth
    const nextAuthUserId = '689377c667fd70e1283b0377'
    
    const result = await usersCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(nextAuthUserId) },
      { 
        $set: { 
          name: 'Admin Principal',
          updatedAt: new Date()
        }
      }
    )

    if (result.modifiedCount > 0) {
      console.log('✅ Nom utilisateur mis à jour: Admin Principal')
    } else {
      console.log('❌ Utilisateur non trouvé ou pas de modification')
    }

    // Vérifier le résultat
    const user = await usersCollection.findOne({ _id: new mongoose.Types.ObjectId(nextAuthUserId) })
    if (user) {
      console.log('👤 Utilisateur:', user.name, '(' + user.email + ')')
    }

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await mongoose.disconnect()
    console.log('🔚 Déconnecté de MongoDB')
  }
}

updateUserName()