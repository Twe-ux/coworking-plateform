import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { UserRole } from '@/types/auth'
import dbConnect from '@/lib/mongodb'
import User from '@/lib/models/user'
import Booking from '@/lib/models/booking'

/**
 * API pour la gestion des utilisateurs par l'admin
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

    await dbConnect()

    // Récupérer tous les utilisateurs
    const users = await User.find()
      .select('firstName lastName email role isActive createdAt updatedAt')
      .sort({ createdAt: -1 })
      .lean()

    // Pour chaque utilisateur, calculer les statistiques de réservation
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        // Compter les réservations
        const bookingsCount = await Booking.countDocuments({ user: user._id })

        // Calculer le total dépensé
        const spentResult = await Booking.aggregate([
          { $match: { user: user._id, status: 'confirmed' } },
          { $group: { _id: null, total: { $sum: '$totalPrice' } } },
        ])
        const totalSpent = spentResult.length > 0 ? spentResult[0].total : 0

        // Dernière réservation
        const lastBooking = await Booking.findOne(
          { user: user._id },
          { date: 1 }
        ).sort({ createdAt: -1 })

        return {
          _id: user._id.toString(),
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          isActive: user.isActive !== false, // Par défaut true si non défini
          bookingsCount,
          totalSpent: Math.round(totalSpent),
          lastBooking: lastBooking
            ? new Date(lastBooking.date).toLocaleDateString('fr-FR')
            : null,
          createdAt: user.createdAt,
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: usersWithStats,
      count: usersWithStats.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('❌ Erreur API Users Admin:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la récupération des utilisateurs',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * Mettre à jour le statut d'un utilisateur
 */
export async function PATCH(request: NextRequest) {
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

    const { userId, isActive } = await request.json()

    if (!userId || typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'userId et isActive sont requis' },
        { status: 400 }
      )
    }

    await dbConnect()

    // Vérifier que l'utilisateur existe
    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Empêcher la désactivation de son propre compte
    if (userId === session.user.id && !isActive) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas désactiver votre propre compte' },
        { status: 400 }
      )
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        isActive,
        updatedAt: new Date(),
      },
      { new: true }
    )

    return NextResponse.json({
      success: true,
      message: `Utilisateur ${isActive ? 'activé' : 'désactivé'} avec succès`,
      data: {
        userId: updatedUser._id,
        isActive: updatedUser.isActive,
      },
    })
  } catch (error: any) {
    console.error('❌ Erreur mise à jour utilisateur:', error)
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la mise à jour de l'utilisateur",
        details: error.message,
      },
      { status: 500 }
    )
  }
}
