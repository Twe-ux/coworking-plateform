import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Retourner des compteurs vides - Socket.IO gère maintenant tout en temps réel
    console.log('📊 API compteurs notifications - retour compteurs vides (Socket.IO gère tout)')
    return NextResponse.json({
      success: true,
      counts: {
        totalUnread: 0,
        messagesDMs: 0,
        channels: 0,
        channelBreakdown: {}
      }
    })

  } catch (error) {
    console.error('❌ Erreur compteurs notifications:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}