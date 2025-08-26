const { MongoClient, ObjectId } = require('mongodb');

async function initAIChannel() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('coworking-platform');

  console.log('🤖 Initialisation du channel IA...');

  // Supprimer l'ancien channel IA public s'il existe
  await db.collection('channels').deleteMany({ 
    type: 'ai_assistant',
    name: { $in: ['Assistant IA', 'IA Assistant', 'AI Assistant'] }
  });

  // Créer le nouveau channel IA privé
  const aiChannel = {
    name: 'Assistant IA Personnel',
    slug: 'assistant-ia-personnel',
    description: 'Votre assistant IA personnel pour l\'aide et les conseils',
    type: 'ai_assistant',
    isArchived: false,
    isDeleted: false,
    isActive: true,
    isPrivate: true, // Channel privé

    members: [], // Sera rempli dynamiquement pour chaque utilisateur

    settings: {
      allowFileUploads: false,
      allowReactions: true,
      slowModeSeconds: 0,
      requireApproval: false,
      isReadOnly: false,
      maxMembers: 1, // Seulement l'utilisateur
    },

    ipRestrictions: {
      enabled: false,
      allowedIPs: [],
      blockedIPs: [],
      whitelist: [],
    },

    aiSettings: {
      enabled: true,
      provider: 'openai',
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 1000,
      systemPrompt: 'Tu es un assistant IA spécialisé dans les espaces de coworking. Tu aides les utilisateurs avec leurs questions sur la réservation d\'espaces, les tarifs, les services disponibles et toute autre question liée au coworking. Réponds de manière amicale et professionnelle en français.',
    },

    createdBy: new ObjectId('000000000000000000000000'), // ID système
    lastActivity: new Date(),
    messageCount: 0,
    tags: ['ai_assistant', 'private'],

    audit: {
      createdAt: new Date(),
      updatedAt: new Date(),
      lastModifiedBy: new ObjectId('000000000000000000000000'),
    },
  };

  const result = await db.collection('channels').insertOne(aiChannel);
  console.log('✅ Channel IA créé:', result.insertedId);

  // Créer les messages de bienvenue par défaut
  const welcomeMessages = [
    {
      content: '👋 Bonjour ! Je suis votre assistant IA personnel pour tout ce qui concerne le coworking.',
      messageType: 'text',
      sender: new ObjectId('000000000000000000000000'), // ID système pour l'IA
      channel: result.insertedId,
      attachments: [],
      reactions: [],
      readBy: [],
      createdAt: new Date(Date.now() - 5000), // 5 secondes avant
      updatedAt: new Date(Date.now() - 5000)
    },
    {
      content: '🏢 Je peux vous aider avec :\n• Réservation d\'espaces de travail\n• Informations sur les tarifs\n• Services disponibles\n• Horaires d\'ouverture\n• Et toute autre question !',
      messageType: 'text', 
      sender: new ObjectId('000000000000000000000000'),
      channel: result.insertedId,
      attachments: [],
      reactions: [],
      readBy: [],
      createdAt: new Date(Date.now() - 3000), // 3 secondes avant
      updatedAt: new Date(Date.now() - 3000)
    },
    {
      content: '💬 N\'hésitez pas à me poser vos questions !',
      messageType: 'text',
      sender: new ObjectId('000000000000000000000000'), 
      channel: result.insertedId,
      attachments: [],
      reactions: [],
      readBy: [],
      createdAt: new Date(Date.now() - 1000), // 1 seconde avant
      updatedAt: new Date(Date.now() - 1000)
    }
  ];

  const messagesResult = await db.collection('messages').insertMany(welcomeMessages);
  console.log('✅ Messages de bienvenue créés:', messagesResult.insertedIds.length);

  // Mettre à jour le compteur de messages du channel
  await db.collection('channels').updateOne(
    { _id: result.insertedId },
    { 
      $set: { messageCount: welcomeMessages.length },
      $set: { lastActivity: new Date() }
    }
  );

  console.log('🎉 Initialisation du channel IA terminée !');
  await client.close();
}

if (require.main === module) {
  initAIChannel().catch(console.error);
}

module.exports = { initAIChannel };