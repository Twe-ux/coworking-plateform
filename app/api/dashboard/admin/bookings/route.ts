import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { UserRole } from '@/types/auth'
import connectMongoose from '@/lib/mongoose'
import { Booking } from '@/lib/models/booking'

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
    const { bookingId, status, adminNote } = body

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
    if (adminNote) {
      booking.adminNote = adminNote
    }
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
      id: updatedBooking._id.toString(),
      user: {
        firstName: updatedBooking.userId?.firstName || 'N/A',
        lastName: updatedBooking.userId?.lastName || 'N/A',
        email: updatedBooking.userId?.email || 'N/A',
      },
      spaceName: updatedBooking.spaceId?.name || 'Espace supprimé',
      spaceLocation: updatedBooking.spaceId?.location || 'N/A',
      date: updatedBooking.date,
      startTime: updatedBooking.startTime,
      endTime: updatedBooking.endTime,
      totalPrice: updatedBooking.totalPrice,
      status: updatedBooking.status,
      adminNote: updatedBooking.adminNote,
      createdAt: updatedBooking.createdAt,
      updatedAt: updatedBooking.updatedAt,
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
