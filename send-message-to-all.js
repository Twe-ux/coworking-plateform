// Envoyer un message via WebSocket pour tester la synchronisation temps réel

const WebSocket = require('ws')

function sendMessageToChannel() {
  console.log('📡 Connexion et envoi d\'un message pour test temps réel...')
  
  const ws = new WebSocket('ws://localhost:3001/api/ws')
  
  ws.on('open', () => {
    console.log('✅ Connexion WebSocket établie')
    
    // Authentification en tant qu'admin
    const authMessage = {
      type: 'auth',
      data: {
        userId: '689377c667fd70e1283b0377', // Admin
        userName: 'Admin Test',
        userEmail: 'admin@example.com',
        userRole: 'admin'
      }
    }
    
    ws.send(JSON.stringify(authMessage))
    console.log('📤 Authentification envoyée')
    
    // Envoyer un message de test après authentification
    setTimeout(() => {
      const testMessage = {
        type: 'send_message',
        data: {
          channelId: '68a0891f8a714206c7d19f02', // Channel Général
          content: `Message temps réel test 🔥 ${new Date().toLocaleTimeString()}`,
          messageType: 'text'
        }
      }
      
      ws.send(JSON.stringify(testMessage))
      console.log('🚀 Message envoyé - vérifiez s\'il apparaît IMMÉDIATEMENT dans l\'interface web')
      
      // Fermer après un court délai
      setTimeout(() => {
        ws.close()
      }, 2000)
    }, 1000)
  })
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data)
      console.log('📥', message.type, message.data?.content || '')
    } catch (error) {
      console.error('❌ Erreur parsing:', error)
    }
  })
  
  ws.on('close', () => {
    console.log('🔌 Connexion fermée')
  })
}

sendMessageToChannel()