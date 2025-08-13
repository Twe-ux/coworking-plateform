import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { ObjectId } from 'mongodb'
import { authOptions } from '@/lib/auth'
import { connectMongoose } from '@/lib/mongoose'
import { Booking, Space, User } from '@/lib/models'
import { sendBookingCancellationEmail } from '@/lib/email'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

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
      .populate(
        'spaceId',
        'id name location capacity specialty image features rating'
      )
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
    const user = await User.findById((booking as any).userId)
      .select('email firstName lastName')
      .lean()

    // Formater la réponse
    return NextResponse.json({
      success: true,
      booking: {
        id: (booking as any)._id.toString(),
        userId: (booking as any).userId.toString(),
        space: (booking as any).spaceId
          ? {
              id: (booking as any).spaceId.id,
              name: (booking as any).spaceId.name,
              location: (booking as any).spaceId.location,
              capacity: (booking as any).spaceId.capacity,
              specialty: (booking as any).spaceId.specialty,
              image: (booking as any).spaceId.image,
              features: (booking as any).spaceId.features,
              rating: (booking as any).spaceId.rating,
            }
          : null,
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
      user: user
        ? {
            email: (user as any).email,
            firstName: (user as any).firstName,
            lastName: (user as any).lastName,
          }
        : null,
    })
  } catch (error) {
    console.error('[GET /api/bookings/[id]] Error:', error)
    return NextResponse.json(
      {
        error: 'Erreur lors de la récupération de la réservation',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/bookings/[id] - Annuler une réservation
 */
export async function DELETE(
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
    const booking = await Booking.findById(bookingId).populate(
      'spaceId',
      'name location'
    )

    if (!booking) {
      return NextResponse.json(
        { error: 'Réservation non trouvée', code: 'BOOKING_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Vérifier que l'utilisateur est propriétaire de la réservation
    const userObjectId = new ObjectId(session.user.id)
    const bookingUserId = new ObjectId(booking.userId)
    if (!bookingUserId.equals(userObjectId)) {
      return NextResponse.json(
        { error: 'Accès refusé', code: 'ACCESS_DENIED' },
        { status: 403 }
      )
    }

    // Vérifier que la réservation peut être annulée
    if (!booking.canBeCancelled()) {
      return NextResponse.json(
        {
          error: 'Réservation ne peut pas être annulée',
          code: 'CANCELLATION_NOT_ALLOWED',
        },
        { status: 400 }
      )
    }

    // Calculer le remboursement si applicable
    let refundAmount: number | undefined
    if (booking.paymentStatus === 'paid' && booking.paymentMethod === 'card') {
      // Politique de remboursement : remboursement complet si annulation plus de 24h avant
      const bookingDateTime = new Date(booking.date)
      const [hours, minutes] = booking.startTime.split(':').map(Number)
      bookingDateTime.setHours(hours, minutes, 0, 0)

      const now = new Date()
      const hoursUntilBooking =
        (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)

      if (hoursUntilBooking >= 24) {
        refundAmount = booking.totalPrice
      } else if (hoursUntilBooking >= 2) {
        refundAmount = booking.totalPrice * 0.5 // 50% de remboursement
      }
      // Pas de remboursement si annulation moins de 2h avant
    }

    // Mettre à jour le statut de la réservation
    booking.status = 'cancelled'
    booking.updatedAt = new Date()
    await booking.save()

    // Récupérer les données utilisateur pour l'email
    const [user, space] = await Promise.all([
      User.findById(booking.userId),
      Space.findById(booking.spaceId),
    ])

    // Envoyer l'email d'annulation de manière asynchrone
    if (user && space) {
      setImmediate(async () => {
        try {
          await sendBookingCancellationEmail({
            email: user.email,
            firstName:
              user.firstName || user.name?.split(' ')[0] || 'Utilisateur',
            lastName:
              user.lastName || user.name?.split(' ').slice(1).join(' ') || '',
            bookingId: booking._id.toString(),
            spaceName: space.name,
            date: format(booking.date, 'dd MMMM yyyy', { locale: fr }),
            startTime: booking.startTime,
            endTime: booking.endTime,
            refundAmount,
          })
          console.log(
            `✅ Email d'annulation envoyé pour la réservation ${booking._id}`
          )
        } catch (error) {
          console.error(
            `❌ Erreur envoi email d'annulation pour ${booking._id}:`,
            error
          )
        }
      })
    }

    console.log(
      `[BOOKING_CANCELLED] User ${session.user.id} cancelled booking ${booking._id}`
    )

    return NextResponse.json({
      success: true,
      message: 'Réservation annulée avec succès',
      booking: {
        id: booking._id.toString(),
        status: booking.status,
        refundAmount,
        refundPolicy: refundAmount
          ? 'Remboursement traité sous 3-5 jours ouvrés'
          : 'Aucun remboursement applicable',
      },
    })
  } catch (error) {
    console.error('[DELETE /api/bookings/[id]] Error:', error)
    return NextResponse.json(
      {
        error: "Erreur lors de l'annulation de la réservation",
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
}
