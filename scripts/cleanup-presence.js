#!/usr/bin/env node

/**
 * Script de nettoyage des statuts de présence
 * Remet tous les utilisateurs comme hors ligne (isOnline: false)
 *
 * Usage: node scripts/cleanup-presence.js
 */

const mongoose = require('mongoose')

// Configuration de la base de données
const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://dev:3mEKdYmohYa4oCjZ@coworking.jhxdixz.mongodb.net/coworking-platform'

// Schéma User simplifié pour le script
const userSchema = new mongoose.Schema(
  {
    email: String,
    firstName: String,
    lastName: String,
    name: String,
    role: String,
    isOnline: { type: Boolean, default: false },
    lastActive: Date,
  },
  { timestamps: true }
)

const User = mongoose.model('User', userSchema)

async function cleanupPresence() {
  try {
    console.log('🔄 Connexion à MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connecté à MongoDB')

    // Compter les utilisateurs actuellement en ligne
    const onlineCount = await User.countDocuments({ isOnline: true })
    console.log(
      `📊 Utilisateurs actuellement marqués comme en ligne: ${onlineCount}`
    )

    if (onlineCount === 0) {
      console.log(
        "✅ Aucun utilisateur n'est marqué comme en ligne. Nettoyage non nécessaire."
      )
      return
    }

    // Afficher les utilisateurs en ligne avant nettoyage
    const onlineUsers = await User.find({ isOnline: true }).select(
      'email firstName lastName name role'
    )
    console.log('👥 Utilisateurs actuellement en ligne:')
    onlineUsers.forEach((user) => {
      const displayName =
        user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : user.name || user.email
      console.log(`   - ${displayName} (${user.role}) - ${user.email}`)
    })

    console.log('\n🧹 Nettoyage en cours...')

    // Réinitialiser tous les statuts isOnline à false
    const result = await User.updateMany(
      { isOnline: true },
      {
        $set: {
          isOnline: false,
          lastActive: new Date(),
        },
      }
    )

    console.log(
      `✅ Nettoyage terminé! ${result.modifiedCount} utilisateurs mis à jour.`
    )

    // Vérification finale
    const remainingOnline = await User.countDocuments({ isOnline: true })
    if (remainingOnline === 0) {
      console.log(
        '🎉 Succès: Tous les utilisateurs sont maintenant hors ligne.'
      )
    } else {
      console.log(
        `⚠️  Attention: ${remainingOnline} utilisateurs restent marqués comme en ligne.`
      )
    }
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('🔌 Déconnecté de MongoDB')
  }
}

// Exécuter le script
if (require.main === module) {
  cleanupPresence()
    .then(() => {
      console.log('🏁 Script terminé avec succès')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Erreur fatale:', error)
      process.exit(1)
    })
}

module.exports = { cleanupPresence }
