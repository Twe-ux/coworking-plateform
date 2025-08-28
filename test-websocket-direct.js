// Script de test direct WebSocket pour diagnostiquer le problème de synchronisation

const WebSocket = require('ws')

function testWebSocketConnection() {
  console.log('🧪 Test direct WebSocket - Connexion au serveur...')
  
  const ws = new WebSocket('ws://localhost:3001/api/ws')
  
  ws.on('open', () => {
    console.log('✅ Connexion WebSocket établie')
    
    // Authentification de test
    const authMessage = {
      type: 'auth',
      data: {
        userId: '689377c667fd70e1283b0377', // Admin test ID
        userName: 'Test Client',
        userEmail: 'test@example.com',
        userRole: 'admin'
      }
    }
    
    ws.send(JSON.stringify(authMessage))
    console.log('📤 Message auth envoyé')
    
    // Attendre un peu puis envoyer un message de test
    setTimeout(() => {
      const testMessage = {
        type: 'send_message',
        data: {
          channelId: '68a0891f8a714206c7d19f02', // ID du channel Général (correct)
          content: 'Message de test direct WebSocket 🧪',
          messageType: 'text'
        }
      }
      
      ws.send(JSON.stringify(testMessage))
      console.log('📤 Message de test envoyé')
    }, 2000)
  })
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data)
      console.log('📥 Message reçu:', message.type, message.data ? 'avec données' : 'sans données')
      
      if (message.type === 'new_message') {
        console.log('🎯 NOUVEAU MESSAGE REÇU:', {
          id: message.data._id,
          content: message.data.content,
          sender: message.data.sender?.name,
          channel: message.data.channel
        })
      }
    } catch (error) {
      console.error('❌ Erreur parsing message:', error)
      console.log('📄 Data brute:', data.toString())
    }
  })
  
  ws.on('error', (error) => {
    console.error('❌ Erreur WebSocket:', error)
  })
  
  ws.on('close', (code, reason) => {
    console.log('🔌 Connexion fermée:', code, reason.toString())
  })
  
  // Fermer après 10 secondes
  setTimeout(() => {
    console.log('⏰ Test terminé, fermeture de la connexion')
    ws.close()
  }, 10000)
}

testWebSocketConnection()