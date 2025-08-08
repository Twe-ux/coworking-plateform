import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { ObjectId } from 'mongodb'
import { authOptions } from '@/lib/auth'
import { connectMongoose } from '@/lib/mongoose'
import { 
  User,
  Booking, 
  Space,
  type IBooking,
  type CreateBookingData,
  checkBookingConflicts,
  validateBookingData,
  calculateBookingPrice
} from '@/lib/models'

// Schema de validation pour la création de réservation
const createBookingSchema = z.object({
  spaceId: z.string().min(1, 'L\'ID de l\'espace est requis'),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Date invalide'),
  startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format d\'heure invalide (HH:mm)'),
  endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format d\'heure invalide (HH:mm)'),
  duration: z.number().min(1, 'La durée doit être d\'au moins 1'),
  durationType: z.enum(['hour', 'day', 'week', 'month'], {
    errorMap: () => ({ message: 'Type de durée invalide' })
  }),
  guests: z.number().min(1, 'Au moins 1 invité requis').max(20, 'Maximum 20 invités'),
  paymentMethod: z.enum(['onsite', 'card', 'paypal'], {
    errorMap: () => ({ message: 'Méthode de paiement invalide' })
  }),
  notes: z.string().max(500, 'Notes trop longues (max 500 caractères)').optional()
})

// Schema pour les query parameters de GET
const getBookingsQuerySchema = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']).optional(),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Date invalide').optional(),
  spaceId: z.string().optional(),
  limit: z.string().transform(val => parseInt(val) || 10).refine(val => val <= 100, 'Limite trop élevée').optional(),
  offset: z.string().transform(val => parseInt(val) || 0).refine(val => val >= 0, 'Offset invalide').optional()
})

/**
 * POST /api/bookings - Créer une nouvelle réservation
 */
