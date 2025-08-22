import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db/mongoose'
import { Message } from '@/lib/models/message'
import { Channel } from '@/lib/models/channel'

export async function GET(
  request: NextRequest,
  { params }: { params: { channelId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Non authentifié' },
        { status: 401 }
      )
    }

    await connectToDatabase()
    const { channelId } = params

    // Vérifier que l'utilisateur a accès au channel
    const channel = await Channel.findById(channelId)
    if (!channel) {
      return NextResponse.json(
        { success: false, message: 'Channel non trouvé' },
        { status: 404 }
      )
    }

    const isMember = channel.members.some(
      (member: any) => member.user.toString() === session.user.id
    )
    if (!isMember) {
      return NextResponse.json(
        { success: false, message: 'Accès refusé au channel' },
        { status: 403 }
      )
    }

    // Récupérer les IDs des messages non lus pour cet utilisateur
    const unreadMessages = await Message.find({
      channel: channelId,
      'readBy.user': { $ne: session.user.id },
    }).select('_id')

    const messageIds = unreadMessages.map((msg) => msg._id.toString())

    return NextResponse.json({
      success: true,
      messageIds,
      count: messageIds.length,
    })
  } catch (error) {
    console.error('Erreur récupération messages non lus:', error)
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
