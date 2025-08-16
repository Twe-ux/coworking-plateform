import { NextRequest, NextResponse } from 'next/server'
import { connectMongoose } from '@/lib/mongoose'
import mongoose from 'mongoose'

export async function GET(request: NextRequest) {
  try {
    await connectMongoose()
    
    console.log('🔍 Test direct avec mongoose...')
    
    // Accéder directement à la collection
    const db = mongoose.connection.db
    const channelsCollection = db.collection('channels')
    
    const channels = await channelsCollection.find({ isActive: true }).toArray()
    
    console.log(`✅ Channels trouvés: ${channels.length}`)

    return NextResponse.json({
      success: true,
      count: channels.length,
      channels: channels.map(channel => ({
        _id: channel._id,
        name: channel.name,
        type: channel.type,
        description: channel.description,
        memberCount: channel.members?.length || 0,
        isActive: channel.isActive
      }))
    })
  } catch (error) {
    console.error('Erreur simple channels:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', message: error.message },
      { status: 500 }
    )
  }
}