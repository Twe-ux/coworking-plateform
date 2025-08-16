const mongoose = require('mongoose');

async function initChannels() {
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
    
    // Channel schema
    const channelSchema = new mongoose.Schema({
      name: String,
      type: String,
      description: String,
      members: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: String,
        joinedAt: Date
      }],
      settings: {
        allowFileUploads: Boolean,
        allowReactions: Boolean,
        slowModeSeconds: Number
      },
      ipRestrictions: {
        enabled: Boolean,
        allowedIPs: [String],
        whitelist: [String]
      },
      isActive: Boolean,
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      createdAt: { type: Date, default: Date.now }
    });
    const Channel = mongoose.model('Channel', channelSchema);
    
    // Get admin user
    const admin = await User.findOne({ email: 'admin@test.com' });
    if (!admin) {
      console.log('❌ Admin user not found');
      return;
    }
    
    console.log('✅ Admin user found:', admin.name);
    
    // Create channels
    const channels = [
      {
        name: 'général',
        type: 'public',
        description: 'Canal général pour les discussions',
        members: [{ user: admin._id, role: 'admin', joinedAt: new Date() }],
        settings: {
          allowFileUploads: true,
          allowReactions: true,
          slowModeSeconds: 0
        },
        ipRestrictions: {
          enabled: true,
          allowedIPs: ['127.0.0.1', '::1', 'localhost'],
          whitelist: ['127.0.0.1', '::1']
        },
        isActive: true,
        createdBy: admin._id
      },
      {
        name: 'ia-assistant',
        type: 'ai_assistant',
        description: 'Canal pour interagir avec l assistant IA',
        members: [{ user: admin._id, role: 'admin', joinedAt: new Date() }],
        settings: {
          allowFileUploads: false,
          allowReactions: true,
          slowModeSeconds: 0
        },
        ipRestrictions: {
          enabled: true,
          allowedIPs: ['127.0.0.1', '::1', 'localhost'],
          whitelist: ['127.0.0.1', '::1']
        },
        isActive: true,
        createdBy: admin._id
      }
    ];
    
    for (const channelData of channels) {
      const existing = await Channel.findOne({ name: channelData.name });
      if (!existing) {
        const channel = new Channel(channelData);
        await channel.save();
        console.log(`✅ Channel created: ${channel.name} (${channel.type})`);
      } else {
        console.log(`ℹ️  Channel ${channelData.name} already exists`);
      }
    }
    
    const totalChannels = await Channel.countDocuments();
    console.log(`✅ Channels initialization complete. Total channels: ${totalChannels}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

initChannels();