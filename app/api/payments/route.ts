import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { connectMongoose } from '@/lib/mongoose'
import { Booking } from '@/lib/models'
import Stripe from 'stripe'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

// Initialiser Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil'
})

// Schema de validation pour créer un paiement
const createPaymentSchema = z.object({
  bookingId: z.string().min(1, 'ID de réservation requis'),
  paymentMethod: z.enum(['card', 'paypal'], {
    errorMap: () => ({ message: 'Méthode de paiement invalide' })
  }),
  amount: z.number().min(0.5, 'Montant minimum 0.50€'),
  currency: z.string().default('eur')
})

/**
 * POST /api/payments - Créer une session de paiement Stripe
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
    const validationResult = createPaymentSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Données invalides', 
          code: 'VALIDATION_ERROR',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const { bookingId, paymentMethod, amount, currency } = validationResult.data

    // Connexion à la base de données
    await connectMongoose()

    // Vérifier que la réservation existe et appartient à l'utilisateur
    const booking = await Booking.findOne({
      _id: bookingId,
      userId: session.user.id
    })

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

    // Créer une session de checkout Stripe
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: paymentMethod === 'card' ? ['card'] : ['paypal'],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/reservation/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/reservation/cancel`,
      customer_email: session.user.email || undefined,
      metadata: {
        bookingId: bookingId,
        userId: session.user.id
      },
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: `Réservation ${booking.spaceName || 'Espace'}`,
              description: `${format(booking.date, 'dd/MM/yyyy', { locale: fr })} de ${booking.startTime} à ${booking.endTime}`
            },
            unit_amount: Math.round(amount * 100), // Stripe utilise les centimes
          },
          quantity: 1,
        },
      ],
    })

    // Mettre à jour le statut de paiement en "pending"
    booking.paymentStatus = 'pending'
    await booking.save()

    // Retourner les données de la session Stripe
    return NextResponse.json({
      success: true,
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
      paymentMethod,
      amount,
      currency,
      bookingId,
      status: 'pending',
      message: 'Session de paiement Stripe créée avec succès'
    })

  } catch (error) {
    console.error('[POST /api/payments] Error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du paiement', code: 'PAYMENT_ERROR' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/payments - Vérifier le statut d'un paiement Stripe
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentification requise', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id') // Stripe Checkout
    const paymentIntentId = searchParams.get('payment_intent') // Stripe Elements
    const bookingId = searchParams.get('booking_id')
    
    console.log('🔍 [GET /api/payments] Paramètres reçus:', { sessionId, paymentIntentId, bookingId })
    
    // Connexion à la base de données
    await connectMongoose()

    if (paymentIntentId) {
      // Nouveau système Stripe Elements : vérifier avec payment_intent
      console.log('🎯 Vérification PaymentIntent:', paymentIntentId)
      
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
      
      if (!paymentIntent) {
        return NextResponse.json(
          { error: 'Payment Intent non trouvé', code: 'PAYMENT_INTENT_NOT_FOUND' },
          { status: 404 }
        )
      }

      // Récupérer et mettre à jour la réservation
      let booking = null
      if (bookingId) {
        booking = await Booking.findById(bookingId)
        if (booking && paymentIntent.status === 'succeeded') {
          // Mettre à jour le statut de paiement si nécessaire
          if (booking.paymentStatus !== 'paid') {
            booking.paymentStatus = 'paid'
            booking.status = 'confirmed'
            await booking.save()
            console.log('✅ Réservation mise à jour:', booking._id, '- statut:', booking.paymentStatus)
          }
        }
      }

      return NextResponse.json({
        success: true,
        sessionId: `pi_${paymentIntentId}`, // Compatibilité d'affichage
        paymentStatus: paymentIntent.status === 'succeeded' ? 'paid' : paymentIntent.status,
        paymentIntent: paymentIntent.id,
        customerEmail: session.user.email || 'Non disponible',
        amountTotal: paymentIntent.amount,
        currency: paymentIntent.currency,
        bookingId: bookingId,
        status: paymentIntent.status
      })
    } 
    else if (sessionId) {
      // Ancien système Stripe Checkout : vérifier avec session_id
      console.log('🔄 Vérification Session Checkout:', sessionId)
      
      const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId)
      
      if (!checkoutSession) {
        return NextResponse.json(
          { error: 'Session non trouvée', code: 'SESSION_NOT_FOUND' },
          { status: 404 }
        )
      }

      // Récupérer la réservation associée
      const bookingIdFromSession = checkoutSession.metadata?.bookingId
      if (bookingIdFromSession) {
        const booking = await Booking.findById(bookingIdFromSession)
        if (booking && checkoutSession.payment_status === 'paid') {
          // Mettre à jour le statut de paiement si nécessaire
          if (booking.paymentStatus !== 'paid') {
            booking.paymentStatus = 'paid'
            booking.status = 'confirmed'
            await booking.save()
          }
        }
      }

      return NextResponse.json({
        success: true,
        sessionId: checkoutSession.id,
        paymentStatus: checkoutSession.payment_status,
        paymentIntent: checkoutSession.payment_intent,
        customerEmail: checkoutSession.customer_email,
        amountTotal: checkoutSession.amount_total,
        currency: checkoutSession.currency,
        bookingId: checkoutSession.metadata?.bookingId,
        status: checkoutSession.status
      })
    }
    else {
      return NextResponse.json(
        { error: 'ID de session ou payment intent requis', code: 'MISSING_PAYMENT_IDENTIFIER' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('[GET /api/payments] Error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la vérification du paiement', code: 'PAYMENT_CHECK_ERROR' },
      { status: 500 }
    )
  }
}