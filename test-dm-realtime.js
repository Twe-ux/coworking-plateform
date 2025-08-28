const { io } = require('socket.io-client');

console.log('🧪 Test Messages DM Temps Réel');

// Créer deux connexions pour simuler Admin et Client
const adminSocket = io('http://localhost:3001', {
  path: '/api/socket/',
  transports: ['websocket']
});

const clientSocket = io('http://localhost:3001', {
  path: '/api/socket/',
  transports: ['websocket']
});

let adminReady = false;
let clientReady = false;
let dmChannelId = null;

// Configuration Admin
adminSocket.on('connect', () => {
  console.log('🔐 Admin connecté:', adminSocket.id);
  adminSocket.emit('authenticate', {
    userId: '689377c667fd70e1283b0377', // Admin
    userName: 'Admin Thierry',
    userEmail: 'admin@example.com',
    userRole: 'admin'
  });
});

adminSocket.on('authenticated', () => {
  console.log('✅ Admin authentifié');
  adminReady = true;
  checkBothReady();
});

// Configuration Client 
clientSocket.on('connect', () => {
  console.log('🔐 Client connecté:', clientSocket.id);
  clientSocket.emit('authenticate', {
    userId: '689377c767fd70e1283b037a', // Client
    userName: 'Client User', 
    userEmail: 'client@example.com',
    userRole: 'user'
  });
});

clientSocket.on('authenticated', () => {
  console.log('✅ Client authentifié');
  clientReady = true;
  checkBothReady();
});

function checkBothReady() {
  if (adminReady && clientReady) {
    console.log('🚀 Les deux utilisateurs sont prêts - Test DM');
    testDMCommunication();
  }
}

async function testDMCommunication() {
  // Essayer de rejoindre un DM existant ou en créer un via API
  console.log('💬 Création/Recherche DM...');
  
  // Utiliser le channel DM entre admin et client s'il existe
  // Sinon, rejoindre le channel général pour tester
  const testChannelId = '68a0891f8a714206c7d19f02'; // Channel Général
  
  console.log('🚪 Admin rejoint le channel...');
  adminSocket.emit('join_channel', { channelId: testChannelId });
  
  console.log('🚪 Client rejoint le channel...');
  clientSocket.emit('join_channel', { channelId: testChannelId });
  
  // Attendre un peu puis envoyer un message de chaque côté
  setTimeout(() => {
    console.log('📤 Admin envoie un message...');
    adminSocket.emit('send_message', {
      channelId: testChannelId,
      content: `Message ADMIN vers CLIENT - ${new Date().toLocaleTimeString()} ➡️`,
      messageType: 'text'
    });
    
    setTimeout(() => {
      console.log('📤 Client envoie un message...');
      clientSocket.emit('send_message', {
        channelId: testChannelId,
        content: `Message CLIENT vers ADMIN - ${new Date().toLocaleTimeString()} ⬅️`,
        messageType: 'text'
      });
    }, 2000);
  }, 2000);
}

// Écouter les nouveaux messages
adminSocket.on('new_message', (message) => {
  console.log('📥 ADMIN reçoit:', message.sender.name, '->', message.content);
});

clientSocket.on('new_message', (message) => {
  console.log('📥 CLIENT reçoit:', message.sender.name, '->', message.content);
});

// Gestion des erreurs
adminSocket.on('error', (error) => {
  console.error('❌ Erreur Admin:', error);
});

clientSocket.on('error', (error) => {
  console.error('❌ Erreur Client:', error);
});

// Timeout de sécurité
setTimeout(() => {
  console.log('✅ Test terminé - Vérifiez les échanges ci-dessus');
  adminSocket.disconnect();
  clientSocket.disconnect();
  process.exit(0);
}, 15000);
