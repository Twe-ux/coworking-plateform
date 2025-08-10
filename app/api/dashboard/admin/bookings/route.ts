import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { UserRole } from '@/types/auth'
import dbConnect from '@/lib/mongodb'
import Booking from '@/lib/models/booking'

/**
 * API pour la gestion des réservations par l'admin
 */
export async function GET() {
  try {
    // Vérifier l'authentification et les permissions admin
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

    await dbConnect()

    // Récupérer toutes les réservations avec les informations utilisateur et espace
    const bookings = await Booking.find()
      .populate('userId', 'firstName lastName email')
      .populate('spaceId', 'name location id')
      .sort({ createdAt: -1 }) // Plus récentes d'abord
      .lean()

    // Formater les données pour l'interface
    const formattedBookings = bookings.map((booking) => ({
      _id: booking._id.toString(),
      user: {
        firstName: booking.userId?.firstName || 'N/A',
        lastName: booking.userId?.lastName || 'N/A',
        email: booking.userId?.email || 'N/A',
      },
      spaceName: booking.spaceId?.name || 'Espace supprimé',
      spaceLocation: booking.spaceId?.location || 'N/A',
      date: new Date(booking.date).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      startTime: booking.startTime,
      endTime: booking.endTime,
      duration: booking.duration,
      durationType: booking.durationType,
      guests: booking.guests,
      totalPrice: booking.totalPrice,
      paymentMethod: booking.paymentMethod,
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
    console.error('❌ Erreur API Bookings Admin:', error)
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
 * Mettre à jour le statut d'une réservation
 */
export async function PATCH(request: NextRequest) {
  try {
    // Vérifier l'authentification et les permissions admin
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

    const { bookingId, status } = await request.json()

    if (!bookingId || !status) {
      return NextResponse.json(
        { error: 'bookingId et status sont requis' },
        { status: 400 }
      )
    }

    if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Statut invalide' }, { status: 400 })
    }

    await dbConnect()

    // Mettre à jour la réservation
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        status,
        updatedAt: new Date(),
      },
      { new: true }
    )

    if (!updatedBooking) {
      return NextResponse.json(
        { error: 'Réservation non trouvée' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Statut de la réservation mis à jour',
      data: {
        bookingId: updatedBooking._id,
        newStatus: updatedBooking.status,
      },
    })
  } catch (error: any) {
    console.error('❌ Erreur mise à jour réservation:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la mise à jour de la réservation',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
