const { MongoClient } = require('mongodb');

async function debugUserStatus() {
  const uri = 'mongodb+srv://dev:3mEKdYmohYa4oCjZ@coworking.jhxdixz.mongodb.net/coworking-platform';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db('coworking-platform');
    const users = db.collection('users');
    
    const user = await users.findOne({ email: 'test@example.com' });
    
    console.log('🔍 Détails complets de l\'utilisateur test:');
    console.log('ID:', user._id);
    console.log('Email:', user.email);
    console.log('isActive:', user.isActive, '(type:', typeof user.isActive, ')');
    console.log('status:', user.status, '(type:', typeof user.status, ')');
    console.log('role:', user.role);
    
    // Vérifier les conditions d'authentification
    console.log('\n🧪 Vérifications d\'authentification:');
    console.log('user.isActive:', user.isActive);
    console.log('!user.isActive:', !user.isActive);
    console.log('user.status:', user.status);
    console.log('user.status !== "active":', user.status !== 'active');
    console.log('Condition finale (!user.isActive || user.status !== "active"):', 
                !user.isActive || user.status !== 'active');
    
    if (!user.isActive || user.status !== 'active') {
      console.log('\n❌ ÉCHEC: L\'utilisateur échoue aux vérifications');
      console.log('Raison:');
      if (!user.isActive) console.log('  - isActive est false/undefined');
      if (user.status !== 'active') console.log('  - status n\'est pas "active", c\'est:', user.status);
      
      // Corriger l'utilisateur
      console.log('\n🔧 Correction de l\'utilisateur...');
      await users.updateOne(
        { email: 'test@example.com' },
        {
          $set: {
            isActive: true,
            status: 'active'
          }
        }
      );
      console.log('✅ Utilisateur corrigé');
    } else {
      console.log('\n✅ SUCCÈS: L\'utilisateur passe toutes les vérifications');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await client.close();
  }
}

debugUserStatus();