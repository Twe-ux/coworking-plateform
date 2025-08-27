import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { UserRole } from '@/types/auth'
import { getCached, setCache } from '@/lib/cache'
import dbConnect from '@/lib/mongodb'
import Space from '@/lib/models/space'
import Booking from '@/lib/models/booking'

/**
 * API pour la gestion des espaces par l'admin
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

    // Vérifier le cache d'abord (5 minutes de cache pour les espaces admin)
    const cacheKey = `admin-spaces`
    const cached = getCached(cacheKey, 5 * 60 * 1000) // 5 minutes
    if (cached) {
      console.log('💾 Espaces admin depuis le cache')
      return NextResponse.json(cached)
    }

    await dbConnect()

    // Récupérer tous les espaces
    const spaces = await Space.find().sort({ createdAt: -1 }).lean()

    // OPTIMISATION: Récupérer toutes les stats en une seule requête agrégée
    const bookingStats = await Booking.aggregate([
      {
        $match: {
          status: 'confirmed'
        }
      },
      {
        $group: {
          _id: '$spaceName',
          bookingsCount: { $sum: 1 },
          totalRevenue: { $sum: '$totalPrice' },
          lastBookingDate: { $max: '$date' }
        }
      }
    ])

    // Créer une map pour un accès O(1)
    const statsMap = new Map(
      bookingStats.map(stat => [stat._id, stat])
    )

    // Mapper les espaces avec leurs stats (évite N requêtes)
    const spacesWithStats = spaces.map((space: any) => {
      const stats = statsMap.get(space.name) || {
        bookingsCount: 0,
        totalRevenue: 0,
        lastBookingDate: null
      }

      return {
        _id: space._id?.toString() || space.id,
        id: space.id,
        name: space.name,
        description: space.description || '',
        location: space.location,
        capacity: space.capacity,
        pricePerHour: space.pricePerHour,
        pricePerDay: space.pricePerDay,
        pricePerWeek: space.pricePerWeek,
        pricePerMonth: space.pricePerMonth,
        features: space.features || [],
        amenities: space.amenities || [],
        image: space.image,
        available: space.available,
        rating: space.rating,
        specialty: space.specialty,
        isPopular: space.isPopular,
        openingHours: space.openingHours,
        bookingsCount: stats.bookingsCount,
        totalRevenue: Math.round(stats.totalRevenue),
        lastBooking: stats.lastBookingDate
          ? new Date(stats.lastBookingDate).toLocaleDateString('fr-FR')
          : null,
        createdAt: space.createdAt,
        updatedAt: space.updatedAt,
      }
    })

    const result = {
      success: true,
      data: spacesWithStats,
      count: spacesWithStats.length,
      timestamp: new Date().toISOString(),
    }

    // Mettre en cache la réponse
    setCache(cacheKey, result)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('❌ Erreur API Spaces Admin:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la récupération des espaces',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * Créer un nouvel espace
 */
export async function POST(request: NextRequest) {
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

    const spaceData = await request.json()

    // Validation des champs requis
    const requiredFields = [
      'id',
      'name',
      'location',
      'capacity',
      'pricePerHour',
      'pricePerDay',
      'specialty',
      'image',
    ]
    for (const field of requiredFields) {
      if (!spaceData[field]) {
        return NextResponse.json(
          { error: `Le champ ${field} est requis` },
          { status: 400 }
        )
      }
    }

    await dbConnect()

    // Vérifier que l'ID n'existe pas déjà
    const existingSpace = await Space.findOne({ id: spaceData.id })
    if (existingSpace) {
      return NextResponse.json(
        { error: 'Un espace avec cet ID existe déjà' },
        { status: 400 }
      )
    }

    // Créer le nouvel espace
    const newSpace = new Space({
      ...spaceData,
      pricePerWeek: spaceData.pricePerWeek || spaceData.pricePerDay * 6, // Discount sur semaine
      pricePerMonth: spaceData.pricePerMonth || spaceData.pricePerDay * 25, // Discount sur mois
      available: spaceData.available !== false, // Par défaut true
      rating: spaceData.rating || 4.5,
      isPopular: spaceData.isPopular || false,
      features: spaceData.features || [],
      amenities: spaceData.amenities || [],
    })

    await newSpace.save()

    return NextResponse.json({
      success: true,
      message: 'Espace créé avec succès',
      data: {
        _id: newSpace._id,
        id: newSpace.id,
        name: newSpace.name,
      },
    })
  } catch (error: any) {
    console.error('❌ Erreur création espace:', error)

    // Gestion des erreurs de validation MongoDB
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(
        (err: any) => err.message
      )
      return NextResponse.json(
        {
          success: false,
          error: 'Erreur de validation',
          details: messages,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la création de l'espace",
        details: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * Mettre à jour un espace
 */
export async function PUT(request: NextRequest) {
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

    const { spaceId, ...updateData } = await request.json()

    if (!spaceId) {
      return NextResponse.json({ error: 'spaceId est requis' }, { status: 400 })
    }

    await dbConnect()

    // Vérifier que l'espace existe
    const existingSpace = await Space.findById(spaceId)
    if (!existingSpace) {
      return NextResponse.json({ error: 'Espace non trouvé' }, { status: 404 })
    }

    // Si l'ID personnalisé change, vérifier qu'il n'existe pas déjà
    if (updateData.id && updateData.id !== existingSpace.id) {
      const duplicateSpace = await Space.findOne({ id: updateData.id })
      if (duplicateSpace) {
        return NextResponse.json(
          { error: 'Un espace avec cet ID existe déjà' },
          { status: 400 }
        )
      }
    }

    // Mettre à jour l'espace
    const updatedSpace = await Space.findByIdAndUpdate(
      spaceId,
      {
        ...updateData,
        updatedAt: new Date(),
      },
      {
        new: true,
        runValidators: true,
      }
    )

    return NextResponse.json({
      success: true,
      message: 'Espace mis à jour avec succès',
      data: {
        _id: updatedSpace._id,
        id: updatedSpace.id,
        name: updatedSpace.name,
      },
    })
  } catch (error: any) {
    console.error('❌ Erreur mise à jour espace:', error)

    // Gestion des erreurs de validation MongoDB
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(
        (err: any) => err.message
      )
      return NextResponse.json(
        {
          success: false,
          error: 'Erreur de validation',
          details: messages,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la mise à jour de l'espace",
        details: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * Supprimer un espace
 */
export async function DELETE(request: NextRequest) {
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

    const { spaceId } = await request.json()

    if (!spaceId) {
      return NextResponse.json({ error: 'spaceId est requis' }, { status: 400 })
    }

    await dbConnect()

    // Vérifier que l'espace existe
    const existingSpace = await Space.findById(spaceId)
    if (!existingSpace) {
      return NextResponse.json({ error: 'Espace non trouvé' }, { status: 404 })
    }

    // Vérifier s'il y a des réservations actives
    const activeBookings = await Booking.countDocuments({
      spaceName: existingSpace.name,
      status: { $in: ['pending', 'confirmed'] },
      date: { $gte: new Date() },
    })

    if (activeBookings > 0) {
      return NextResponse.json(
        {
          error:
            'Impossible de supprimer cet espace car il a des réservations actives',
          activeBookings,
        },
        { status: 400 }
      )
    }

    // Supprimer l'espace
    await Space.findByIdAndDelete(spaceId)

    return NextResponse.json({
      success: true,
      message: 'Espace supprimé avec succès',
    })
  } catch (error: any) {
    console.error('❌ Erreur suppression espace:', error)
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la suppression de l'espace",
        details: error.message,
      },
      { status: 500 }
    )
  }
}
