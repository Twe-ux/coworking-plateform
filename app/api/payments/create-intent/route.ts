import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { connectMongoose } from '@/lib/mongoose'
import { Booking } from '@/lib/models'
import Stripe from 'stripe'

// Initialiser Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
})

// Schema de validation
const createIntentSchema = z.object({
  amount: z.number().min(50, 'Montant minimum 0.50€'), // en centimes
  bookingId: z.string().min(1, 'ID de réservation requis'),
  currency: z.string().default('eur'),
})

/**
 * POST /api/payments/create-intent - Créer un PaymentIntent pour Stripe Elements
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentification requise', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // Valider les données
    const body = await request.json()
    const validationResult = createIntentSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Données invalides',
          code: 'VALIDATION_ERROR',
          details: validationResult.error.errors,
        },
        { status: 400 }
      )
    }

    const { amount, bookingId, currency } = validationResult.data

    // Connexion à la base de données
    await connectMongoose()

    // Vérifier que la réservation existe et appartient à l'utilisateur
    const booking = await Booking.findOne({
      _id: bookingId,
      userId: session.user.id,
    }).populate('spaceId')

    if (!booking) {
      return NextResponse.json(
        { error: 'Réservation non trouvée', code: 'BOOKING_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Vérifier que la réservation n'est pas déjà payée
    if (booking.paymentStatus === 'paid') {
      return NextResponse.json(
        { error: 'Réservation déjà payée', code: 'ALREADY_PAID' },
        { status: 400 }
      )
    }

    // Créer un PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
      metadata: {
        bookingId: bookingId,
        userId: session.user.id,
      },
      description: `Réservation ${(booking.spaceId as any)?.name || 'Espace'} - ${(booking as any).formattedDate}`,
      receipt_email: session.user.email || undefined,
    })

    // Mettre à jour le statut de paiement
    booking.paymentStatus = 'pending'
    booking.stripePaymentIntentId = paymentIntent.id
    await booking.save()

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      bookingId,
      amount: amount / 100, // convertir en euros
      currency,
      status: 'pending',
      message: 'PaymentIntent créé avec succès',
    })
  } catch (error) {
    console.error('[POST /api/payments/create-intent] Error:', error)
    return NextResponse.json(
      {
        error: 'Erreur lors de la création du PaymentIntent',
        code: 'PAYMENT_INTENT_ERROR',
      },
      { status: 500 }
    )
  }
}
