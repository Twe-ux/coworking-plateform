#!/usr/bin/env node

/**
 * Script pour démarrer Socket.IO proprement
 * - Vérifie et libère le port 3000 si nécessaire
 * - Démarre Socket.IO avec gestion d'erreurs
 */

const { spawn, exec } = require('child_process')
const { promisify } = require('util')
const execAsync = promisify(exec)

const PORT = process.env.PORT || '3000'

async function killProcessesOnPort(port) {
  try {
    console.log(`🔍 Vérification du port ${port}...`)
    const { stdout } = await execAsync(`lsof -ti:${port}`)
    
    if (stdout.trim()) {
      const pids = stdout.trim().split('\n')
      console.log(`🚫 Processus trouvés sur le port ${port}:`, pids.join(', '))
      
      for (const pid of pids) {
        try {
          await execAsync(`kill ${pid}`)
          console.log(`✅ Processus ${pid} terminé`)
        } catch (error) {
          console.log(`⚠️ Impossible de terminer le processus ${pid}`)
        }
      }
      
      // Attendre un peu que les processus se ferment
      await new Promise(resolve => setTimeout(resolve, 2000))
    } else {
      console.log(`✅ Port ${port} libre`)
    }
  } catch (error) {
    console.log(`✅ Port ${port} libre (aucun processus trouvé)`)
  }
}

async function startSocketIO() {
  console.log('🚀 Démarrage du serveur Socket.IO...')
  
  try {
    // Libérer le port
    await killProcessesOnPort(PORT)
    
    // Démarrer Socket.IO
    console.log(`🔌 Lancement Socket.IO sur le port ${PORT}...`)
    const socketProcess = spawn('node', ['server.js'], {
      stdio: 'inherit',
      shell: true,
      cwd: process.cwd(),
      env: { ...process.env, PORT }
    })
    
    console.log(`✅ Socket.IO server démarré`)
    console.log(`🌐 Application disponible sur http://localhost:${PORT}`)
    console.log('📝 Avec messaging temps réel complet!\n')
    
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
      console.log(`🔌 Socket.IO fermé (code: ${code})`)
      process.exit(code)
    })
    
    socketProcess.on('error', (error) => {
      console.error('❌ Erreur Socket.IO:', error.message)
      process.exit(1)
    })
    
  } catch (error) {
    console.error('❌ Erreur lors du démarrage:', error.message)
    process.exit(1)
  }
}

startSocketIO()