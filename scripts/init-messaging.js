const { connectMongoose } = require('../lib/mongoose')
const { Channel } = require('../lib/models/channel')
const { User } = require('../lib/models/user')
const { Message } = require('../lib/models/message')

async function initMessaging() {
  try {
    console.log('🚀 Initialisation du système de messagerie...')
    await connectMongoose()

    // Vérifier si l'utilisateur admin existe
    let adminUser = await User.findOne({ email: 'admin@test.com' })
    if (!adminUser) {
      console.log('❌ Utilisateur admin non trouvé. Veuillez d\'abord créer un utilisateur admin.')
      return
    }

    console.log('✅ Utilisateur admin trouvé:', adminUser.name)

    // Créer des channels de base s'ils n'existent pas
    const channels = [
      {
        name: 'général',
        type: 'public',
        description: 'Canal général pour les discussions',
        members: [{ user: adminUser._id, role: 'admin', joinedAt: new Date() }],
        settings: {
          allowFileUploads: true,
          allowReactions: true,
          slowModeSeconds: 0,
          requireApproval: false
        },
        ipRestrictions: {
          enabled: true,
          allowedIPs: ['127.0.0.1', '::1', 'localhost'],
          whitelist: ['127.0.0.1', '::1']
        },
        isActive: true,
        createdBy: adminUser._id
      },
      {
        name: 'annonces',
        type: 'public',
        description: 'Canal pour les annonces importantes',
        members: [{ user: adminUser._id, role: 'admin', joinedAt: new Date() }],
        settings: {
          allowFileUploads: true,
          allowReactions: true,
          slowModeSeconds: 0,
          requireApproval: true
        },
        ipRestrictions: {
          enabled: true,
          allowedIPs: ['127.0.0.1', '::1', 'localhost'],
          whitelist: ['127.0.0.1', '::1']
        },
        isActive: true,
        createdBy: adminUser._id
      },
      {
        name: 'ia-assistant',
        type: 'ai_assistant',
        description: 'Canal pour interagir avec l\'assistant IA',
        members: [{ user: adminUser._id, role: 'admin', joinedAt: new Date() }],
        settings: {
          allowFileUploads: false,
          allowReactions: true,
          slowModeSeconds: 0,
          requireApproval: false
        },
        aiSettings: {
          provider: 'openai',
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 1000,
          systemPrompt: 'Tu es un assistant IA spécialisé dans les espaces de coworking. Aide les utilisateurs avec leurs questions.'
        },
        ipRestrictions: {
          enabled: true,
          allowedIPs: ['127.0.0.1', '::1', 'localhost'],
          whitelist: ['127.0.0.1', '::1']
        },
        isActive: true,
        createdBy: adminUser._id
      }
    ]

    for (const channelData of channels) {
      const existingChannel = await Channel.findOne({ name: channelData.name })
      if (!existingChannel) {
        const channel = new Channel(channelData)
        await channel.save()
        console.log(`✅ Canal créé: ${channel.name} (${channel.type})`)

        // Ajouter un message de bienvenue
        if (channel.name === 'général') {
          const welcomeMessage = new Message({
            content: `Bienvenue dans le canal ${channel.name} ! 👋\\n\\nCe canal est destiné aux discussions générales de l'espace de coworking.`,
            messageType: 'system',
            sender: adminUser._id,
            channel: channel._id,
            createdAt: new Date(),
            readBy: [{ user: adminUser._id, readAt: new Date() }]
          })
          await welcomeMessage.save()
          console.log(`📝 Message de bienvenue ajouté pour ${channel.name}`)
        }
      } else {
        console.log(`ℹ️  Canal ${channelData.name} existe déjà`)
      }
    }

    console.log('✅ Initialisation du système de messagerie terminée')
    
    // Afficher un résumé
    const totalChannels = await Channel.countDocuments()
    const totalMessages = await Message.countDocuments()
    
    console.log('📊 Résumé:')
    console.log(`   - Canaux: ${totalChannels}`)
    console.log(`   - Messages: ${totalMessages}`)
    console.log(`   - Utilisateur admin: ${adminUser.name} (${adminUser.email})`)
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error)
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  initMessaging()
}

module.exports = { initMessaging }