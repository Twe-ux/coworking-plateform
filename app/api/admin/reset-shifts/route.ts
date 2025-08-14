import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { resetActiveShiftsAtMidnight } from '@/lib/cronJobs'

/**
 * POST /api/admin/reset-shifts - Réinitialiser manuellement les shifts actifs
 * Cette route peut être appelée manuellement ou par un cron job externe
 */
export async function POST(request: NextRequest) {
  try {
    // Vérification de l'authentification (optionnelle en développement)
    if (process.env.NODE_ENV !== 'development') {
      const session = await getServerSession(authOptions)

      if (!session?.user?.id) {
        return NextResponse.json(
          {
            success: false,
            error: 'Non authentifié',
          },
          { status: 401 }
        )
      }

      const userRole = (session?.user as any)?.role
      if (userRole !== 'admin') {
        return NextResponse.json(
          {
            success: false,
            error: 'Seuls les administrateurs peuvent réinitialiser les shifts',
          },
          { status: 403 }
        )
      }
    }

    // Exécuter la réinitialisation
    const result = await resetActiveShiftsAtMidnight()

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Réinitialisation des shifts terminée',
    })
  } catch (error: any) {
    console.error('❌ Erreur API reset-shifts:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la réinitialisation des shifts',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/reset-shifts - Obtenir des informations sur les shifts à réinitialiser
 */
export async function GET(request: NextRequest) {
  try {
    if (process.env.NODE_ENV !== 'development') {
      const session = await getServerSession(authOptions)

      if (!session?.user?.id) {
        return NextResponse.json(
          {
            success: false,
            error: 'Non authentifié',
          },
          { status: 401 }
        )
      }
    }

    const { connectToDatabase } = await import('@/lib/mongodb')
    const TimeEntry = (await import('@/lib/models/timeEntry')).default

    await connectToDatabase()

    // Compter les shifts actifs d'hier ou plus anciens
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(23, 59, 59, 999)

    const activeShiftsCount = await TimeEntry.countDocuments({
      status: 'active',
      clockIn: { $lte: yesterday },
      isActive: true,
    })

    return NextResponse.json({
      success: true,
      data: {
        activeShiftsToReset: activeShiftsCount,
        lastReset: new Date().toISOString(),
      },
    })
  } catch (error: any) {
    console.error('❌ Erreur API GET reset-shifts:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la vérification des shifts',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
