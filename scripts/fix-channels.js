const mongoose = require('mongoose');

async function fixChannels() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/coworking-platform';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // User schema
    const userSchema = new mongoose.Schema({
      name: String,
      email: String,
      password: String,
      role: String,
      emailVerified: Date,
      isActive: Boolean
    });
    const User = mongoose.model('User', userSchema);
    
    // Complete Channel schema matching the TypeScript interface
    const channelSchema = new mongoose.Schema({
      name: { type: String, required: true },
      slug: { type: String, required: true },
      description: String,
      type: { 
        type: String, 
        enum: ['public', 'private', 'direct', 'ai_assistant'], 
        required: true 
      },
      avatar: String,
      isArchived: { type: Boolean, default: false },
      isDeleted: { type: Boolean, default: false },
      isActive: { type: Boolean, default: true },
      
      // Membres et permissions
      members: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        role: { 
          type: String, 
          enum: ['owner', 'admin', 'moderator', 'member'], 
          default: 'member' 
        },
        joinedAt: { type: Date, default: Date.now },
        lastSeen: Date,
        isMuted: { type: Boolean, default: false },
        permissions: {
          canWrite: { type: Boolean, default: true },
          canAddMembers: { type: Boolean, default: false },
          canDeleteMessages: { type: Boolean, default: false },
          canModerate: { type: Boolean, default: false }
        }
      }],
      
      // Paramètres du channel
      settings: {
        allowFileUploads: { type: Boolean, default: true },
        allowReactions: { type: Boolean, default: true },
        slowModeSeconds: { type: Number, default: 0 },
        requireApproval: { type: Boolean, default: false },
        isReadOnly: { type: Boolean, default: false },
        maxMembers: { type: Number, default: 1000 }
      },
      
      // Restrictions IP
      ipRestrictions: {
        enabled: { type: Boolean, default: false },
        allowedIPs: [String],
        blockedIPs: [String],
        whitelist: [String]
      },
      
      // Paramètres IA
      aiSettings: {
        enabled: { type: Boolean, default: false },
        provider: { type: String, enum: ['openai', 'anthropic', 'custom'] },
        model: String,
        apiKey: String,
        temperature: { type: Number, default: 0.7 },
        maxTokens: { type: Number, default: 1000 },
        systemPrompt: String,
        rateLimitPerUser: { type: Number, default: 10 },
        rateLimitWindow: { type: Number, default: 3600 }
      },
      
      // Métadonnées
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      lastActivity: { type: Date, default: Date.now },
      messageCount: { type: Number, default: 0 },
      tags: [String],
      
      // Audit
      audit: {
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
        lastModifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
      }
    });
    
    const Channel = mongoose.model('Channel', channelSchema);
    
    // Get admin user
    const admin = await User.findOne({ email: 'admin@test.com' });
    if (!admin) {
      console.log('❌ Admin user not found');
      return;
    }
    
    console.log('✅ Admin user found:', admin.name);
    
    // Clear existing channels
    await Channel.deleteMany({});
    console.log('🗑️  Cleared existing channels');
    
    // Create proper channels
    const channels = [
      {
        name: 'Général',
        slug: 'general',
        description: 'Canal général pour les discussions de l\'espace de coworking',
        type: 'public',
        isArchived: false,
        isDeleted: false,
        isActive: true,
        members: [{
          user: admin._id,
          role: 'admin',
          joinedAt: new Date(),
          isMuted: false,
          permissions: {
            canWrite: true,
            canAddMembers: true,
            canDeleteMessages: true,
            canModerate: true
          }
        }],
        settings: {
          allowFileUploads: true,
          allowReactions: true,
          slowModeSeconds: 0,
          requireApproval: false,
          isReadOnly: false,
          maxMembers: 1000
        },
        ipRestrictions: {
          enabled: true,
          allowedIPs: ['127.0.0.1', '::1', 'localhost'],
          blockedIPs: [],
          whitelist: ['127.0.0.1', '::1']
        },
        aiSettings: {
          enabled: false
        },
        createdBy: admin._id,
        lastActivity: new Date(),
        messageCount: 0,
        tags: ['général', 'discussion'],
        audit: {
          createdAt: new Date(),
          updatedAt: new Date(),
          lastModifiedBy: admin._id
        }
      },
      {
        name: 'Assistant IA',
        slug: 'ia-assistant',
        description: 'Canal pour interagir avec l\'assistant IA du coworking',
        type: 'ai_assistant',
        isArchived: false,
        isDeleted: false,
        isActive: true,
        members: [{
          user: admin._id,
          role: 'admin',
          joinedAt: new Date(),
          isMuted: false,
          permissions: {
            canWrite: true,
            canAddMembers: true,
            canDeleteMessages: true,
            canModerate: true
          }
        }],
        settings: {
          allowFileUploads: false,
          allowReactions: true,
          slowModeSeconds: 0,
          requireApproval: false,
          isReadOnly: false,
          maxMembers: 1000
        },
        ipRestrictions: {
          enabled: true,
          allowedIPs: ['127.0.0.1', '::1', 'localhost'],
          blockedIPs: [],
          whitelist: ['127.0.0.1', '::1']
        },
        aiSettings: {
          enabled: true,
          provider: 'openai',
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 1000,
          systemPrompt: 'Tu es un assistant IA spécialisé dans les espaces de coworking. Aide les utilisateurs avec leurs questions sur l\'espace, les réservations, et les services disponibles.',
          rateLimitPerUser: 10,
          rateLimitWindow: 3600
        },
        createdBy: admin._id,
        lastActivity: new Date(),
        messageCount: 0,
        tags: ['ia', 'assistant', 'support'],
        audit: {
          createdAt: new Date(),
          updatedAt: new Date(),
          lastModifiedBy: admin._id
        }
      }
    ];
    
    for (const channelData of channels) {
      const channel = new Channel(channelData);
      await channel.save();
      console.log(`✅ Channel created: ${channel.name} (${channel.type})`);
    }
    
    const totalChannels = await Channel.countDocuments({ isActive: true });
    console.log(`✅ Channels initialization complete. Total active channels: ${totalChannels}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

fixChannels();