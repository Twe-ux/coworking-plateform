import * as webpush from 'web-push'

/**
 * Configuration Web Push
 */
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'support@coworking-cafe.fr'

// Configurer web-push avec les clés VAPID
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${VAPID_EMAIL}`,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  )
}

/**
 * Interface pour une souscription push
 */
export interface PushSubscription {
  endpoint: string
  keys: {
    auth: string
    p256dh: string
  }
}

/**
 * Interface pour les données de notification push
 */
export interface PushNotificationData {
  title: string
  body: string
  icon?: string
  badge?: string
  image?: string
  data?: Record<string, any>
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
  tag?: string
  requireInteraction?: boolean
}

/**
 * Service de notifications push
 */
export class PushNotificationService {
  private static instance: PushNotificationService
  private isConfigured: boolean = false

  constructor() {
    this.isConfigured = !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY)
    
    if (!this.isConfigured) {
      console.warn('⚠️  Push notifications non configurées - clés VAPID manquantes')
    }
  }

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService()
    }
    return PushNotificationService.instance
  }

  /**
   * Vérifie si le service est configuré
   */
  isReady(): boolean {
    return this.isConfigured
  }

  /**
   * Obtient la clé publique VAPID
   */
  getVapidPublicKey(): string | null {
    return VAPID_PUBLIC_KEY || null
  }

  /**
   * Envoie une notification push à un utilisateur
   */
  async sendNotification(
    subscription: PushSubscription,
    notificationData: PushNotificationData
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.isConfigured) {
        return { success: false, error: 'Service push non configuré' }
      }

      const payload = JSON.stringify({
        title: notificationData.title,
        body: notificationData.body,
        icon: notificationData.icon || '/icons/icon-192x192.png',
        badge: notificationData.badge || '/icons/badge-72x72.png',
        image: notificationData.image,
        data: {
          timestamp: Date.now(),
          ...notificationData.data
        },
        actions: notificationData.actions || [],
        tag: notificationData.tag,
        requireInteraction: notificationData.requireInteraction || false,
        vibrate: [200, 100, 200] // Pattern de vibration
      })

      await webpush.sendNotification(subscription, payload)
      
      return { success: true }
    } catch (error) {
      console.error('Erreur envoi push notification:', error)
      
      let errorMessage = 'Erreur inconnue'
      if (error instanceof Error) {
        errorMessage = error.message
      }

      return { success: false, error: errorMessage }
    }
  }

  /**
   * Envoie une notification push à plusieurs utilisateurs
   */
  async sendBulkNotifications(
    subscriptions: PushSubscription[],
    notificationData: PushNotificationData
  ): Promise<{
    success: boolean
    results: Array<{ success: boolean; error?: string }>
    successCount: number
    errorCount: number
  }> {
    if (!this.isConfigured) {
      return {
        success: false,
        results: [],
        successCount: 0,
        errorCount: subscriptions.length
      }
    }

    const results = await Promise.allSettled(
      subscriptions.map(subscription => 
        this.sendNotification(subscription, notificationData)
      )
    )

    const processedResults = results.map(result => 
      result.status === 'fulfilled' 
        ? result.value 
        : { success: false, error: result.reason?.message || 'Échec envoi' }
    )

    const successCount = processedResults.filter(r => r.success).length
    const errorCount = processedResults.length - successCount

    return {
      success: successCount > 0,
      results: processedResults,
      successCount,
      errorCount
    }
  }

  /**
   * Crée une notification de confirmation de réservation
   */
  createBookingConfirmationNotification(
    spaceName: string,
    date: string,
    startTime: string,
    bookingId: string
  ): PushNotificationData {
    return {
      title: '✅ Réservation confirmée !',
      body: `Votre réservation pour ${spaceName} le ${date} à ${startTime} est confirmée.`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: `booking-confirmed-${bookingId}`,
      data: {
        type: 'booking_confirmation',
        bookingId,
        action: 'view_booking'
      },
      actions: [
        {
          action: 'view',
          title: 'Voir la réservation',
          icon: '/icons/view-action.png'
        },
        {
          action: 'calendar',
          title: 'Ajouter au calendrier',
          icon: '/icons/calendar-action.png'
        }
      ],
      requireInteraction: true
    }
  }

  /**
   * Crée une notification de rappel de réservation
   */
  createBookingReminderNotification(
    spaceName: string,
    date: string,
    startTime: string,
    hoursUntil: number,
    bookingId: string
  ): PushNotificationData {
    const timeText = hoursUntil === 24 ? 'demain' : `dans ${hoursUntil}h`
    
    return {
      title: '🔔 Rappel de réservation',
      body: `Rendez-vous ${timeText} chez ${spaceName} à ${startTime}`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: `booking-reminder-${bookingId}`,
      data: {
        type: 'booking_reminder',
        bookingId,
        hoursUntil,
        action: 'view_booking'
      },
      actions: [
        {
          action: 'directions',
          title: 'Itinéraire',
          icon: '/icons/directions-action.png'
        },
        {
          action: 'contact',
          title: 'Contact',
          icon: '/icons/contact-action.png'
        }
      ],
      requireInteraction: true
    }
  }

  /**
   * Crée une notification d'annulation de réservation
   */
  createBookingCancellationNotification(
    spaceName: string,
    date: string,
    startTime: string,
    bookingId: string
  ): PushNotificationData {
    return {
      title: '❌ Réservation annulée',
      body: `Votre réservation pour ${spaceName} le ${date} à ${startTime} a été annulée.`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: `booking-cancelled-${bookingId}`,
      data: {
        type: 'booking_cancellation',
        bookingId,
        action: 'book_again'
      },
      actions: [
        {
          action: 'book',
          title: 'Nouvelle réservation',
          icon: '/icons/book-action.png'
        }
      ]
    }
  }

  /**
   * Valide une souscription push
   */
  validateSubscription(subscription: any): subscription is PushSubscription {
    return (
      subscription &&
      typeof subscription.endpoint === 'string' &&
      subscription.keys &&
      typeof subscription.keys.auth === 'string' &&
      typeof subscription.keys.p256dh === 'string'
    )
  }

  /**
   * Test d'envoi de notification
   */
  async sendTestNotification(
    subscription: PushSubscription
  ): Promise<{ success: boolean; error?: string }> {
    const testNotification: PushNotificationData = {
      title: '🧪 Test Cow or King Café',
      body: 'Les notifications push fonctionnent correctement !',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: 'test-notification',
      data: {
        type: 'test',
        timestamp: Date.now()
      }
    }

    return await this.sendNotification(subscription, testNotification)
  }
}

// Export de l'instance singleton
export const pushNotificationService = PushNotificationService.getInstance()

// Export des types
export type { PushSubscription as PushSubscriptionData }