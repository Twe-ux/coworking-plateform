import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { notificationScheduler } from '@/lib/notification-scheduler'
import { checkEmailConfiguration } from '@/lib/email'
import connectMongoose from '@/lib/mongoose'

/**
 * GET /api/notifications - Obtient les statistiques des notifications
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification et les permissions admin
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Seuls les admins peuvent voir les stats
    const user = session.user as any
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    // Vérifier la configuration email
    const emailConfigured = checkEmailConfiguration()
    
    // Obtenir les statistiques du scheduler
    const stats = notificationScheduler.getStats()

    return NextResponse.json({
      success: true,
      data: {
        emailConfigured,
        schedulerRunning: true, // Le scheduler est toujours actif en production
        statistics: stats,
        lastCheck: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Erreur API notifications GET:', error)
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
 * POST /api/notifications - Actions sur le système de notifications
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification et les permissions admin
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Seuls les admins peuvent gérer les notifications
    const user = session.user as any
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action, bookingId } = body

    await connectMongoose()

    switch (action) {
      case 'start':
        notificationScheduler.start()
        return NextResponse.json({
          success: true,
          message: 'Service de notifications démarré'
        })

      case 'stop':
        notificationScheduler.stop()
        return NextResponse.json({
          success: true,
          message: 'Service de notifications arrêté'
        })

      case 'test_reminder':
        if (!bookingId) {
          return NextResponse.json(
            { success: false, error: 'ID de réservation requis' },
            { status: 400 }
          )
        }

        const result = await notificationScheduler.sendImmediateReminder(bookingId)
        
        if (result.success) {
          return NextResponse.json({
            success: true,
            message: 'Rappel de test envoyé avec succès'
          })
        } else {
          return NextResponse.json(
            { success: false, error: result.error },
            { status: 400 }
          )
        }

      default:
        return NextResponse.json(
          { success: false, error: 'Action non reconnue' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Erreur API notifications POST:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur serveur interne' 
      },
      { status: 500 }
    )
  }
}