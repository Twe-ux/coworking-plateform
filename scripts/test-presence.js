#!/usr/bin/env node

/**
 * Script de test du système de présence
 * Valide le bon fonctionnement des statuts en ligne/hors ligne
 *
 * Usage: node scripts/test-presence.js
 */

const mongoose = require('mongoose')

// Configuration
const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://dev:3mEKdYmohYa4oCjZ@coworking.jhxdixz.mongodb.net/coworking-platform'

// Schéma User simplifié pour le test
const userSchema = new mongoose.Schema(
  {
    email: String,
    firstName: String,
    lastName: String,
    name: String,
    role: String,
    isActive: Boolean,
    isOnline: { type: Boolean, default: false },
    lastActive: Date,
  },
  { timestamps: true }
)

const User = mongoose.model('User', userSchema)

// Tests de validation
const tests = {
  async checkDatabaseConnection() {
    console.log('🧪 Test 1: Connexion à la base de données')
    try {
      await mongoose.connect(MONGODB_URI)
      console.log('  ✅ Connexion réussie')
      return true
    } catch (error) {
      console.log('  ❌ Échec de connexion:', error.message)
      return false
    }
  },

  async checkUserSchema() {
    console.log('\n🧪 Test 2: Vérification du schéma User')
    try {
      // Trouver un utilisateur pour tester le schéma
      const user = await User.findOne({}).select('email isOnline lastActive')

      if (!user) {
        console.log('  ⚠️  Aucun utilisateur trouvé en base')
        return true // Pas d'erreur, juste pas d'utilisateur
      }

      // Vérifier que les champs isOnline et lastActive existent
      const hasOnlineField = user.schema.paths.hasOwnProperty('isOnline')
      const hasLastActiveField = user.schema.paths.hasOwnProperty('lastActive')

      if (hasOnlineField && hasLastActiveField) {
        console.log('  ✅ Champs isOnline et lastActive présents')
        console.log(`     - isOnline: ${user.isOnline}`)
        console.log(`     - lastActive: ${user.lastActive || 'null'}`)
        return true
      } else {
        console.log('  ❌ Champs manquants:')
        if (!hasOnlineField) console.log('     - isOnline manquant')
        if (!hasLastActiveField) console.log('     - lastActive manquant')
        return false
      }
    } catch (error) {
      console.log('  ❌ Erreur:', error.message)
      return false
    }
  },

  async testPresenceOperations() {
    console.log('\n🧪 Test 3: Opérations de présence')
    try {
      // Compter les utilisateurs en ligne
      const onlineCount = await User.countDocuments({ isOnline: true })
      console.log(`  📊 Utilisateurs en ligne: ${onlineCount}`)

      // Lister les utilisateurs en ligne
      const onlineUsers = await User.find({ isOnline: true })
        .select('email firstName lastName name role lastActive')
        .limit(5)

      if (onlineUsers.length > 0) {
        console.log('  👥 Utilisateurs actuellement en ligne:')
        onlineUsers.forEach((user) => {
          const displayName =
            user.firstName && user.lastName
              ? `${user.firstName} ${user.lastName}`
              : user.name || user.email
          const lastActive = user.lastActive
            ? user.lastActive.toISOString()
            : 'N/A'
          console.log(
            `     - ${displayName} (${user.role}) - Actif: ${lastActive}`
          )
        })
      }

      return true
    } catch (error) {
      console.log('  ❌ Erreur:', error.message)
      return false
    }
  },

  async testIndexes() {
    console.log('\n🧪 Test 4: Vérification des index')
    try {
      const indexes = await User.collection.getIndexes()
      console.log('  📋 Index disponibles:')

      let hasOnlineIndex = false
      Object.keys(indexes).forEach((indexName) => {
        const indexFields = Object.keys(indexes[indexName])
        console.log(`     - ${indexName}: ${indexFields.join(', ')}`)

        if (
          indexFields.includes('isOnline') ||
          indexFields.includes('lastActive')
        ) {
          hasOnlineIndex = true
        }
      })

      if (hasOnlineIndex) {
        console.log('  ✅ Index de présence détecté')
      } else {
        console.log('  ⚠️  Aucun index spécifique à la présence trouvé')
      }

      return true
    } catch (error) {
      console.log('  ❌ Erreur:', error.message)
      return false
    }
  },

  async simulatePresenceUpdate() {
    console.log('\n🧪 Test 5: Simulation de mise à jour de présence')
    try {
      // Trouver un utilisateur de test
      const testUser = await User.findOne({ isActive: true }).select(
        '_id email firstName lastName'
      )

      if (!testUser) {
        console.log('  ⚠️  Aucun utilisateur actif trouvé pour le test')
        return true
      }

      console.log(`  🎯 Test avec utilisateur: ${testUser.email}`)

      // Test 1: Marquer comme en ligne
      console.log('     1. Marquage comme en ligne...')
      const onlineResult = await User.findByIdAndUpdate(
        testUser._id,
        { isOnline: true, lastActive: new Date() },
        { new: true }
      )

      if (onlineResult && onlineResult.isOnline) {
        console.log('       ✅ Marqué comme en ligne')
      } else {
        console.log('       ❌ Échec du marquage en ligne')
        return false
      }

      // Attendre un peu
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Test 2: Marquer comme hors ligne
      console.log('     2. Marquage comme hors ligne...')
      const offlineResult = await User.findByIdAndUpdate(
        testUser._id,
        { isOnline: false, lastActive: new Date() },
        { new: true }
      )

      if (offlineResult && !offlineResult.isOnline) {
        console.log('       ✅ Marqué comme hors ligne')
      } else {
        console.log('       ❌ Échec du marquage hors ligne')
        return false
      }

      console.log('  ✅ Tests de présence réussis')
      return true
    } catch (error) {
      console.log('  ❌ Erreur:', error.message)
      return false
    }
  },
}

async function runTests() {
  console.log('🚀 Démarrage des tests du système de présence\n')

  let passedTests = 0
  let totalTests = 0

  try {
    for (const [testName, testFunction] of Object.entries(tests)) {
      totalTests++
      const passed = await testFunction()
      if (passed) passedTests++
    }

    console.log('\n📊 Résultats des tests:')
    console.log(`   Tests réussis: ${passedTests}/${totalTests}`)

    if (passedTests === totalTests) {
      console.log(
        '🎉 Tous les tests sont passés! Le système de présence fonctionne correctement.'
      )
      return true
    } else {
      console.log(
        '⚠️  Certains tests ont échoué. Vérifiez les erreurs ci-dessus.'
      )
      return false
    }
  } catch (error) {
    console.error('💥 Erreur fatale lors des tests:', error)
    return false
  } finally {
    await mongoose.disconnect()
    console.log('🔌 Déconnecté de MongoDB')
  }
}

// Exécuter les tests
if (require.main === module) {
  runTests()
    .then((success) => {
      console.log('\n🏁 Tests terminés')
      process.exit(success ? 0 : 1)
    })
    .catch((error) => {
      console.error('💥 Erreur fatale:', error)
      process.exit(1)
    })
}

module.exports = { runTests, tests }
