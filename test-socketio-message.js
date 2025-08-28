const { io } = require('socket.io-client');

console.log('🧪 Test Socket.IO Message Temps Réel');

const socket = io('http://localhost:3001', {
  path: '/api/socket/',
  transports: ['websocket']
});

socket.on('connect', () => {
  console.log('✅ Connecté à Socket.IO:', socket.id);
  
  // Authentification
  console.log('🔐 Authentification...');
  socket.emit('authenticate', {
    userId: '689377c767fd70e1283b037a', // Client User
    userName: 'Client User',
    userEmail: 'client@example.com',
    userRole: 'user'
  });
});

socket.on('authenticated', (data) => {
  console.log('✅ Authentifié:', data);
  
  // Rejoindre le channel Général
  console.log('🚪 Rejoindre channel...');
  socket.emit('join_channel', {
    channelId: '68a0891f8a714206c7d19f02' // Channel Général
  });
});

socket.on('channel_history', (data) => {
  console.log(`📜 Historique reçu: ${data.messages.length} messages`);
  
  // Envoyer un message test
  const testMessage = `Socket.IO TEST TEMPS RÉEL - ${new Date().toLocaleTimeString()} 🚀`;
  console.log('📤 Envoi message test:', testMessage);
  
  socket.emit('send_message', {
    channelId: '68a0891f8a714206c7d19f02',
    content: testMessage,
    messageType: 'text'
  });
});

socket.on('new_message', (message) => {
  console.log('📥 NOUVEAU MESSAGE REÇU EN TEMPS RÉEL:');
  console.log(`   De: ${message.sender.name}`);
  console.log(`   Contenu: ${message.content}`);
  console.log(`   À: ${new Date(message.createdAt).toLocaleTimeString()}`);
  
  // Test réussi, fermer la connexion
  setTimeout(() => {
    console.log('✅ TEST RÉUSSI - Messages temps réel fonctionnels!');
    socket.disconnect();
    process.exit(0);
  }, 2000);
});

socket.on('error', (error) => {
  console.error('❌ Erreur Socket.IO:', error);
});

socket.on('disconnect', () => {
  console.log('👋 Déconnecté de Socket.IO');
});

// Timeout de sécurité
setTimeout(() => {
  console.log('⏰ Timeout - Test terminé');
  socket.disconnect();
  process.exit(1);
}, 15000);
