#!/usr/bin/env node

/**
 * Script d'initialisation automatique du serveur Socket.IO
 * Évite l'erreur "websocket error" au premier accès à /messaging
 */

const http = require('http')

const initializeSocket = () => {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/socket',
    method: 'GET',
    timeout: 5000
  }

  const req = http.request(options, (res) => {
    console.log('✅ Socket.IO initialisé automatiquement')
    console.log(`Status: ${res.statusCode}`)
  })

  req.on('error', (err) => {
    console.log('⚠️ Erreur initialisation Socket.IO:', err.message)
  })

  req.on('timeout', () => {
    console.log('⏱️ Timeout initialisation Socket.IO')
    req.destroy()
  })

  req.end()
}

// Attendre que le serveur soit prêt
setTimeout(() => {
  console.log('🔌 Initialisation automatique du Socket.IO...')
  initializeSocket()
}, 3000)