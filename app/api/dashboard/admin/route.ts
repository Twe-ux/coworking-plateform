import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { UserRole } from '@/types/auth'
import dbConnect from '@/lib/mongodb'
import Booking from '@/lib/models/booking'
import User from '@/lib/models/user'

/**
 * API pour récupérer les statistiques du dashboard avancé
 */
export async function GET() {
  try {
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

    await dbConnect()

    // Dates pour les calculs
    const now = new Date()
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    )
    const weekStart = new Date(todayStart)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()) // Début de semaine (dimanche)

    const lastWeekStart = new Date(weekStart)
    lastWeekStart.setDate(lastWeekStart.getDate() - 7)
    const lastWeekEnd = new Date(weekStart)

    // Requêtes en parallèle pour optimiser les performances
    const [
      totalBookings,
      totalUsers,
      activeUsers,
      confirmedBookings,
      pendingBookings,
      cancelledBookings,
      todayBookings,
      thisWeekBookings,
      lastWeekBookings,
      totalRevenue,
      usersByRole,
    ] = await Promise.all([
      // Total des réservations
      Booking.countDocuments(),

      // Total des utilisateurs
      User.countDocuments(),

      // Utilisateurs actifs
      User.countDocuments({ isActive: { $ne: false } }),

      // Réservations confirmées
      Booking.countDocuments({ status: 'confirmed' }),

      // Réservations en attente
      Booking.countDocuments({ status: 'pending' }),

      // Réservations annulées
      Booking.countDocuments({ status: 'cancelled' }),

      // Réservations d'aujourd'hui
      Booking.countDocuments({
        date: {
          $gte: todayStart,
          $lt: new Date(todayStart.getTime() + 24 * 60 * 60 * 1000),
        },
      }),

      // Réservations de cette semaine
      Booking.countDocuments({
        date: {
          $gte: weekStart,
          $lt: now,
        },
      }),

      // Réservations de la semaine dernière
      Booking.countDocuments({
        date: {
          $gte: lastWeekStart,
          $lt: lastWeekEnd,
        },
      }),

      // Chiffre d'affaires total (confirmées seulement)
      Booking.aggregate([
        { $match: { status: 'confirmed' } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),

      // Répartition des utilisateurs par rôle
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    ])

    // Calcul du taux d'occupation
    const totalSlotsPerWeek = 8 * 7
    const occupancyRate =
      confirmedBookings > 0
        ? Math.round((confirmedBookings / (totalSlotsPerWeek * 4)) * 100)
        : 0

    // Calcul de la croissance hebdomadaire
    const weeklyGrowth =
      lastWeekBookings > 0
        ? Math.round(
            ((thisWeekBookings - lastWeekBookings) / lastWeekBookings) * 100
          )
        : thisWeekBookings > 0
          ? 100
          : 0

    // Extraction du revenu total
    const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0

    // Transformation de la répartition par rôle
    const roleDistribution = usersByRole.reduce(
      (acc: any, item: any) => {
        acc[item._id || 'client'] = item.count
        return acc
      },
      {
        client: 0,
        staff: 0,
        manager: 0,
        admin: 0,
      }
    )

    const stats = {
      totalBookings,
      totalUsers,
      activeUsers,
      totalRevenue: Math.round(revenue),
      occupancyRate: Math.min(occupancyRate, 100),
      todayBookings,
      weeklyGrowth,
      usersByRole: roleDistribution,
      bookingsByStatus: {
        confirmed: confirmedBookings,
        pending: pendingBookings,
        cancelled: cancelledBookings,
        total: totalBookings,
      },
    }

    return NextResponse.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('❌ Erreur API Dashboard Advanced:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la récupération des statistiques',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
