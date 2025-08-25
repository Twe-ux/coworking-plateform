import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db/mongoose'
import { Channel } from '@/lib/models/channel'

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    
    console.log('🔍 Recherche des channels...')
    
    // Test sans filtre d'abord
    const allChannels = await Channel.find({}).lean()
    console.log(`📊 Total channels found: ${allChannels.length}`)
    
    if (allChannels.length > 0) {
      console.log('📋 First channel:', {
        name: allChannels[0].name,
        type: allChannels[0].type,
        isActive: allChannels[0].isActive,
        fields: Object.keys(allChannels[0])
      })
    }
    
    const activeChannels = await Channel.find({ isActive: true })
      .select('name type description members settings isActive createdAt')
      .lean()
    
    console.log(`✅ Active channels found: ${activeChannels.length}`)

    return NextResponse.json({
      success: true,
      debug: {
        totalChannels: allChannels.length,
        activeChannels: activeChannels.length,
        sampleChannel: allChannels[0] || null
      },
      channels: activeChannels.map(channel => ({
        _id: channel._id,
        name: channel.name,
        type: channel.type,
        description: channel.description,
        memberCount: channel.members?.length || 0,
        settings: channel.settings,
        createdAt: channel.createdAt
      }))
    })
  } catch (error) {
    console.error('Erreur test channels:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', message: (error as any).message },
      { status: 500 }
    )
  }
}