const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function checkMongoDBConnection() {
  const uri = 'mongodb+srv://dev:3mEKdYmohYa4oCjZ@coworking.jhxdixz.mongodb.net/coworking-platform';
  const client = new MongoClient(uri);
  
  try {
    console.log('🔗 Tentative de connexion à MongoDB Atlas...');
    await client.connect();
    console.log('✅ Connecté à MongoDB Atlas');
    
    const db = client.db('coworking-platform');
    const users = db.collection('users');
    
    // Vérifier si l'utilisateur test existe
    console.log('🔍 Recherche de l\'utilisateur test...');
    const existingUser = await users.findOne({ email: 'test@example.com' });
    
    if (existingUser) {
      console.log('✅ Utilisateur test trouvé:', {
        id: existingUser._id,
        email: existingUser.email,
        role: existingUser.role,
        isActive: existingUser.isActive,
        hasPassword: !!existingUser.password,
        passwordLength: existingUser.password?.length || 0
      });
      
      // Tester le mot de passe
      if (existingUser.password) {
        const isPasswordValid = await bcrypt.compare('password123', existingUser.password);
        console.log('🔐 Mot de passe valide:', isPasswordValid);
      } else {
        console.log('❌ Aucun mot de passe défini pour cet utilisateur');
      }
      
    } else {
      console.log('❌ Utilisateur test non trouvé, création...');
      
      // Créer l'utilisateur test
      const hashedPassword = await bcrypt.hash('password123', 12);
      
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
      console.log('✅ Utilisateur test créé:', {
        id: result.insertedId,
        email: testUser.email,
        role: testUser.role
      });
    }
    
    // Tester la connexion générale
    console.log('🗄️  Collections disponibles:');
    const collections = await db.listCollections().toArray();
    collections.forEach(col => console.log(`  - ${col.name}`));
    
  } catch (error) {
    console.error('❌ Erreur de connexion MongoDB:', error.message);
    if (error.code === 8000) {
      console.error('🔑 Problème d\'authentification - vérifiez les credentials MongoDB');
    }
  } finally {
    await client.close();
    console.log('🔌 Connexion fermée');
  }
}

checkMongoDBConnection();