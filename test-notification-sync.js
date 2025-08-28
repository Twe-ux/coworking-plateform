const { io } = require('socket.io-client');

console.log('🧪 Test Synchronisation Notifications');

const socket = io('http://localhost:3000', {
  path: '/api/socket/',
  transports: ['websocket']
});

socket.on('connect', () => {
  console.log('✅ Connecté:', socket.id);
  
  socket.emit('authenticate', {
    userId: '689377c667fd70e1283b0377', // Admin
    userName: 'Admin Test',
    userEmail: 'admin@example.com',
    userRole: 'admin'
  });
});

socket.on('authenticated', () => {
  console.log('🔐 Authentifié - attente des compteurs initiaux...');
});

socket.on('initial_notification_counts', (counts) => {
  console.log('📊 COMPTEURS INITIAUX REÇUS:');
  console.log(`  Total non lus: ${counts.totalUnread}`);
  console.log(`  Messages DM: ${counts.messagesDMs}`);
  console.log(`  Channels: ${counts.channels}`);
  console.log('  Breakdown:', counts.channelBreakdown);
  
  // Joindre un channel pour marquer des messages comme lus
  const channelId = Object.keys(counts.channelBreakdown)[0];
  if (channelId) {
    console.log(`\n🚪 Rejoindre channel ${channelId}...`);
    socket.emit('join_channel', { channelId });
  }
});

socket.on('channel_history', (data) => {
  console.log(`📜 Historique reçu: ${data.messages.length} messages`);
  
  if (data.messages.length > 0) {
    // Marquer les 5 premiers messages comme lus
    const messagesToRead = data.messages.slice(0, 5).map(msg => msg._id);
    console.log(`👁️ Marquer ${messagesToRead.length} messages comme lus...`);
    
    socket.emit('mark_read', {
      channelId: data.channelId,
      messageIds: messagesToRead
    });
  }
});

socket.on('notifications_read', (data) => {
  console.log('🔔 NOTIFICATION READ EVENT REÇU:');
  console.log('  UserId:', data.userId);
  console.log('  ChannelId:', data.channelId);
  console.log('  ChannelType:', data.channelType);
  console.log('\n✅ Les notifications de la sidebar devraient maintenant se synchroniser!');
  
  setTimeout(() => {
    socket.disconnect();
    process.exit(0);
  }, 2000);
});

socket.on('error', (error) => {
  console.error('❌ Erreur:', error);
});

setTimeout(() => {
  console.log('⏰ Timeout');
  socket.disconnect();
  process.exit(1);
}, 15000);
