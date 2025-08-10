import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Space from '@/lib/models/space'
import Booking from '@/lib/models/booking'

/**
 * API pour récupérer les détails d'un espace spécifique
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect()

    const spaceId = params.id

    // Récupérer l'espace par son ID personnalisé
    const space = await Space.findOne({ id: spaceId, available: true }).lean()

    if (!space) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Espace non trouvé ou indisponible' 
        },
        { status: 404 }
      )
    }

    // Récupérer les statistiques de réservation
    const bookingStats = await Booking.aggregate([
      { $match: { spaceName: space.name, status: 'confirmed' } },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          avgRating: { $avg: '$rating' }, // Si vous avez un système de notation
          totalRevenue: { $sum: '$totalPrice' }
        }
      }
    ])

    const stats = bookingStats[0] || { totalBookings: 0, avgRating: space.rating, totalRevenue: 0 }

    // Récupérer les avis récents (si vous avez un système d'avis)
    const recentBookings = await Booking.find({ 
      spaceName: space.name, 
      status: 'confirmed',
      review: { $exists: true } // Si vous stockez les avis dans les réservations
    })
    .populate('user', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean()

    // Formater les données complètes pour les détails
    const spaceDetails = {
      id: space.id,
      name: space.name,
      location: space.location,
      capacity: space.capacity,
      area: 25, // Valeur par défaut, vous pouvez ajouter ce champ au modèle
      pricePerHour: space.pricePerHour,
      pricePerDay: space.pricePerDay,
      pricePerWeek: space.pricePerWeek,
      pricePerMonth: space.pricePerMonth,
      rating: stats.avgRating || space.rating,
      reviewCount: stats.totalBookings,
      description: space.description || '',
      images: [space.image], // Vous pouvez étendre pour plusieurs images
      features: (space.features || []).map(feature => ({
        icon: 'Wifi', // Vous pouvez mapper les icônes selon les features
        name: feature,
        description: feature,
        included: true
      })),
      amenities: space.amenities || [],
      rules: [
        'Pas de nourriture forte odeur',
        'Silence demandé après 18h',
        `Maximum ${space.capacity} personnes simultanément`,
        'Réservation requise',
        'Nettoyage après usage obligatoire'
      ],
      availability: {
        today: true, // Vous pouvez implémenter une logique plus sophistiquée
        nextAvailable: new Date()
      },
      reviews: recentBookings.map(booking => ({
        id: booking._id.toString(),
        user: `${booking.user?.firstName || 'Utilisateur'} ${(booking.user?.lastName || '').charAt(0)}.`,
        rating: booking.rating || 5,
        comment: booking.review || 'Très bel espace !',
        date: booking.createdAt,
        verified: true
      })),
      coordinates: {
        lat: 48.5734, // Coordonnées par défaut, vous pouvez les ajouter au modèle
        lng: 7.7521
      },
      openingHours: space.openingHours,
      specialty: space.specialty,
      isPopular: space.isPopular
    }

    return NextResponse.json({
      success: true,
      data: spaceDetails
    })

  } catch (error: any) {
    console.error('❌ Erreur API Space détails:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la récupération des détails de l\'espace',
        details: error.message 
      },
      { status: 500 }
    )
  }
}