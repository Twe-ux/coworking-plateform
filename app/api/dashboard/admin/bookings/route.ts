import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { UserRole } from '@/types/auth'
import dbConnect from '@/lib/mongodb'
import Booking from '@/lib/models/booking'

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

    await dbConnect()

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
