#!/usr/bin/env node

/**
 * Script de démarrage automatique avec WebSocket next-ws
 * Lance Next.js avec WebSocket intégré via next-ws
 */

const { spawn } = require('child_process')

console.log('🚀 Démarrage du serveur avec WebSocket next-ws...')

// Lancer Next.js
const nextProcess = spawn('npm', ['run', 'dev:start'], {
  stdio: 'inherit',
  shell: true
})

// Attendre que Next.js soit prêt
setTimeout(() => {
  console.log('\n✅ Next.js avec WebSocket next-ws démarré')
  console.log('🔗 Vous pouvez maintenant aller sur http://localhost:3001/messaging\n')
}, 4000)

// Gestion de la fermeture propre
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt du serveur...')
  nextProcess.kill('SIGINT')
  process.exit(0)
})

process.on('SIGTERM', () => {
  nextProcess.kill('SIGTERM')
  process.exit(0)
})