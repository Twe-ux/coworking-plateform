#!/usr/bin/env node

/**
 * Script de démarrage automatique avec Socket.IO
 * Lance Next.js ET Socket.IO avec synchronisation
 */

const { spawn } = require('child_process')
const path = require('path')

console.log('🚀 Démarrage du serveur avec Socket.IO...')

// Lancer Next.js en premier
const nextProcess = spawn('pnpm', ['dev'], {
  stdio: 'inherit',
  shell: true,
  cwd: process.cwd()
})

console.log('⏳ Attente du démarrage de Next.js...')

// Attendre 5 secondes puis lancer Socket.IO
setTimeout(() => {
  console.log('🔌 Démarrage du serveur Socket.IO...')
  
  // Lancer le serveur Socket.IO
  const socketProcess = spawn('node', ['server.js'], {
    stdio: 'inherit',
    shell: true,
    cwd: process.cwd(),
    env: { ...process.env, PORT: '3000' }
  })
  
  console.log('✅ Serveurs démarrés :')
  console.log('  📱 Next.js avec API routes')
  console.log('  🔌 Socket.IO pour messaging temps réel')
  console.log('🔗 Application disponible sur http://localhost:3000\n')

  // Gestion de la fermeture propre
  process.on('SIGINT', () => {
    console.log('\n🛑 Arrêt des serveurs...')
    nextProcess.kill('SIGINT')
    socketProcess.kill('SIGINT')
    process.exit(0)
  })

  process.on('SIGTERM', () => {
    nextProcess.kill('SIGTERM')
    socketProcess.kill('SIGTERM')
    process.exit(0)
  })

  // Si Next.js se ferme, fermer aussi Socket.IO
  nextProcess.on('exit', (code) => {
    console.log('📱 Next.js fermé, fermeture de Socket.IO...')
    socketProcess.kill('SIGTERM')
    process.exit(code)
  })

  // Si Socket.IO se ferme, continuer avec Next.js seulement
  socketProcess.on('exit', (code) => {
    console.log('🔌 Socket.IO fermé (code:', code, ') - Next.js continue')
  })

}, 5000) // Délai de 5 secondes

// Si Next.js n'arrive pas à démarrer
nextProcess.on('error', (error) => {
  console.error('❌ Erreur démarrage Next.js:', error.message)
  process.exit(1)
})