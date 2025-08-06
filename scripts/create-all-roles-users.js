const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function createAllRolesUsers() {
  const uri = 'mongodb+srv://user:password@cluster.mongodb.net/database';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connecté à MongoDB Atlas');
    
    const db = client.db('coworking-platform');
    const users = db.collection('users');
    
    const testUsers = [
      {
        email: 'admin@example.com',
        role: 'admin',
        firstName: 'Admin',
        lastName: 'User'
      },
      {
        email: 'manager@example.com',
        role: 'manager',
        firstName: 'Manager',
        lastName: 'User'
      },
      {
        email: 'staff@example.com',
        role: 'staff',
        firstName: 'Staff',
        lastName: 'User'
      },
      {
        email: 'client@example.com',
        role: 'client',
        firstName: 'Client',
        lastName: 'User'
      }
    ];
    
    console.log('🔧 Création des utilisateurs de test...');
    
    for (const userData of testUsers) {
      // Vérifier si l'utilisateur existe déjà
      const existingUser = await users.findOne({ email: userData.email });
      
      if (existingUser) {
        console.log(`✓ ${userData.role.toUpperCase()} existe déjà: ${userData.email}`);
        continue;
      }
      
      // Créer l'utilisateur
      const hashedPassword = await bcrypt.hash('password123', 12);
      
      const newUser = {
        email: userData.email,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        isActive: true,
        status: 'active',
        permissions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
        loginHistory: []
      };
      
      const result = await users.insertOne(newUser);
      console.log(`✅ ${userData.role.toUpperCase()} créé: ${userData.email}`);
    }
    
    console.log('\n📋 Récapitulatif des comptes de test:');
    console.log('┌─────────────────────────┬──────────────┬─────────────┐');
    console.log('│ Email                   │ Mot de passe │ Rôle        │');
    console.log('├─────────────────────────┼──────────────┼─────────────┤');
    console.log('│ admin@example.com       │ password123  │ admin       │');
    console.log('│ manager@example.com     │ password123  │ manager     │');
    console.log('│ staff@example.com       │ password123  │ staff       │');
    console.log('│ client@example.com      │ password123  │ client      │');
    console.log('│ test@example.com        │ password123  │ client      │');
    console.log('└─────────────────────────┴──────────────┴─────────────┘');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await client.close();
    console.log('🔌 Connexion fermée');
  }
}

createAllRolesUsers();