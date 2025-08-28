#!/usr/bin/env node

/**
 * Script simple pour démarrer uniquement Socket.IO
 * À utiliser en parallèle avec `pnpm dev:start`
 */

const { spawn } = require('child_process')

console.log('🔌 Démarrage du serveur Socket.IO...')

// Déterminer le port (celui utilisé par Next.js)
const PORT = process.env.PORT || '3000'

// Lancer le serveur Socket.IO
const socketProcess = spawn('node', ['server.js'], {
  stdio: 'inherit',
  shell: true,
  cwd: process.cwd(),
  env: { ...process.env, PORT }
})

console.log(`✅ Socket.IO server démarré sur le port ${PORT}`)
console.log('🔗 Messaging temps réel disponible\n')

// Gestion de la fermeture propre
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt du serveur Socket.IO...')
  socketProcess.kill('SIGINT')
  process.exit(0)
})

process.on('SIGTERM', () => {
  socketProcess.kill('SIGTERM')
  process.exit(0)
})

socketProcess.on('exit', (code) => {
  console.log('🔌 Socket.IO fermé (code:', code, ')')
  process.exit(code)
})

socketProcess.on('error', (error) => {
  console.error('❌ Erreur Socket.IO:', error.message)
  process.exit(1)
})