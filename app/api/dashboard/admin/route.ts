import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { UserRole } from '@/types/auth'
import dbConnect from '@/lib/mongodb'
import Booking from '@/lib/models/booking'
import User from '@/lib/models/User'

/**
 * API pour récupérer les statistiques du dashboard administrateur
 */
export async function GET() {
  try {
    // Vérifier l'authentification et les permissions admin
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
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
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(todayStart)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()) // Début de semaine (dimanche)
    
    const lastWeekStart = new Date(weekStart)
    lastWeekStart.setDate(lastWeekStart.getDate() - 7)
    const lastWeekEnd = new Date(weekStart)

    // Requêtes en parallèle pour optimiser les performances
    const [
      totalBookings,
      totalUsers,
      confirmedBookings,
      todayBookings,
      thisWeekBookings,
      lastWeekBookings,
      totalRevenue
    ] = await Promise.all([
      // Total des réservations
      Booking.countDocuments(),
      
      // Total des utilisateurs
      User.countDocuments(),
      
      // Réservations confirmées (pour le taux d'occupation)
      Booking.countDocuments({ status: 'confirmed' }),
      
      // Réservations d'aujourd'hui
      Booking.countDocuments({
        date: {
          $gte: todayStart,
          $lt: new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
        }
      }),
      
      // Réservations de cette semaine
      Booking.countDocuments({
        date: {
          $gte: weekStart,
          $lt: now
        }
      }),
      
      // Réservations de la semaine dernière
      Booking.countDocuments({
        date: {
          $gte: lastWeekStart,
          $lt: lastWeekEnd
        }
      }),
      
      // Chiffre d'affaires total
      Booking.aggregate([
        { $match: { status: 'confirmed' } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ])
    ])

    // Calcul du taux d'occupation (simplifié)
    // Assuming 8 slots per day (8h-20h) and 7 days a week
    const totalSlotsPerWeek = 8 * 7
    const occupancyRate = confirmedBookings > 0 
      ? Math.round((confirmedBookings / (totalSlotsPerWeek * 4)) * 100) // 4 weeks estimation
      : 0

    // Calcul de la croissance hebdomadaire
    const weeklyGrowth = lastWeekBookings > 0 
      ? Math.round(((thisWeekBookings - lastWeekBookings) / lastWeekBookings) * 100)
      : thisWeekBookings > 0 ? 100 : 0

    // Extraction du revenu total
    const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0

    const stats = {
      totalBookings,
      totalUsers,
      totalRevenue: Math.round(revenue),
      occupancyRate: Math.min(occupancyRate, 100), // Cap à 100%
      todayBookings,
      weeklyGrowth
    }

    return NextResponse.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ Erreur API Dashboard Admin:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la récupération des statistiques',
        details: error.message 
      },
      { status: 500 }
    )
  }
}