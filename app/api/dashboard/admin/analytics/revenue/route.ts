import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectMongoose from '@/lib/mongoose'
import { Booking } from '@/lib/models/booking'
import { Space } from '@/lib/models/space'
import {
  format,
  subDays,
  addDays,
  eachDayOfInterval,
  startOfDay,
  endOfDay,
} from 'date-fns'

/**
 * GET /api/dashboard/admin/analytics/revenue - Analytics revenus détaillées
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
    const startDateParam = searchParams.get('start')
    const endDateParam = searchParams.get('end')
    const period = searchParams.get('period') || '30d'

    // Dates par défaut - inclure les réservations futures
    const today = new Date()
    let startDate: Date
    let endDate: Date

    if (startDateParam && endDateParam) {
      startDate = new Date(startDateParam)
      endDate = new Date(endDateParam)
    } else {
      // Logique pour inclure le passé ET le futur
      switch (period) {
        case '7d':
          startDate = subDays(today, 7)
          endDate = addDays(today, 7) // +7 jours dans le futur
          break
        case '30d':
          startDate = subDays(today, 30)
          endDate = addDays(today, 30) // +30 jours dans le futur
          break
        case '90d':
          startDate = subDays(today, 90)
          endDate = addDays(today, 30) // Futur limité à 30 jours pour 90d
          break
        case '1y':
          startDate = subDays(today, 365)
          endDate = addDays(today, 30) // Futur limité à 30 jours pour 1y
          break
        default:
          startDate = subDays(today, 30)
          endDate = addDays(today, 30)
      }
    }

    // Pipeline d'agrégation pour les statistiques principales
    const bookingStats = await Booking.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $lookup: {
          from: 'spaces',
          localField: 'spaceId',
          foreignField: '_id',
          as: 'space',
        },
      },
      {
        $unwind: {
          path: '$space',
          preserveNullAndEmptyArrays: true, // Keep documents even if no space is found
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: {
              $cond: [{ $ne: ['$status', 'cancelled'] }, '$totalPrice', 0],
            },
          },
          totalBookings: { $sum: 1 },
          confirmedRevenue: {
            $sum: {
              $cond: [{ $eq: ['$status', 'confirmed'] }, '$totalPrice', 0],
            },
          },
          confirmedBookings: {
            $sum: {
              $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0],
            },
          },
          pendingRevenue: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pending'] }, '$totalPrice', 0],
            },
          },
          pendingBookings: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pending'] }, 1, 0],
            },
          },
          completedRevenue: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, '$totalPrice', 0],
            },
          },
          completedBookings: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, 1, 0],
            },
          },
          cancelledBookings: {
            $sum: {
              $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0],
            },
          },
        },
      },
    ])

    const stats = bookingStats[0] || {
      totalRevenue: 0,
      totalBookings: 0,
      confirmedRevenue: 0,
      confirmedBookings: 0,
      pendingRevenue: 0,
      pendingBookings: 0,
      completedRevenue: 0,
      completedBookings: 0,
      cancelledBookings: 0,
    }

    // Calcul du taux de croissance mensuel
    const previousPeriodStart = new Date(
      startDate.getTime() - (endDate.getTime() - startDate.getTime())
    )
    const previousStats = await Booking.aggregate([
      {
        $match: {
          date: { $gte: previousPeriodStart, $lt: startDate },
          status: { $ne: 'cancelled' },
        },
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$totalPrice' },
        },
      },
    ])

    const previousRevenue = previousStats[0]?.revenue || 0
    const monthlyGrowth =
      previousRevenue > 0
        ? ((stats.totalRevenue - previousRevenue) / previousRevenue) * 100
        : 0

    // Revenus par espace
    const spaceRevenue = await Booking.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
          status: { $ne: 'cancelled' },
        },
      },
      {
        $lookup: {
          from: 'spaces',
          localField: 'spaceId',
          foreignField: '_id',
          as: 'space',
        },
      },
      {
        $unwind: {
          path: '$space',
          preserveNullAndEmptyArrays: true, // Keep documents even if no space is found
        },
      },
      {
        $match: {
          space: { $ne: null }, // Only include bookings with valid spaces for space revenue
        },
      },
      {
        $group: {
          _id: '$spaceId',
          spaceName: { $first: '$space.name' },
          revenue: { $sum: '$totalPrice' },
          bookings: { $sum: 1 },
          confirmedBookings: {
            $sum: {
              $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0],
            },
          },
        },
      },
      {
        $addFields: {
          occupancyRate: {
            $multiply: [{ $divide: ['$confirmedBookings', '$bookings'] }, 100],
          },
        },
      },
      {
        $sort: { revenue: -1 },
      },
      {
        $limit: 5,
      },
    ])

    // Ajouter des couleurs aux espaces
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
    const topSpaces = spaceRevenue.map((space, index) => ({
      ...space,
      color: colors[index] || '#6b7280',
    }))

    // Revenus journaliers
    const dailyRevenue = await Booking.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
          status: { $ne: 'cancelled' },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$date',
            },
          },
          revenue: { $sum: '$totalPrice' },
          bookings: { $sum: 1 },
          totalPrice: { $sum: '$totalPrice' },
        },
      },
      {
        $addFields: {
          date: '$_id',
          averagePrice: {
            $cond: [
              { $gt: ['$bookings', 0] },
              { $divide: ['$totalPrice', '$bookings'] },
              0,
            ],
          },
        },
      },
      {
        $sort: { date: 1 },
      },
    ])

    // Compléter les jours manquants avec des valeurs à 0
    const dateRange = eachDayOfInterval({ start: startDate, end: endDate })
    const completeDaily = dateRange.map((date) => {
      const dateStr = format(date, 'yyyy-MM-dd')
      const existing = dailyRevenue.find((d) => d.date === dateStr)

      return {
        date: dateStr,
        revenue: existing?.revenue || 0,
        bookings: existing?.bookings || 0,
        average: existing?.averagePrice || 0,
      }
    })

    // Revenus par statut
    const revenueByStatus = [
      {
        status: 'confirmées',
        revenue: stats.confirmedRevenue,
        count: stats.confirmedBookings,
        color: '#10b981',
      },
      {
        status: 'en attente',
        revenue: stats.pendingRevenue,
        count: stats.pendingBookings,
        color: '#f59e0b',
      },
      {
        status: 'terminées',
        revenue: stats.completedRevenue,
        count: stats.completedBookings,
        color: '#3b82f6',
      },
    ].filter((item) => item.revenue > 0)

    const analytics = {
      totalRevenue: stats.totalRevenue,
      monthlyRevenue: completeDaily, // Données détaillées par jour
      averageBookingValue:
        stats.totalBookings > 0 ? stats.totalRevenue / stats.totalBookings : 0,
      totalBookings: stats.totalBookings,
      monthlyGrowth,
      topSpaces,
      dailyRevenue: completeDaily,
      revenueByStatus,
    }

    return NextResponse.json({
      success: true,
      data: analytics,
    })
  } catch (error) {
    console.error('Erreur API analytics revenus:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Erreur serveur interne',
      },
      { status: 500 }
    )
  }
}
