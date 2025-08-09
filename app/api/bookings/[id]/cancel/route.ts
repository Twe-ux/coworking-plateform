import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { connectMongoose } from '@/lib/mongoose'
import { Booking } from '@/lib/models'
import { isValidObjectId } from 'mongoose'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const bookingId = params.id
    
    if (!isValidObjectId(bookingId)) {
      return NextResponse.json(
        { error: 'ID de réservation invalide' },
        { status: 400 }
      )
    }

    await connectMongoose()

    // Find the booking
    const booking = await Booking.findById(bookingId)

    if (!booking) {
      return NextResponse.json(
        { error: 'Réservation non trouvée' },
        { status: 404 }
      )
    }

    // Check if user owns this booking
    if (booking.user.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      )
    }

    // Check if booking can be cancelled
    if (booking.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Cette réservation est déjà annulée' },
        { status: 400 }
      )
    }

    if (booking.status === 'completed') {
      return NextResponse.json(
        { error: 'Impossible d\'annuler une réservation terminée' },
        { status: 400 }
      )
    }

    // Check if it's too late to cancel (same day)
    const bookingDate = new Date(booking.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    bookingDate.setHours(0, 0, 0, 0)

    if (bookingDate.getTime() === today.getTime()) {
      return NextResponse.json(
        { error: 'Impossible d\'annuler une réservation le jour même' },
        { status: 400 }
      )
    }

    // Update booking status
    booking.status = 'cancelled'
    booking.updatedAt = new Date()
    
    await booking.save()

    return NextResponse.json({
      message: 'Réservation annulée avec succès',
      booking: {
        id: booking._id.toString(),
        status: booking.status,
        updatedAt: booking.updatedAt
      }
    })

  } catch (error) {
    console.error('Erreur lors de l\'annulation:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}