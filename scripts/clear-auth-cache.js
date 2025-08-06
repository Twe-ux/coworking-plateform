#!/usr/bin/env node

/**
 * Script de nettoyage des caches d'authentification
 * Usage: npm run clear-auth-cache ou node scripts/clear-auth-cache.js
 */

const fs = require('fs')
const path = require('path')

function clearNextCache() {
  const nextCacheDir = path.join(process.cwd(), '.next')
  
  if (fs.existsSync(nextCacheDir)) {
    try {
      fs.rmSync(nextCacheDir, { recursive: true, force: true })
      console.log('✅ Cache Next.js supprimé')
    } catch (error) {
      console.warn('⚠️  Impossible de supprimer le cache Next.js:', error.message)
    }
  }
}

function restartDevServer() {
  console.log('\n🔄 Redémarrage recommandé du serveur de développement:')
  console.log('   1. Arrêtez le serveur (Ctrl+C)')
  console.log('   2. Exécutez: npm run dev')
  console.log('   3. Ouvrez: http://localhost:3000')
  console.log('\n📋 Nettoyage manuel du navigateur recommandé:')
  console.log('   1. Ouvrez les outils de développement (F12)')
  console.log('   2. Onglet "Application" ou "Storage"')
  console.log('   3. Supprimez tous les cookies pour localhost')
  console.log('   4. Videz le localStorage et sessionStorage')
  console.log('   5. Rechargez la page (Ctrl+Shift+R)')
}

async function main() {
  console.log('🧹 Nettoyage des caches d\'authentification...\n')
  
  // Nettoyer le cache Next.js
  clearNextCache()
  
  console.log('\n✅ Nettoyage terminé!')
  
  // Instructions pour la suite
  restartDevServer()
}

main().catch(console.error)