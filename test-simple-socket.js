// Test Socket.IO client simple avec Node.js
const { io } = require('socket.io-client');

console.log('🚀 Test connexion Socket.IO...');

const socket = io('http://localhost:3001/api/socket', {
    auth: {
        sessionToken: 'test-token',
        userId: '68937e9a67fd70e1283b0378',
        userRole: 'admin', 
        userName: 'Test Admin',
        userEmail: 'admin@example.com'
    },
    transports: ['websocket', 'polling'],
    timeout: 10000
});

socket.on('connect', () => {
    console.log('✅ Socket.IO Connected!', socket.id);
    
    // Test d'événement
    socket.emit('request_online_users');
});

socket.on('disconnect', (reason) => {
    console.log('❌ Socket.IO Disconnected:', reason);
    process.exit(0);
});

socket.on('connect_error', (error) => {
    console.error('❌ Socket.IO Error:', error.message);
    process.exit(1);
});

socket.on('online_users_list', (data) => {
    console.log('👥 Online users:', data.users.length);
});

socket.on('error', (error) => {
    console.error('🚫 Server Error:', error);
});

// Timeout après 15 secondes
setTimeout(() => {
    console.log('⏰ Test timeout');
    socket.disconnect();
    process.exit(0);
}, 15000);