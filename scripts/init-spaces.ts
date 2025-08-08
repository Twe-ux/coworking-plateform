#!/usr/bin/env node

/**
 * Script d'initialisation pour insérer les espaces par défaut dans MongoDB
 * Usage: npm run db:init-spaces
 */

import { connectToDatabase } from '../lib/mongodb'
import { insertDefaultSpaces } from '../lib/models/space'
import mongoose from 'mongoose'

async function initSpaces() {
  try {
    console.log('🚀 Initialisation des espaces par défaut...')
    
    // Connexion à MongoDB
    await connectToDatabase()
    console.log('✅ Connexion MongoDB établie')

    // Insérer les espaces par défaut
    await insertDefaultSpaces()
    console.log('✅ Espaces par défaut initialisés avec succès')

    console.log('\n📋 Espaces disponibles:')
    console.log('  - Places du café (Café coworking)')
    console.log('  - Salle Verrière (Salle privée)')
    console.log('  - Zone Silencieuse - Étage (Zone silencieuse)')
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error)
    process.exit(1)
  } finally {
    // Fermer la connexion Mongoose
    await mongoose.connection.close()
    console.log('🔌 Connexion fermée')
    process.exit(0)
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  initSpaces()
}

export default initSpaces