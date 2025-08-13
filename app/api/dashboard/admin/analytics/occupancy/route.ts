import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectMongoose from '@/lib/mongoose'
import { Booking } from '@/lib/models/booking'
import { Space } from '@/lib/models/space'
import {
  subDays,
  format,
  eachWeekOfInterval,
  startOfWeek,
  endOfWeek,
  eachHourOfInterval,
  setHours,
  startOfDay,
} from 'date-fns'

/**
 * GET /api/dashboard/admin/analytics/occupancy - Analytics d'occupation des espaces
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
    const spaceFilter = searchParams.get('space') || 'all'

    // Dates par défaut
    const endDate = endDateParam ? new Date(endDateParam) : new Date()
    let startDate: Date

    if (startDateParam) {
      startDate = new Date(startDateParam)
    } else {
      switch (period) {
        case '7d':
          startDate = subDays(endDate, 7)
          break
        case '30d':
          startDate = subDays(endDate, 30)
          break
        case '90d':
          startDate = subDays(endDate, 90)
          break
        default:
          startDate = subDays(endDate, 30)
      }
    }

    // Récupérer tous les espaces
    const allSpaces = await Space.find({}).lean()
    const spaceMap = new Map(
      allSpaces.map((space: any) => [space._id.toString(), space])
    )

    // Filtre d'espace
    const spaceFilterQuery =
      spaceFilter !== 'all' ? { spaceId: spaceFilter } : {}

    // Analytics par espace
    const spaceAnalytics = await Booking.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
          status: { $in: ['confirmed', 'completed'] },
          ...spaceFilterQuery,
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
        $unwind: '$space',
      },
      {
        $addFields: {
          // Calculer la durée en heures
          durationHours: {
            $divide: [
              {
                $subtract: [
                  {
                    $dateFromString: {
                      dateString: {
                        $concat: [
                          {
                            $dateToString: {
                              format: '%Y-%m-%d',
                              date: '$date',
                            },
                          },
                          'T',
                          '$endTime',
                          ':00',
                        ],
                      },
                    },
                  },
                  {
                    $dateFromString: {
                      dateString: {
                        $concat: [
                          {
                            $dateToString: {
                              format: '%Y-%m-%d',
                              date: '$date',
                            },
                          },
                          'T',
                          '$startTime',
                          ':00',
                        ],
                      },
                    },
                  },
                ],
              },
              3600000, // millisecondes vers heures
            ],
          },
        },
      },
      {
        $group: {
          _id: '$spaceId',
          spaceName: { $first: '$space.name' },
          capacity: { $first: '$space.capacity' },
          totalBookings: { $sum: 1 },
          totalHours: { $sum: '$durationHours' },
          totalGuests: { $sum: '$guests' },
          avgDuration: { $avg: '$durationHours' },
          bookingHours: {
            $push: {
              $hour: {
                $dateFromString: {
                  dateString: {
                    $concat: [
                      { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                      'T',
                      '$startTime',
                      ':00',
                    ],
                  },
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          avgGuests: { $divide: ['$totalGuests', '$totalBookings'] },
          // Calculer le taux d'occupation basé sur les heures disponibles
          occupancyRate: {
            $multiply: [
              {
                $divide: [
                  '$totalHours',
                  {
                    $multiply: [
                      // Heures d'ouverture par jour (supposons 12h: 8h-20h)
                      12,
                      // Nombre de jours dans la période
                      {
                        $divide: [
                          { $subtract: [endDate, startDate] },
                          86400000,
                        ],
                      },
                    ],
                  },
                ],
              },
              100,
            ],
          },
        },
      },
      {
        $sort: { occupancyRate: -1 },
      },
    ])

    // Ajouter couleurs et traiter les heures de pointe
    const colors = [
      '#3b82f6',
      '#10b981',
      '#f59e0b',
      '#ef4444',
      '#8b5cf6',
      '#06b6d4',
      '#84cc16',
    ]
    const processedSpaces = spaceAnalytics.map((space, index) => {
      // Analyser les heures de pointe
      const hourCounts = space.bookingHours.reduce((acc: any, hour: number) => {
        acc[hour] = (acc[hour] || 0) + 1
        return acc
      }, {})

      const sortedHours = Object.entries(hourCounts)
        .sort(([, a]: any, [, b]: any) => b - a)
        .slice(0, 3)
        .map(([hour]: any) => `${hour}h`)

      return {
        spaceId: space._id.toString(),
        spaceName: space.spaceName,
        capacity: space.capacity || 4,
        totalBookings: space.totalBookings,
        totalHours: space.totalHours || 0,
        occupancyRate: Math.min(space.occupancyRate || 0, 100),
        avgDuration: space.avgDuration || 0,
        peakHours: sortedHours,
        weeklyTrend: [], // À implémenter si nécessaire
        color: colors[index] || '#6b7280',
      }
    })

    // Usage par créneaux horaires
    const hourlyUsage = await Booking.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
          status: { $in: ['confirmed', 'completed'] },
          ...spaceFilterQuery,
        },
      },
      {
        $addFields: {
          startHour: {
            $hour: {
              $dateFromString: {
                dateString: {
                  $concat: [
                    { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                    'T',
                    '$startTime',
                    ':00',
                  ],
                },
              },
            },
          },
        },
      },
      {
        $group: {
          _id: '$startHour',
          totalBookings: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ])

    // Compléter toutes les heures (8h à 20h)
    const completeHourlyUsage = []
    for (let hour = 8; hour <= 20; hour++) {
      const existing = hourlyUsage.find((h) => h._id === hour)
      completeHourlyUsage.push({
        hour: `${hour}h`,
        totalBookings: existing?.totalBookings || 0,
        occupancyRate: 0, // Peut être calculé si nécessaire
        spaces: [], // Détail par espace si nécessaire
      })
    }

    // Comparaison hebdomadaire
    const weeks = eachWeekOfInterval(
      { start: startDate, end: endDate },
      { weekStartsOn: 1 }
    )

    const weeklyComparison = await Promise.all(
      weeks.map(async (weekStart) => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })

        const weekStats = await Booking.aggregate([
          {
            $match: {
              date: { $gte: weekStart, $lte: weekEnd },
              status: { $in: ['confirmed', 'completed'] },
              ...spaceFilterQuery,
            },
          },
          {
            $group: {
              _id: null,
              totalBookings: { $sum: 1 },
              totalHours: {
                $sum: {
                  $divide: [
                    {
                      $subtract: [
                        {
                          $dateFromString: {
                            dateString: {
                              $concat: [
                                {
                                  $dateToString: {
                                    format: '%Y-%m-%d',
                                    date: '$date',
                                  },
                                },
                                'T',
                                '$endTime',
                                ':00',
                              ],
                            },
                          },
                        },
                        {
                          $dateFromString: {
                            dateString: {
                              $concat: [
                                {
                                  $dateToString: {
                                    format: '%Y-%m-%d',
                                    date: '$date',
                                  },
                                },
                                'T',
                                '$startTime',
                                ':00',
                              ],
                            },
                          },
                        },
                      ],
                    },
                    3600000,
                  ],
                },
              },
            },
          },
        ])

        const stats = weekStats[0] || { totalBookings: 0, totalHours: 0 }

        return {
          week: format(weekStart, 'dd/MM'),
          bookings: stats.totalBookings,
          occupancyRate: Math.min(
            (stats.totalHours / (7 * 12 * allSpaces.length)) * 100 || 0,
            100
          ),
        }
      })
    )

    // Utilisation de la capacité
    const capacityUtilization = processedSpaces.map((space, index) => ({
      spaceName: space.spaceName,
      capacity: space.capacity,
      avgGuests: spaceAnalytics[index]?.avgGuests || 0,
      utilizationRate: spaceAnalytics[index]?.avgGuests
        ? Math.min(
            (spaceAnalytics[index].avgGuests / space.capacity) * 100,
            100
          )
        : 0,
      color: space.color,
    }))

    // Calculs des KPIs généraux
    const averageOccupancyRate =
      processedSpaces.length > 0
        ? processedSpaces.reduce((acc, space) => acc + space.occupancyRate, 0) /
          processedSpaces.length
        : 0

    const totalCapacityHours =
      allSpaces.length *
      12 *
      Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      )
    const totalBookedHours = processedSpaces.reduce(
      (acc, space) => acc + space.totalHours,
      0
    )

    const mostPopularSpace =
      processedSpaces.length > 0 ? processedSpaces[0].spaceName : null

    // Trouver l'heure de pointe
    const peakHourData = completeHourlyUsage.reduce(
      (max, current) =>
        current.totalBookings > max.totalBookings ? current : max,
      { hour: 'N/A', totalBookings: 0 }
    )

    const analytics = {
      averageOccupancyRate,
      totalCapacityHours,
      totalBookedHours,
      mostPopularSpace,
      peakTime: peakHourData.hour,
      spaces: processedSpaces,
      hourlyUsage: completeHourlyUsage,
      weeklyComparison,
      capacityUtilization,
    }

    return NextResponse.json({
      success: true,
      data: analytics,
    })
  } catch (error) {
    console.error('Erreur API analytics occupation:', error)
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
