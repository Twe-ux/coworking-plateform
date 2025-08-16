#!/usr/bin/env node

/**
 * Script de démarrage automatique avec initialisation Socket.IO
 * Lance Next.js et initialise automatiquement Socket.IO
 */

const { spawn } = require('child_process')
const http = require('http')

console.log('🚀 Démarrage du serveur avec initialisation Socket.IO automatique...')

// Lancer Next.js
const nextProcess = spawn('npm', ['run', 'dev:start'], {
  stdio: 'inherit',
  shell: true
})

// Variable pour éviter les initialisations répétées
let socketInitialized = false

// Fonction d'initialisation Socket.IO
const initializeSocket = (port = 3000) => {
  if (socketInitialized) return

  const options = {
    hostname: 'localhost',
    port: port,
    path: '/api/socket',
    method: 'GET',
    timeout: 5000
  }

  const req = http.request(options, (res) => {
    if (!socketInitialized) {
      console.log('\n✅ Socket.IO initialisé automatiquement')
      console.log('🔗 Vous pouvez maintenant aller sur http://localhost:3000/messaging\n')
      socketInitialized = true
    }
  })

  req.on('error', (err) => {
    if (err.code === 'ECONNREFUSED' && !socketInitialized) {
      // Essayer le port 3001 si 3000 échoue
      if (port === 3000) {
        setTimeout(() => initializeSocket(3001), 2000)
      } else {
        setTimeout(() => initializeSocket(port), 3000)
      }
    } else if (!socketInitialized) {
      console.log('⚠️ Erreur initialisation Socket.IO:', err.message)
    }
  })

  req.on('timeout', () => {
    req.destroy()
    if (!socketInitialized) {
      setTimeout(() => initializeSocket(port), 3000)
    }
  })

  req.end()
}

// Attendre que Next.js soit prêt
setTimeout(() => {
  console.log('\n🔌 Initialisation automatique du Socket.IO...')
  initializeSocket()
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