#!/usr/bin/env node

/**
 * Script de nettoyage des sessions obsolètes
 * Marque comme hors ligne les utilisateurs inactifs depuis trop longtemps
 *
 * Usage: node scripts/cleanup-stale-sessions.js [--minutes=N]
 */

const mongoose = require('mongoose')

// Configuration
const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://dev:3mEKdYmohYa4oCjZ@coworking.jhxdixz.mongodb.net/coworking-platform'

// Récupérer l'argument minutes depuis la ligne de commande
const args = process.argv.slice(2)
const minutesArg = args.find((arg) => arg.startsWith('--minutes='))
const STALE_MINUTES = minutesArg ? parseInt(minutesArg.split('=')[1]) : 30 // 30 minutes par défaut

// Schéma User simplifié
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

async function cleanupStaleSessions() {
  try {
    console.log(
      `🔄 Nettoyage des sessions inactives depuis plus de ${STALE_MINUTES} minutes...`
    )

    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connecté à MongoDB')

    // Calculer la date limite (maintenant - X minutes)
    const staleThreshold = new Date(Date.now() - STALE_MINUTES * 60 * 1000)
    console.log(`📅 Seuil d'inactivité: ${staleThreshold.toISOString()}`)

    // Trouver les utilisateurs en ligne mais inactifs
    const staleUsers = await User.find({
      isOnline: true,
      $or: [
        { lastActive: { $lt: staleThreshold } },
        { lastActive: { $exists: false } }, // Utilisateurs sans lastActive
        { lastActive: null },
      ],
    }).select('_id email firstName lastName name role lastActive')

    console.log(`🔍 Utilisateurs inactifs trouvés: ${staleUsers.length}`)

    if (staleUsers.length === 0) {
      console.log('✅ Aucune session obsolète à nettoyer')
      return { cleaned: 0, total: 0 }
    }

    // Afficher les utilisateurs qui vont être nettoyés
    console.log('👥 Sessions qui seront nettoyées:')
    staleUsers.forEach((user) => {
      const displayName =
        user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : user.name || user.email
      const lastActive = user.lastActive
        ? user.lastActive.toISOString()
        : 'Jamais'
      console.log(
        `   - ${displayName} (${user.role}) - Dernière activité: ${lastActive}`
      )
    })

    // Nettoyer les sessions obsolètes
    console.log('\n🧹 Nettoyage en cours...')
    const staleUserIds = staleUsers.map((user) => user._id)

    const result = await User.updateMany(
      { _id: { $in: staleUserIds } },
      {
        $set: {
          isOnline: false,
          lastActive: new Date(), // Mettre à jour lastActive avec l'heure du nettoyage
        },
      }
    )

    console.log(
      `✅ Nettoyage terminé! ${result.modifiedCount} sessions nettoyées.`
    )

    // Statistiques finales
    const remainingOnline = await User.countDocuments({ isOnline: true })
    console.log(`📊 Utilisateurs encore en ligne: ${remainingOnline}`)

    return {
      cleaned: result.modifiedCount,
      total: staleUsers.length,
      remainingOnline,
    }
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error)
    throw error
  } finally {
    await mongoose.disconnect()
    console.log('🔌 Déconnecté de MongoDB')
  }
}

// Fonction pour un nettoyage récurrent (utile pour les cron jobs)
async function scheduledCleanup(intervalMinutes = 15) {
  console.log(
    `⏰ Démarrage du nettoyage périodique (toutes les ${intervalMinutes} minutes)`
  )

  const cleanup = async () => {
    try {
      const timestamp = new Date().toISOString()
      console.log(`\n🕒 [${timestamp}] Nettoyage périodique démarré...`)

      const result = await cleanupStaleSessions()

      console.log(
        `🕒 [${timestamp}] Nettoyage terminé - ${result.cleaned} sessions nettoyées`
      )
    } catch (error) {
      console.error(
        `🕒 [${new Date().toISOString()}] Erreur nettoyage périodique:`,
        error
      )
    }
  }

  // Premier nettoyage
  await cleanup()

  // Programmer les nettoyages suivants
  const intervalMs = intervalMinutes * 60 * 1000
  setInterval(cleanup, intervalMs)

  console.log(
    `✅ Nettoyage périodique programmé toutes les ${intervalMinutes} minutes`
  )
}

// Exécuter le script
if (require.main === module) {
  const isScheduled = args.includes('--scheduled')
  const scheduledInterval = args.find((arg) => arg.startsWith('--interval='))
  const interval = scheduledInterval
    ? parseInt(scheduledInterval.split('=')[1])
    : 15

  if (isScheduled) {
    scheduledCleanup(interval).catch((error) => {
      console.error('💥 Erreur fatale dans le nettoyage périodique:', error)
      process.exit(1)
    })
  } else {
    cleanupStaleSessions()
      .then((result) => {
        console.log(
          `🏁 Script terminé avec succès - ${result.cleaned} sessions nettoyées`
        )
        process.exit(0)
      })
      .catch((error) => {
        console.error('💥 Erreur fatale:', error)
        process.exit(1)
      })
  }
}

module.exports = { cleanupStaleSessions, scheduledCleanup }
