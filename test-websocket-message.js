const WebSocket = require('ws');

async function testWebSocketMessage() {
  const ws = new WebSocket('ws://localhost:3001/api/ws');
  
  ws.on('open', function() {
    console.log('🔌 WebSocket connecté');
    
    // Envoyer un message via WebSocket comme le ferait l'interface
    const messageData = {
      type: 'send_message',
      data: {
        content: `Message WebSocket temps réel ${new Date().toLocaleTimeString()} 🚀`,
        channelId: '68a0891f8a714206c7d19f02', // ID du channel Général
        userId: '689377c667fd70e1283b0377', // Milone Thierry
        messageType: 'text'
      }
    };
    
    console.log('📤 Envoi du message:', messageData);
    ws.send(JSON.stringify(messageData));
  });

  ws.on('message', function(data) {
    console.log('📥 Réponse reçue:', data.toString());
  });

  ws.on('error', function(error) {
    console.error('❌ Erreur WebSocket:', error.message);
  });

  ws.on('close', function() {
    console.log('🔌 Connexion WebSocket fermée');
  });

  // Fermer après 3 secondes
  setTimeout(() => {
    ws.close();
  }, 3000);
}

testWebSocketMessage();
