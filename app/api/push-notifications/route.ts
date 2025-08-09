import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { pushNotificationService, type PushSubscriptionData } from '@/lib/push-notifications'
import { z } from 'zod'

// Schema de validation pour l'abonnement push
const subscriptionSchema = z.object({
  endpoint: z.string().url('Endpoint invalide'),
  keys: z.object({
    auth: z.string().min(1, 'Clé auth requise'),
    p256dh: z.string().min(1, 'Clé p256dh requise')
  })
})

// Schema de validation pour envoyer une notification
const sendNotificationSchema = z.object({
  subscription: subscriptionSchema,
  notification: z.object({
    title: z.string().min(1, 'Titre requis'),
    body: z.string().min(1, 'Corps requis'),
    icon: z.string().optional(),
    badge: z.string().optional(),
    image: z.string().optional(),
    tag: z.string().optional(),
    data: z.record(z.any()).optional(),
    actions: z.array(z.object({
      action: z.string(),
      title: z.string(),
      icon: z.string().optional()
    })).optional(),
    requireInteraction: z.boolean().optional()
  })
})

/**
 * GET /api/push-notifications - Obtient la clé publique VAPID
 */
export async function GET(request: NextRequest) {
  try {
    // Pas besoin d'authentification pour récupérer la clé publique
    const vapidPublicKey = pushNotificationService.getVapidPublicKey()
    
    if (!vapidPublicKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Service push notifications non configuré',
          configured: false
        },
        { status: 503 }
      )
    }

    return NextResponse.json({
      success: true,
      vapidPublicKey,
      configured: pushNotificationService.isReady()
    })

  } catch (error) {
    console.error('Erreur API push notifications GET:', error)
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
 * POST /api/push-notifications - Envoie une notification push ou gère les abonnements
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action } = body

    // Vérifier que le service est configuré
    if (!pushNotificationService.isReady()) {
      return NextResponse.json(
        { success: false, error: 'Service push notifications non configuré' },
        { status: 503 }
      )
    }

    switch (action) {
      case 'subscribe':
        // Sauvegarder un abonnement push (en production, sauvegarder en base de données)
        const subscriptionValidation = subscriptionSchema.safeParse(body.subscription)
        
        if (!subscriptionValidation.success) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Données d\'abonnement invalides',
              details: subscriptionValidation.error.errors
            },
            { status: 400 }
          )
        }

        // Ici, en production, on sauvegarderait l'abonnement en base de données
        // associé à l'utilisateur connecté
        console.log(`📱 Nouvel abonnement push pour l'utilisateur ${session.user.id}`)

        return NextResponse.json({
          success: true,
          message: 'Abonnement push enregistré avec succès'
        })

      case 'unsubscribe':
        // Supprimer un abonnement push
        console.log(`📱 Désabonnement push pour l'utilisateur ${session.user.id}`)

        return NextResponse.json({
          success: true,
          message: 'Désabonnement push effectué'
        })

      case 'send':
        // Envoyer une notification push (admins seulement)
        const user = session.user as any
        if (user.role !== 'admin') {
          return NextResponse.json(
            { success: false, error: 'Accès non autorisé' },
            { status: 403 }
          )
        }

        const sendValidation = sendNotificationSchema.safeParse(body)
        if (!sendValidation.success) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Données de notification invalides',
              details: sendValidation.error.errors
            },
            { status: 400 }
          )
        }

        const { subscription, notification } = sendValidation.data
        const result = await pushNotificationService.sendNotification(subscription, notification)

        return NextResponse.json(result)

      case 'test':
        // Envoyer une notification de test
        const testSubscriptionValidation = subscriptionSchema.safeParse(body.subscription)
        
        if (!testSubscriptionValidation.success) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Données d\'abonnement invalides',
              details: testSubscriptionValidation.error.errors
            },
            { status: 400 }
          )
        }

        const testResult = await pushNotificationService.sendTestNotification(
          testSubscriptionValidation.data
        )

        return NextResponse.json({
          ...testResult,
          message: testResult.success 
            ? 'Notification de test envoyée avec succès' 
            : 'Échec de l\'envoi de la notification de test'
        })

      default:
        return NextResponse.json(
          { success: false, error: 'Action non reconnue' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Erreur API push notifications POST:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur serveur interne' 
      },
      { status: 500 }
    )
  }
}