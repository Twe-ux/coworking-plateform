const WebSocket = require('ws');
const fetch = require('node-fetch'); // Vous devrez installer node-fetch si nécessaire

async function testClientWebSocket() {
  console.log('🔍 DEBUG: Test de connexion WebSocket avec compte client');
  
  // Se connecter avec WebSocket
  const ws = new WebSocket('ws://localhost:3001/api/ws');
  
  ws.on('open', function() {
    console.log('🔌 WebSocket connecté');
    
    // Envoyer les données d'authentification du client
    const authData = {
      type: 'authenticate',
      data: {
        userId: '689377c767fd70e1283b037a', // Client User ID
        userName: 'Client User'
      }
    };
    
    console.log('🔐 Envoi d\'authentification client...');
    ws.send(JSON.stringify(authData));
  });

  ws.on('message', function(data) {
    const message = JSON.parse(data.toString());
    console.log('📥 Réponse WebSocket:', message);
    
    // Une fois authentifié, essayer d'envoyer un message vers le channel Général
    if (message.type === 'auth_success' || message.type === 'user_presence') {
      console.log('✅ Authentification réussie, envoi d\'un message test...');
      
      const messageData = {
        type: 'send_message',
        data: {
          content: `Message test depuis CLIENT vers ADMIN ${new Date().toLocaleTimeString()} 📧`,
          channelId: '68a0891f8a714206c7d19f02', // ID du channel Général
          messageType: 'text'
        }
      };
      
      console.log('📤 Envoi message test:', messageData);
      ws.send(JSON.stringify(messageData));
    }
  });

  ws.on('error', function(error) {
    console.error('❌ Erreur WebSocket:', error.message);
  });

  ws.on('close', function() {
    console.log('🔌 Connexion WebSocket fermée');
  });

  // Fermer après 10 secondes
  setTimeout(() => {
    console.log('⏰ Test terminé');
    ws.close();
  }, 10000);
}

testClientWebSocket();
