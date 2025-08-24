import { NextRequest, NextResponse } from 'next/server'
import { connectMongoose } from '@/lib/mongoose'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import mongoose from 'mongoose'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    await connectMongoose()

    console.log('🔍 Récupération des channels avec enrichissement DM...')

    // Accéder directement aux collections
    const db = mongoose.connection.db
    
    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Base de données non connectée' },
        { status: 500 }
      )
    }
    
    const channelsCollection = db.collection('channels')
    const usersCollection = db.collection('users')

    const channels = await channelsCollection.find({ isActive: true }).toArray()

    console.log(`✅ Channels trouvés: ${channels.length}`)

    // Enrichir les DMs avec les noms des contacts
    const enrichedChannels = await Promise.all(
      channels.map(async (channel) => {
        let displayName = channel.name

        // Si c'est un DM, récupérer le nom du contact
        if (channel.type === 'direct' || channel.type === 'dm') {
          const currentUserId = session?.user?.id

          if (currentUserId && channel.members && channel.members.length >= 2) {
            // Trouver l'autre utilisateur (pas l'utilisateur actuel)
            const otherMember = channel.members.find(
              (member: any) => member.user.toString() !== currentUserId
            )

            if (otherMember) {
              try {
                const otherUser = await usersCollection.findOne({
                  _id: new mongoose.Types.ObjectId(otherMember.user),
                })

                if (otherUser) {
                  displayName =
                    otherUser.firstName && otherUser.lastName
                      ? `${otherUser.firstName} ${otherUser.lastName}`
                      : otherUser.name ||
                        otherUser.email ||
                        'Utilisateur inconnu'
                }
              } catch (err) {
                console.log('Erreur enrichissement DM:', err)
              }
            }
          }
        }

        return {
          _id: channel._id,
          name: displayName,
          type: channel.type,
          description: channel.description,
          memberCount: channel.members?.length || 0,
          isActive: channel.isActive,
          lastActivity: channel.lastActivity,
        }
      })
    )

    return NextResponse.json({
      success: true,
      count: enrichedChannels.length,
      channels: enrichedChannels,
    })
  } catch (error) {
    console.error('Erreur simple channels:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', message: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    )
  }
}
