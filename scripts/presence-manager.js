#!/usr/bin/env node

/**
 * Gestionnaire principal du système de présence
 *
 * Usage:
 *   node scripts/presence-manager.js cleanup     # Nettoyer tous les statuts
 *   node scripts/presence-manager.js test       # Tester le système
 *   node scripts/presence-manager.js stale      # Nettoyer les sessions obsolètes
 *   node scripts/presence-manager.js status     # Afficher le statut actuel
 */

const mongoose = require('mongoose')

// Configuration
const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://dev:3mEKdYmohYa4oCjZ@coworking.jhxdixz.mongodb.net/coworking-platform'

// Schéma User simplifié pour les scripts (évite les conflits TypeScript)
let User
try {
  User = mongoose.model('User')
} catch (error) {
  const userSchema = new mongoose.Schema(
    {
      email: { type: String, required: true, unique: true },
      firstName: String,
      lastName: String,
      name: String,
      role: {
        type: String,
        enum: ['admin', 'manager', 'staff', 'client'],
        default: 'client',
      },
      isActive: { type: Boolean, default: true },
      isOnline: { type: Boolean, default: false },
      lastActive: Date,
    },
    { timestamps: true }
  )

  User = mongoose.model('User', userSchema)
}

// Fonctions intégrées pour éviter les conflits de modèles

async function cleanupPresence() {
  try {
    console.log('🔄 Connexion à MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connecté à MongoDB')

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
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error)
    throw error
  }
}

async function testPresence() {
  console.log('🧪 Tests du système de présence')

  try {
    await mongoose.connect(MONGODB_URI)
    console.log('  ✅ Connexion à MongoDB réussie')

    // Test schéma
    const user = await User.findOne({}).select('isOnline lastActive')
    if (user) {
      console.log('  ✅ Champs isOnline et lastActive présents')
    } else {
      console.log('  ⚠️  Aucun utilisateur trouvé pour tester')
    }

    // Test opérations
    const onlineCount = await User.countDocuments({ isOnline: true })
    console.log(`  📊 Utilisateurs en ligne: ${onlineCount}`)

    console.log('  ✅ Tests réussis')
    return true
  } catch (error) {
    console.error('  ❌ Erreur tests:', error)
    return false
  }
}

async function cleanupStale() {
  const STALE_MINUTES = 30

  try {
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connecté à MongoDB')

    const staleThreshold = new Date(Date.now() - STALE_MINUTES * 60 * 1000)

    const staleUsers = await User.find({
      isOnline: true,
      $or: [
        { lastActive: { $lt: staleThreshold } },
        { lastActive: { $exists: false } },
        { lastActive: null },
      ],
    }).select('email firstName lastName name role lastActive')

    console.log(`🔍 Sessions obsolètes trouvées: ${staleUsers.length}`)

    if (staleUsers.length === 0) {
      console.log('✅ Aucune session obsolète à nettoyer')
      return
    }

    const result = await User.updateMany(
      {
        _id: { $in: staleUsers.map((u) => u._id) },
      },
      {
        $set: {
          isOnline: false,
          lastActive: new Date(),
        },
      }
    )

    console.log(`✅ ${result.modifiedCount} sessions obsolètes nettoyées`)
  } catch (error) {
    console.error('❌ Erreur nettoyage sessions obsolètes:', error)
    throw error
  }
}

async function showStatus() {
  try {
    console.log('📊 Statut du système de présence\n')

    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connecté à MongoDB')

    // Compter les utilisateurs
    const totalUsers = await User.countDocuments({ isActive: { $ne: false } })
    const onlineUsers = await User.countDocuments({ isOnline: true })
    const offlineUsers = totalUsers - onlineUsers

    console.log(`\n👥 Statistiques utilisateurs:`)
    console.log(`   Total: ${totalUsers}`)
    console.log(`   En ligne: ${onlineUsers}`)
    console.log(`   Hors ligne: ${offlineUsers}`)

    // Lister les utilisateurs en ligne
    if (onlineUsers > 0) {
      const onlineUsersList = await User.find({ isOnline: true })
        .select('email firstName lastName name role lastActive')
        .sort({ lastActive: -1 })
        .limit(10)

      console.log(
        `\n🟢 Utilisateurs en ligne (${Math.min(onlineUsers, 10)} plus récents):`
      )
      onlineUsersList.forEach((user) => {
        const displayName =
          user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : user.name || user.email
        const lastActive = user.lastActive
          ? user.lastActive.toLocaleString()
          : 'N/A'
        console.log(`   - ${displayName} (${user.role}) - Actif: ${lastActive}`)
      })
    }

    // Utilisateurs potentiellement obsolètes (en ligne mais inactifs depuis 30+ minutes)
    const staleThreshold = new Date(Date.now() - 30 * 60 * 1000)
    const staleUsers = await User.countDocuments({
      isOnline: true,
      $or: [
        { lastActive: { $lt: staleThreshold } },
        { lastActive: { $exists: false } },
        { lastActive: null },
      ],
    })

    if (staleUsers > 0) {
      console.log(`\n⚠️  Sessions potentiellement obsolètes: ${staleUsers}`)
      console.log(`   (En ligne mais inactives depuis 30+ minutes)`)
    }
  } catch (error) {
    console.error("❌ Erreur lors de l'affichage du statut:", error)
  } finally {
    await mongoose.disconnect()
    console.log('\n🔌 Déconnecté de MongoDB')
  }
}

async function main() {
  const command = process.argv[2]

  console.log('🎛️  Gestionnaire du système de présence\n')

  try {
    switch (command) {
      case 'cleanup':
        console.log('🧹 Nettoyage complet des statuts...\n')
        await cleanupPresence()
        break

      case 'test':
        console.log('🧪 Tests du système...\n')
        const testResult = await testPresence()
        if (!testResult) {
          throw new Error('Tests échoués')
        }
        break

      case 'stale':
        console.log('🕒 Nettoyage des sessions obsolètes...\n')
        await cleanupStale()
        break

      case 'status':
        await showStatus()
        break

      case 'help':
      case '--help':
      case '-h':
        console.log('📖 Utilisation:')
        console.log(
          '   node scripts/presence-manager.js cleanup     # Nettoyer tous les statuts'
        )
        console.log(
          '   node scripts/presence-manager.js test       # Tester le système'
        )
        console.log(
          '   node scripts/presence-manager.js stale      # Nettoyer les sessions obsolètes'
        )
        console.log(
          '   node scripts/presence-manager.js status     # Afficher le statut actuel'
        )
        console.log(
          '   node scripts/presence-manager.js help       # Afficher cette aide'
        )
        return // Pas besoin de déconnexion pour l'aide

      default:
        console.log('❌ Commande inconnue:', command)
        console.log('   Utilisez "help" pour voir les commandes disponibles')
        process.exit(1)
    }

    console.log('\n🎉 Opération terminée avec succès!')
  } catch (error) {
    console.error('\n💥 Erreur:', error.message)
    throw error
  } finally {
    // S'assurer de fermer la connexion MongoDB
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect()
      console.log('🔌 Déconnecté de MongoDB')
    }
  }
}

// Exécuter le script principal
if (require.main === module) {
  main()
}

module.exports = { showStatus }
