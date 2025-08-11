import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectMongoose from '@/lib/mongoose'
import { Booking } from '@/lib/models/booking'
import { subDays, addDays } from 'date-fns'

/**
 * GET /api/debug/bookings - Debug des données de réservation
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

    // Dates des 30 derniers jours (mais incluons aussi le futur comme l'API analytics)
    const today = new Date()
    const startDate = subDays(today, 30)
    const endDate = addDays(today, 30) // Inclure le futur

    console.log('🔍 DEBUG DATES:')
    console.log('  Today:', today.toISOString())
    console.log('  Start (-30d):', startDate.toISOString())
    console.log('  End (+30d):', endDate.toISOString())

    // Récupérer TOUTES les réservations (sans filtre de date d'abord)
    const allBookingsEver = await Booking.find({})
    .populate('userId', 'firstName lastName email')
    .populate('spaceId', 'name')
    .lean()

    console.log('🔍 DEBUG TOUTES RÉSERVATIONS:')
    allBookingsEver.forEach((booking: any, index) => {
      console.log(`  ${index + 1}. Date: ${new Date(booking.date).toISOString()} | Status: ${booking.status} | Prix: €${booking.totalPrice}`)
    })

    // Récupérer les réservations dans la période (même logique que analytics)
    const allBookings = await Booking.find({
      date: { $gte: startDate, $lte: endDate }
    })
    .populate('userId', 'firstName lastName email')
    .populate('spaceId', 'name')
    .lean()

    console.log('🔍 DEBUG RÉSERVATIONS DANS PÉRIODE:')
    allBookings.forEach((booking: any, index) => {
      console.log(`  ${index + 1}. Date: ${new Date(booking.date).toISOString()} | Status: ${booking.status} | Prix: €${booking.totalPrice}`)
    })

    // Statistiques par statut
    const statsByStatus = allBookings.reduce((acc: any, booking: any) => {
      const status = booking.status || 'unknown'
      if (!acc[status]) {
        acc[status] = {
          count: 0,
          totalPrice: 0,
          dates: []
        }
      }
      acc[status].count++
      acc[status].totalPrice += booking.totalPrice || 0
      acc[status].dates.push(booking.date)
      return acc
    }, {})

    // Réservations les plus récentes
    const recentBookings = allBookings
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map((booking: any) => ({
        _id: booking._id,
        status: booking.status,
        date: booking.date,
        totalPrice: booking.totalPrice,
        user: booking.userId ? `${booking.userId.firstName} ${booking.userId.lastName}` : 'Utilisateur supprimé',
        space: booking.spaceId?.name || 'Espace supprimé',
        createdAt: booking.createdAt
      }))

    // Toutes les réservations avec leurs dates
    const allBookingsDates = allBookingsEver.map((booking: any) => ({
      _id: booking._id,
      date: booking.date,
      status: booking.status,
      totalPrice: booking.totalPrice,
      createdAt: booking.createdAt
    }))

    const debug = {
      period: `${startDate.toISOString().split('T')[0]} à ${endDate.toISOString().split('T')[0]}`,
      totalBookingsInPeriod: allBookings.length,
      totalBookingsEver: allBookingsEver.length,
      allBookingsDates,
      statsByStatus,
      recentBookings,
      dateRange: {
        start: startDate,
        end: endDate
      }
    }

    return NextResponse.json({
      success: true,
      debug
    })

  } catch (error) {
    console.error('Erreur API debug bookings:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur serveur interne' 
      },
      { status: 500 }
    )
  }
}