export async function POST(request: NextRequest) {
  console.log('🔍 POST /api/bookings - Requête reçue')
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentification requise', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // Parser et valider les données de la requête
    const body = await request.json()
    const validationResult = createBookingSchema.safeParse(body)
    
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

    const data = validationResult.data
    console.log('✅ Données validées côté API:', data)

    // Connexion à la base de données
    await connectMongoose()
    console.log('✅ Mongoose connecté')

    // Vérifier que l'espace existe et est disponible
    const space = await Space.findOne({
      $or: [
        { _id: ObjectId.isValid(data.spaceId) ? new ObjectId(data.spaceId) : null },
        { id: data.spaceId }
      ]
    })

    if (!space) {
      return NextResponse.json(
        { error: 'Espace non trouvé', code: 'SPACE_NOT_FOUND' },
        { status: 404 }
      )
    }

    if (!space.available) {
      return NextResponse.json(
        { error: 'Espace indisponible', code: 'SPACE_UNAVAILABLE' },
        { status: 400 }
      )
    }

    // Convertir la date string en Date object
    const bookingDate = new Date(data.date)

    // Validation complète des données de réservation
    const validation = await validateBookingData({
      spaceId: space._id,
      date: bookingDate,
      startTime: data.startTime,
      endTime: data.endTime,
      guests: data.guests,
      durationType: data.durationType
    })

    if (!validation.isValid) {
      console.log('❌ API Booking - Validation échouée:', {
        errors: validation.errors,
        receivedData: {
          spaceId: space._id,
          date: bookingDate,
          startTime: data.startTime,
          endTime: data.endTime,
          guests: data.guests,
          durationType: data.durationType
        }
      })
      return NextResponse.json(
        { 
          error: 'Données de réservation invalides', 
          code: 'BOOKING_VALIDATION_ERROR',
          details: validation.errors
        },
        { status: 400 }
      )
    }

    // Vérifier les conflits de réservation
    const conflicts = await checkBookingConflicts(
      space._id,
      bookingDate,
      data.startTime,
      data.endTime
    )

    if (conflicts.length > 0) {
      return NextResponse.json(
        { 
          error: 'Créneau déjà réservé', 
          code: 'TIME_SLOT_CONFLICT',
          details: conflicts.map(c => c.reason)
        },
        { status: 409 }
      )
    }

    // Calculer le prix total
    const totalPrice = calculateBookingPrice(space, data.duration, data.durationType)

    // Créer les données de réservation
    const bookingData: CreateBookingData = {
      userId: session.user.id,
      spaceId: space._id.toString(),
      date: bookingDate,
      startTime: data.startTime,
      endTime: data.endTime,
      duration: data.duration,
      durationType: data.durationType,
      guests: data.guests,
      totalPrice,
      paymentMethod: data.paymentMethod,
      notes: data.notes
    }

    // Gérer le paiement selon la méthode choisie
    if (data.paymentMethod === 'onsite') {
      // Paiement sur place : créer directement la réservation
      const booking = new Booking({
        ...bookingData,
        userId: new ObjectId(session.user.id),
        spaceId: space._id,
        status: 'pending' // Sera confirmée lors du paiement sur place
      })

      await booking.save()

      // Populer les données pour la réponse
      await booking.populate([
        { path: 'spaceId', select: 'id name location capacity specialty image' }
      ])

      console.log(`[BOOKING_CREATED] User ${session.user.id} created onsite booking ${booking._id} for space ${space.id}`)

      return NextResponse.json(
        { 
          message: 'Réservation créée avec succès',
          booking: {
            id: booking._id.toString(),
            userId: booking.userId.toString(),
            spaceId: booking.spaceId,
            date: booking.date.toISOString(),
            startTime: booking.startTime,
            endTime: booking.endTime,
            duration: booking.duration,
            durationType: booking.durationType,
            guests: booking.guests,
            totalPrice: booking.totalPrice,
            status: booking.status,
            paymentStatus: booking.paymentStatus,
            notes: booking.notes,
            createdAt: booking.createdAt.toISOString(),
            updatedAt: booking.updatedAt.toISOString()
          }
        },
        { status: 201 }
      )
    } else {
      // Paiement Stripe (card ou paypal) : créer une session Stripe
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
      
      // Créer d'abord la réservation avec status 'payment_pending'
      const booking = new Booking({
        ...bookingData,
        userId: new ObjectId(session.user.id),
        spaceId: space._id,
        status: 'payment_pending', // En attente du paiement Stripe
        paymentStatus: 'pending'
      })

      await booking.save()

      // Créer la session Stripe
      const stripeSession = await stripe.checkout.sessions.create({
        payment_method_types: data.paymentMethod === 'card' ? ['card'] : ['paypal'],
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: `Réservation - ${space.name}`,
                description: `${data.duration} ${data.durationType}(s) le ${data.date} de ${data.startTime} à ${data.endTime}`,
              },
              unit_amount: Math.round(totalPrice * 100), // Stripe utilise les centimes
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}&booking_id=${booking._id}`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/cancel?booking_id=${booking._id}`,
        metadata: {
          bookingId: booking._id.toString(),
          userId: session.user.id,
          spaceId: space.id,
        },
      })

      console.log(`[STRIPE_SESSION_CREATED] User ${session.user.id} created payment session for booking ${booking._id}`)

      return NextResponse.json(
        { 
          message: 'Session de paiement créée',
          paymentUrl: stripeSession.url,
          bookingId: booking._id.toString(),
          sessionId: stripeSession.id
        },
        { status: 201 }
      )
    }

  } catch (error) {
    console.error('[POST /api/bookings] Error:', error)
    
    // Gestion des erreurs spécifiques de MongoDB
    if (error instanceof Error) {
      if (error.message.includes('validation')) {
        return NextResponse.json(
          { error: 'Erreur de validation des données', code: 'VALIDATION_ERROR' },
          { status: 400 }
        )
      }
      if (error.message.includes('duplicate key')) {
        return NextResponse.json(
          { error: 'Conflit de données', code: 'DUPLICATE_ERROR' },
          { status: 409 }
        )
      }
      
      // En développement, retourner plus de détails
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json(
          { 
            error: error.message || 'Erreur interne du serveur', 
            code: 'INTERNAL_ERROR',
            debug: error.stack
          },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Erreur interne du serveur', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/bookings - Liste des réservations de l'utilisateur connecté
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentification requise', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // Parser les query parameters
    const { searchParams } = new URL(request.url)
    const queryValidation = getBookingsQuerySchema.safeParse({
      status: searchParams.get('status'),
      date: searchParams.get('date'),
      spaceId: searchParams.get('spaceId'),
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset')
    })

    if (!queryValidation.success) {
      return NextResponse.json(
        { 
          error: 'Paramètres de requête invalides', 
          code: 'QUERY_VALIDATION_ERROR',
          details: queryValidation.error.errors
        },
        { status: 400 }
      )
    }

    const { status, date, spaceId, limit = 10, offset = 0 } = queryValidation.data

    // Connexion à la base de données
    await connectMongoose()

    // Construire la requête
    const query: any = { userId: new ObjectId(session.user.id) }

    if (status) {
      query.status = status
    }

    if (date) {
      const targetDate = new Date(date)
      query.date = {
        $gte: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()),
        $lt: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1)
      }
    }

    if (spaceId) {
      // Recherche par ObjectId ou par string ID
      if (ObjectId.isValid(spaceId)) {
        query.spaceId = new ObjectId(spaceId)
      } else {
        // Trouver l'espace par son ID string pour obtenir l'ObjectId
        const space = await Space.findOne({ id: spaceId })
        if (space) {
          query.spaceId = space._id
        } else {
          // Si l'espace n'existe pas, retourner un tableau vide
          return NextResponse.json({
            bookings: [],
            pagination: { total: 0, limit, offset, hasMore: false }
          })
        }
      }
    }

    // Compter le total pour la pagination
    const total = await Booking.countDocuments(query)

    // Récupérer les réservations avec pagination
    const bookings = await Booking.find(query)
      .populate('spaceId', 'id name location capacity specialty image features rating')
      .sort({ date: -1, startTime: -1 }) // Trier par date décroissante puis heure
      .skip(offset)
      .limit(limit)
      .lean() // Optimisation pour la lecture seule

    // Formater les données pour la réponse
    const formattedBookings = bookings.map((booking: any) => ({
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
      // Propriétés calculées
      canBeCancelled: booking.status === 'pending' || booking.status === 'confirmed',
      canBeModified: booking.status === 'pending'
    }))

    return NextResponse.json({
      bookings: formattedBookings,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })

  } catch (error) {
    console.error('[GET /api/bookings] Error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des réservations', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}