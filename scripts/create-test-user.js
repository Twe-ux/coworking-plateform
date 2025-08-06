const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function createTestUser() {
  const client = new MongoClient('mongodb+srv://user:password@cluster.mongodb.net/database');
  
  try {
    await client.connect();
    console.log('Connecté à MongoDB');
    
    const db = client.db('coworking-platform');
    const users = db.collection('users');
    
    // Vérifier si l'utilisateur test existe déjà
    const existingUser = await users.findOne({ email: 'test@example.com' });
    
    if (existingUser) {
      console.log('Utilisateur test existe déjà:', existingUser.email);
      console.log('Rôle:', existingUser.role);
      console.log('Actif:', existingUser.isActive);
      return;
    }
    
    // Créer un mot de passe haché
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    // Créer l'utilisateur test
    const testUser = {
      email: 'test@example.com',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
      role: 'client',
      isActive: true,
      status: 'active',
      permissions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: null,
      loginHistory: []
    };
    
    const result = await users.insertOne(testUser);
    console.log('✅ Utilisateur test créé avec succès');
    console.log('ID:', result.insertedId);
    console.log('Email: test@example.com');
    console.log('Mot de passe: password123');
    console.log('Rôle: client');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await client.close();
  }
}

createTestUser();