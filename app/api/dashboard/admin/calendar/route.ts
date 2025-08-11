import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectMongoose from '@/lib/mongoose'
import { Booking } from '@/lib/models/booking'

/**
 * GET /api/dashboard/admin/calendar - Récupère les réservations pour le calendrier admin
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Vérifier les permissions admin
    const user = session.user as any
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Accès non autorisé - Admin requis' },
        { status: 403 }
      )
    }

    await connectMongoose()

    // Paramètres de la requête
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start')
    const endDate = searchParams.get('end')
    const spaceId = searchParams.get('spaceId')
    const status = searchParams.get('status')

    // Construire le filtre de dates
    let dateFilter: any = {}
    if (startDate && endDate) {
      dateFilter = {
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    } else if (startDate) {
      dateFilter = {
        date: { $gte: new Date(startDate) }
      }
    } else if (endDate) {
      dateFilter = {
        date: { $lte: new Date(endDate) }
      }
    }

    // Construire le filtre complet
    const filter: any = { ...dateFilter }
    
    if (spaceId && spaceId !== 'all') {
      filter.spaceId = spaceId
    }
    
    if (status && status !== 'all') {
      filter.status = status
    }

    // Récupérer les réservations avec population des données liées
    const bookings = await Booking.find(filter)
      .populate('userId', 'firstName lastName email')
      .populate('spaceId', 'name color capacity')
      .sort({ date: 1, startTime: 1 })
      .lean()

    // Calculer les statistiques
    const stats = {
      totalBookings: bookings.length,
      confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
      pendingBookings: bookings.filter(b => b.status === 'pending').length,
      cancelledBookings: bookings.filter(b => b.status === 'cancelled').length,
      completedBookings: bookings.filter(b => b.status === 'completed').length,
      totalRevenue: bookings
        .filter(b => b.status !== 'cancelled')
        .reduce((sum, b) => sum + (b.totalPrice || 0), 0),
      confirmedRevenue: bookings
        .filter(b => b.status === 'confirmed')
        .reduce((sum, b) => sum + (b.totalPrice || 0), 0)
    }

    // Grouper les réservations par date pour optimiser l'affichage
    const bookingsByDate = bookings.reduce((acc: any, booking: any) => {
      const dateKey = booking.date.toISOString().split('T')[0]
      if (!acc[dateKey]) {
        acc[dateKey] = []
      }
      acc[dateKey].push({
        ...booking,
        date: booking.date.toISOString()
      })
      return acc
    }, {})

    // Liste des espaces pour les filtres
    const spaces = await Booking.distinct('spaceId')
    const populatedSpaces = await Booking.populate(
      spaces.map(id => ({ spaceId: id })),
      { path: 'spaceId', select: 'name' }
    )
    const uniqueSpaces = populatedSpaces
      .map(item => item.spaceId)
      .filter(Boolean)
      .filter((space, index, self) => 
        index === self.findIndex(s => s._id.toString() === space._id.toString())
      )

    return NextResponse.json({
      success: true,
      data: {
        bookings: bookings.map(booking => ({
          ...booking,
          date: booking.date.toISOString()
        })),
        bookingsByDate,
        stats,
        spaces: uniqueSpaces,
        filters: {
          startDate,
          endDate,
          spaceId,
          status
        }
      }
    })

  } catch (error) {
    console.error('Erreur API calendrier admin:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur serveur interne' 
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/dashboard/admin/calendar - Actions sur les réservations depuis le calendrier
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Vérifier les permissions admin
    const user = session.user as any
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Accès non autorisé - Admin requis' },
        { status: 403 }
      )
    }

    await connectMongoose()

    const body = await request.json()
    const { action, bookingId, newStatus, newDate, newStartTime, newEndTime } = body

    if (!action || !bookingId) {
      return NextResponse.json(
        { success: false, error: 'Action et ID de réservation requis' },
        { status: 400 }
      )
    }

    const booking = await Booking.findById(bookingId)
    
    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Réservation non trouvée' },
        { status: 404 }
      )
    }

    switch (action) {
      case 'updateStatus':
        if (!newStatus) {
          return NextResponse.json(
            { success: false, error: 'Nouveau statut requis' },
            { status: 400 }
          )
        }
        
        booking.status = newStatus
        await booking.save()
        
        return NextResponse.json({
          success: true,
          message: `Statut mis à jour vers "${newStatus}"`,
          data: { booking }
        })

      case 'reschedule':
        if (!newDate || !newStartTime || !newEndTime) {
          return NextResponse.json(
            { success: false, error: 'Nouvelle date et horaires requis' },
            { status: 400 }
          )
        }
        
        // Vérifier les conflits avant de reprogrammer
        const conflictingBooking = await Booking.findOne({
          _id: { $ne: bookingId },
          spaceId: booking.spaceId,
          date: new Date(newDate),
          status: { $in: ['pending', 'confirmed'] },
          $or: [
            {
              startTime: { $lt: newEndTime },
              endTime: { $gt: newStartTime }
            }
          ]
        })

        if (conflictingBooking) {
          return NextResponse.json(
            { success: false, error: 'Conflit horaire détecté avec une autre réservation' },
            { status: 409 }
          )
        }

        booking.date = new Date(newDate)
        booking.startTime = newStartTime
        booking.endTime = newEndTime
        await booking.save()
        
        return NextResponse.json({
          success: true,
          message: 'Réservation reprogrammée avec succès',
          data: { booking }
        })

      case 'cancel':
        booking.status = 'cancelled'
        await booking.save()
        
        return NextResponse.json({
          success: true,
          message: 'Réservation annulée',
          data: { booking }
        })

      default:
        return NextResponse.json(
          { success: false, error: 'Action non reconnue' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Erreur POST calendrier admin:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur serveur interne' 
      },
      { status: 500 }
    )
  }
}