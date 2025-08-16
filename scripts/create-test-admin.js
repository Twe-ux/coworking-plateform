const { connectMongoose } = require('../lib/mongoose')
const { User } = require('../lib/models/user')
const bcrypt = require('bcryptjs')

async function createTestAdmin() {
  try {
    console.log('Connexion à la base de données...')
    await connectMongoose()

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email: 'admin@test.com' })
    if (existingUser) {
      console.log('✅ Utilisateur admin@test.com existe déjà')
      return
    }

    // Créer un nouvel utilisateur admin
    const hashedPassword = await bcrypt.hash('admin123', 12)
    
    const adminUser = new User({
      name: 'Admin Test',
      email: 'admin@test.com',
      password: hashedPassword,
      role: 'admin',
      emailVerified: new Date(),
      isActive: true
    })

    await adminUser.save()
    console.log('✅ Utilisateur admin créé avec succès')
    console.log('📧 Email: admin@test.com')
    console.log('🔑 Mot de passe: admin123')
    
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'utilisateur:', error)
  }
}

createTestAdmin()