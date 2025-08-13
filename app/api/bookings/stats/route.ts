import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectMongoose } from '@/lib/mongoose'
import { Booking, Space } from '@/lib/models'
import { ObjectId } from 'mongodb'

/**
 * GET /api/bookings/stats - Statistiques utilisateur
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

    // Connexion à la base de données
    await connectMongoose()

    const userId = new ObjectId(session.user.id)
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    // Statistiques de base
    const [
      totalBookings,
      activeBookings,
      completedBookings,
      cancelledBookings,
      pendingBookings,
      thisMonthBookings,
      lastMonthBookings,
      thisYearBookings,
    ] = await Promise.all([
      // Total des réservations
      Booking.countDocuments({ userId }),

      // Réservations actives (confirmées et futures)
      Booking.countDocuments({
        userId,
        status: 'confirmed',
        date: { $gte: now },
      }),

      // Réservations terminées
      Booking.countDocuments({
        userId,
        status: { $in: ['completed', 'confirmed'] },
        date: { $lt: now },
      }),

      // Réservations annulées
      Booking.countDocuments({ userId, status: 'cancelled' }),

      // Réservations en attente
      Booking.countDocuments({
        userId,
        status: { $in: ['pending', 'payment_pending'] },
      }),

      // Ce mois-ci
      Booking.countDocuments({
        userId,
        createdAt: { $gte: startOfMonth },
      }),

      // Mois dernier
      Booking.countDocuments({
        userId,
        createdAt: { $gte: startOfLastMonth, $lt: endOfLastMonth },
      }),

      // Cette année
      Booking.countDocuments({
        userId,
        createdAt: { $gte: startOfYear },
      }),
    ])

    // Calculer le total dépensé
    const totalSpentResult = await Booking.aggregate([
      {
        $match: {
          userId,
          status: { $in: ['confirmed', 'completed'] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalPrice' },
        },
      },
    ])

    const totalSpent =
      totalSpentResult.length > 0 ? totalSpentResult[0].total : 0

    // Total dépensé ce mois-ci
    const thisMonthSpentResult = await Booking.aggregate([
      {
        $match: {
          userId,
          status: { $in: ['confirmed', 'completed'] },
          createdAt: { $gte: startOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalPrice' },
        },
      },
    ])

    const thisMonthSpent =
      thisMonthSpentResult.length > 0 ? thisMonthSpentResult[0].total : 0

    // Temps total passé (en heures)
    const timeSpentResult = await Booking.aggregate([
      {
        $match: {
          userId,
          status: { $in: ['confirmed', 'completed'] },
        },
      },
      {
        $group: {
          _id: null,
          totalHours: {
            $sum: {
              $cond: [
                { $eq: ['$durationType', 'hour'] },
                '$duration',
                { $multiply: ['$duration', 24] }, // Convertir les jours en heures
              ],
            },
          },
        },
      },
    ])

    const totalHoursSpent =
      timeSpentResult.length > 0 ? timeSpentResult[0].totalHours : 0

    // Espaces les plus réservés
    const favoriteSpacesResult = await Booking.aggregate([
      {
        $match: {
          userId,
          status: { $in: ['confirmed', 'completed'] },
        },
      },
      {
        $group: {
          _id: '$spaceId',
          count: { $sum: 1 },
          totalSpent: { $sum: '$totalPrice' },
          totalHours: {
            $sum: {
              $cond: [
                { $eq: ['$durationType', 'hour'] },
                '$duration',
                { $multiply: ['$duration', 24] },
              ],
            },
          },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'spaces',
          localField: '_id',
          foreignField: '_id',
          as: 'space',
        },
      },
      { $unwind: '$space' },
    ])

    const favoriteSpaces = favoriteSpacesResult.map((item) => ({
      space: {
        id: item.space.id,
        name: item.space.name,
        location: item.space.location,
      },
      bookingCount: item.count,
      totalSpent: item.totalSpent,
      totalHours: item.totalHours,
    }))

    // Activité par mois (12 derniers mois)
    const monthlyActivity = await Booking.aggregate([
      {
        $match: {
          userId,
          createdAt: {
            $gte: new Date(now.getFullYear() - 1, now.getMonth(), 1),
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
          totalSpent: { $sum: '$totalPrice' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ])

    // Moyennes
    const averageBookingPrice =
      totalBookings > 0 ? totalSpent / totalBookings : 0
    const averageSessionDuration =
      totalBookings > 0 ? totalHoursSpent / totalBookings : 0

    // Calculer les pourcentages de changement
    const monthOverMonthChange =
      lastMonthBookings > 0
        ? ((thisMonthBookings - lastMonthBookings) / lastMonthBookings) * 100
        : thisMonthBookings > 0
          ? 100
          : 0

    return NextResponse.json({
      overview: {
        totalBookings,
        activeBookings,
        completedBookings,
        cancelledBookings,
        pendingBookings,
        totalSpent,
        totalHoursSpent,
        averageBookingPrice,
        averageSessionDuration,
      },
      thisMonth: {
        bookings: thisMonthBookings,
        spent: thisMonthSpent,
        changeFromLastMonth: monthOverMonthChange,
      },
      thisYear: {
        bookings: thisYearBookings,
      },
      favoriteSpaces,
      monthlyActivity: monthlyActivity.map((item) => ({
        year: item._id.year,
        month: item._id.month,
        count: item.count,
        totalSpent: item.totalSpent,
      })),
      insights: {
        mostActiveMonth:
          monthlyActivity.length > 0
            ? monthlyActivity.reduce(
                (max, current) => (current.count > max.count ? current : max),
                monthlyActivity[0]
              )
            : null,
        streak: {
          // TODO: Calculer la série de réservations consécutives
          current: 0,
          best: 0,
        },
      },
    })
  } catch (error) {
    console.error('[GET /api/bookings/stats] Error:', error)
    return NextResponse.json(
      {
        error: 'Erreur lors de la récupération des statistiques',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
}
