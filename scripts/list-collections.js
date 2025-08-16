#!/usr/bin/env node

/**
 * Script pour lister toutes les collections
 */

const mongoose = require('mongoose')

async function listCollections() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/coworking-platform')
    console.log('✅ Connecté à MongoDB')
    console.log('🔗 URI:', process.env.MONGODB_URI || 'mongodb://localhost:27017/coworking-platform')

    const db = mongoose.connection.db
    
    // Lister toutes les collections
    const collections = await db.listCollections().toArray()
    
    console.log(`📊 Collections trouvées: ${collections.length}`)
    
    for (const collection of collections) {
      console.log(`\n📁 Collection: ${collection.name}`)
      
      // Compter les documents dans chaque collection
      const count = await db.collection(collection.name).countDocuments()
      console.log(`   Nombre de documents: ${count}`)
      
      // Si c'est la collection users, afficher quelques documents
      if (collection.name === 'users' && count > 0) {
        const samples = await db.collection(collection.name).find({}).limit(3).toArray()
        samples.forEach((doc, index) => {
          console.log(`   📄 Document ${index + 1}:`)
          console.log(`      ID: ${doc._id}`)
          console.log(`      Email: ${doc.email}`)
        })
      }
    }

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await mongoose.disconnect()
    console.log('🔚 Déconnecté de MongoDB')
  }
}

listCollections()