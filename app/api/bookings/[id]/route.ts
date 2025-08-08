import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { ObjectId } from 'mongodb'
import { authOptions } from '@/lib/auth'
import { connectMongoose } from '@/lib/mongoose'
import { Booking, Space, User } from '@/lib/models'

/**
 * GET /api/bookings/[id] - Récupérer les détails d'une réservation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentification requise', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // Valider l'ID de réservation
    const bookingId = params.id
    if (!ObjectId.isValid(bookingId)) {
      return NextResponse.json(
        { error: 'ID de réservation invalide', code: 'INVALID_ID' },
        { status: 400 }
      )
    }

    // Connexion à la base de données
    await connectMongoose()

    // Récupérer la réservation avec les données liées
    const booking = await Booking.findById(bookingId)
      .populate('spaceId', 'id name location capacity specialty image features rating')
      .lean()

    if (!booking) {
      return NextResponse.json(
        { error: 'Réservation non trouvée', code: 'BOOKING_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Vérifier que l'utilisateur est propriétaire de la réservation ou admin
    const userObjectId = new ObjectId(session.user.id)
    if (!booking.userId.equals(userObjectId) && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Accès refusé', code: 'ACCESS_DENIED' },
        { status: 403 }
      )
    }

    // Récupérer les données utilisateur pour l'email
    const user = await User.findById(booking.userId).select('email firstName lastName').lean()

    // Formater la réponse
    return NextResponse.json({
      success: true,
      booking: {
        id: booking._id.toString(),
        userId: booking.userId.toString(),
        space: booking.spaceId ? {
          id: booking.spaceId.id,
          name: booking.spaceId.name,
          location: booking.spaceId.location,
          capacity: booking.spaceId.capacity,
          specialty: booking.spaceId.specialty,
          image: booking.spaceId.image,
          features: booking.spaceId.features,
          rating: booking.spaceId.rating
        } : null,
        date: booking.date.toISOString(),
        startTime: booking.startTime,
        endTime: booking.endTime,
        duration: booking.duration,
        durationType: booking.durationType,
        guests: booking.guests,
        totalPrice: booking.totalPrice,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        paymentMethod: booking.paymentMethod,
        notes: booking.notes,
        createdAt: booking.createdAt.toISOString(),
        updatedAt: booking.updatedAt.toISOString(),
      },
      user: user ? {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      } : null
    })

  } catch (error) {
    console.error('[GET /api/bookings/[id]] Error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la réservation', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}