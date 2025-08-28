// Test simple temps réel
const WebSocket = require('ws')

console.log('🧪 Test temps réel simple...')

const ws = new WebSocket('ws://localhost:3001/api/ws')

ws.on('open', () => {
  console.log('✅ Connecté')
  
  // Auth
  ws.send(JSON.stringify({
    type: 'auth',
    data: {
      userId: '689377c667fd70e1283b0377',
      userName: 'Test Admin',
      userEmail: 'admin@example.com',
      userRole: 'admin'
    }
  }))
  
  // Message après 1 seconde
  setTimeout(() => {
    ws.send(JSON.stringify({
      type: 'send_message',
      data: {
        channelId: '68a0891f8a714206c7d19f02',
        content: `Test ${new Date().toLocaleTimeString()} 🚀`,
        messageType: 'text'
      }
    }))
    console.log('📤 Message envoyé')
    
    // Fermer après 3 secondes
    setTimeout(() => ws.close(), 3000)
  }, 1000)
})

ws.on('message', (data) => {
  const msg = JSON.parse(data)
  if (msg.type === 'new_message') {
    console.log('✅ Message reçu:', msg.data.content)
  }
})

ws.on('error', console.error)
ws.on('close', () => console.log('🔌 Fermé'))