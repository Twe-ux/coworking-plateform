import { authOptions } from '@/lib/auth'
import { Booking } from '@/lib/models/booking'
import connectMongoose from '@/lib/mongoose'
import { UserRole } from '@/types/auth'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

/**
 * API pour les réservations du dashboard avancé
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Accès refusé - Permissions administrateur requises' },
        { status: 403 }
      )
    }

    await connectMongoose()

    // Récupérer les réservations avec les informations utilisateur et espace
    const bookings = await Booking.find()
      .populate('userId', 'firstName lastName email')
      .populate('spaceId', 'name location id')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()

    // Formater les données pour l'interface
    const formattedBookings = bookings.map((booking: any) => ({
      id: booking._id?.toString() || booking.id,
      user: {
        firstName: booking.userId?.firstName || 'N/A',
        lastName: booking.userId?.lastName || 'N/A',
        email: booking.userId?.email || 'N/A',
      },
      spaceName:
        booking.spaceId?.name || booking.spaceName || 'Espace supprimé',
      spaceLocation: booking.spaceId?.location || 'N/A',
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      totalPrice: booking.totalPrice,
      status: booking.status,
      createdAt: booking.createdAt,
    }))

    return NextResponse.json({
      success: true,
      data: formattedBookings,
      count: formattedBookings.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('❌ Erreur API Advanced Bookings:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la récupération des réservations',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Mettre à jour le statut d'une réservation
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Accès refusé - Permissions administrateur requises' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { bookingId, status /*, adminNote */ } = body

    if (!bookingId || !status) {
      return NextResponse.json(
        { error: 'ID de réservation et statut requis' },
        { status: 400 }
      )
    }

    // Valider le statut
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Statut invalide' }, { status: 400 })
    }

    await connectMongoose()

    // Trouver et mettre à jour la réservation
    const booking = await Booking.findById(bookingId)

    if (!booking) {
      return NextResponse.json(
        { error: 'Réservation non trouvée' },
        { status: 404 }
      )
    }

    // Mettre à jour le statut
    booking.status = status
    // if (adminNote) {
    //   booking.adminNote = adminNote
    // }
    booking.updatedAt = new Date()

    await booking.save()

    // Récupérer la réservation mise à jour avec les données populées
    const updatedBooking = await Booking.findById(bookingId)
      .populate('userId', 'firstName lastName email')
      .populate('spaceId', 'name location')
      .lean()

    if (!updatedBooking) {
      return NextResponse.json(
        { error: 'Réservation introuvable après mise à jour' },
        { status: 404 }
      )
    }

    // Formater la réponse
    const formattedBooking = {
      id: (updatedBooking as any)._id.toString(),
      user: {
        firstName: (updatedBooking as any).userId?.firstName || 'N/A',
        lastName: (updatedBooking as any).userId?.lastName || 'N/A',
        email: (updatedBooking as any).userId?.email || 'N/A',
      },
      spaceName: (updatedBooking as any).spaceId?.name || 'Espace supprimé',
      spaceLocation: (updatedBooking as any).spaceId?.location || 'N/A',
      date: (updatedBooking as any).date,
      startTime: (updatedBooking as any).startTime,
      endTime: (updatedBooking as any).endTime,
      totalPrice: (updatedBooking as any).totalPrice,
      status: (updatedBooking as any).status,
      adminNote: (updatedBooking as any).adminNote,
      createdAt: (updatedBooking as any).createdAt,
      updatedAt: (updatedBooking as any).updatedAt,
    }

    return NextResponse.json({
      success: true,
      data: formattedBooking,
      message: `Réservation ${
        status === 'confirmed'
          ? 'confirmée'
          : status === 'cancelled'
            ? 'annulée'
            : status === 'completed'
              ? 'marquée comme terminée'
              : 'mise à jour'
      }`,
    })
  } catch (error: any) {
    console.error('❌ Erreur PATCH Bookings:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la mise à jour du statut',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
