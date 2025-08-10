const { MongoClient } = require('mongodb')
const bcrypt = require('bcryptjs')

async function createAdminUser() {
  const uri = 'mongodb+srv://user:password@cluster.mongodb.net/database'
  const client = new MongoClient(uri)

  try {
    await client.connect()
    const db = client.db('coworking-platform')
    
    // Vérifier si un admin existe déjà
    const existingAdmin = await db.collection('users').findOne({ role: 'admin' })
    
    if (existingAdmin) {
      console.log('✅ Un utilisateur admin existe déjà:', existingAdmin.email)
      return
    }
    
    // Créer un mot de passe hashé
    const password = 'admin123'
    const hashedPassword = await bcrypt.hash(password, 10)
    
    const adminUser = {
      email: 'admin@coworking.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'System',
      role: 'admin',
      isActive: true,
      status: 'active',
      permissions: ['manage_spaces', 'manage_users', 'manage_bookings'],
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const result = await db.collection('users').insertOne(adminUser)
    
    console.log('✅ Utilisateur admin créé avec succès!')
    console.log('📧 Email:', adminUser.email)
    console.log('🔑 Mot de passe:', password)
    console.log('🆔 ID:', result.insertedId)
    
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'admin:', error)
  } finally {
    await client.close()
  }
}

createAdminUser()