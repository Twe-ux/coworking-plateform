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
    const bookingUserId = new ObjectId((booking as any).userId)
    if (!bookingUserId.equals(userObjectId) && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Accès refusé', code: 'ACCESS_DENIED' },
        { status: 403 }
      )
    }

    // Récupérer les données utilisateur pour l'email
    const user = await User.findById((booking as any).userId).select('email firstName lastName').lean()

    // Formater la réponse
    return NextResponse.json({
      success: true,
      booking: {
        id: (booking as any)._id.toString(),
        userId: (booking as any).userId.toString(),
        space: (booking as any).spaceId ? {
          id: (booking as any).spaceId.id,
          name: (booking as any).spaceId.name,
          location: (booking as any).spaceId.location,
          capacity: (booking as any).spaceId.capacity,
          specialty: (booking as any).spaceId.specialty,
          image: (booking as any).spaceId.image,
          features: (booking as any).spaceId.features,
          rating: (booking as any).spaceId.rating
        } : null,
        date: (booking as any).date.toISOString(),
        startTime: (booking as any).startTime,
        endTime: (booking as any).endTime,
        duration: (booking as any).duration,
        durationType: (booking as any).durationType,
        guests: (booking as any).guests,
        totalPrice: (booking as any).totalPrice,
        status: (booking as any).status,
        paymentStatus: (booking as any).paymentStatus,
        paymentMethod: (booking as any).paymentMethod,
        notes: (booking as any).notes,
        createdAt: (booking as any).createdAt.toISOString(),
        updatedAt: (booking as any).updatedAt.toISOString(),
      },
      user: user ? {
        email: (user as any).email,
        firstName: (user as any).firstName,
        lastName: (user as any).lastName
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