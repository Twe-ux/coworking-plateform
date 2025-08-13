import { Booking } from './models/booking'
import { User } from './models/user'
import { Space } from './models/space'
import { sendBookingReminderEmail } from './email'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

/**
 * Interface pour les tâches de notification programmées
 */
interface ScheduledNotification {
  bookingId: string
  type: 'reminder_24h' | 'reminder_2h' | 'reminder_1h'
  scheduledAt: Date
  userId: string
  email: string
  sent: boolean
  attempts: number
}

/**
 * Service de gestion des notifications programmées
 */
export class NotificationScheduler {
  private static instance: NotificationScheduler
  private isRunning: boolean = false
  private intervalId: NodeJS.Timeout | null = null

  // Singleton pattern
  static getInstance(): NotificationScheduler {
    if (!NotificationScheduler.instance) {
      NotificationScheduler.instance = new NotificationScheduler()
    }
    return NotificationScheduler.instance
  }

  /**
   * Démarre le service de notifications
   */
  start(): void {
    if (this.isRunning) {
      console.log('📧 Service de notifications déjà en cours')
      return
    }

    console.log('🚀 Démarrage du service de notifications automatiques')

    // Vérifier les notifications toutes les 5 minutes
    this.intervalId = setInterval(
      () => {
        this.processScheduledNotifications()
      },
      5 * 60 * 1000
    )

    this.isRunning = true

    // Traiter immédiatement au démarrage
    this.processScheduledNotifications()
  }

  /**
   * Arrête le service de notifications
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.isRunning = false
    console.log('⏹️  Service de notifications arrêté')
  }

  /**
   * Traite les notifications programmées
   */
  private async processScheduledNotifications(): Promise<void> {
    try {
      console.log('🔍 Vérification des notifications à envoyer...')

      // Chercher les réservations qui nécessitent des rappels
      const upcomingBookings = await this.getUpcomingBookings()

      for (const booking of upcomingBookings) {
        await this.processBookingNotifications(booking)
      }

      console.log(
        `✅ Traitement terminé pour ${upcomingBookings.length} réservations`
      )
    } catch (error) {
      console.error('❌ Erreur lors du traitement des notifications:', error)
    }
  }

  /**
   * Récupère les réservations à venir qui nécessitent des rappels
   */
  private async getUpcomingBookings() {
    const now = new Date()
    const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000)

    return await Booking.find({
      status: { $in: ['pending', 'confirmed'] },
      date: {
        $gte: now,
        $lte: in48Hours,
      },
    }).populate('userId spaceId')
  }

  /**
   * Traite les notifications pour une réservation spécifique
   */
  private async processBookingNotifications(booking: any): Promise<void> {
    const now = new Date()
    const bookingDateTime = this.getBookingDateTime(booking)
    const hoursUntilBooking = Math.floor(
      (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)
    )

    // Déterminer les rappels à envoyer
    const remindersToSend = this.getRemindersToSend(hoursUntilBooking)

    for (const reminderType of remindersToSend) {
      await this.sendReminderIfNeeded(booking, reminderType, hoursUntilBooking)
    }
  }

  /**
   * Détermine quels rappels envoyer selon le temps restant
   */
  private getRemindersToSend(
    hoursUntilBooking: number
  ): ('reminder_24h' | 'reminder_2h' | 'reminder_1h')[] {
    const reminders: ('reminder_24h' | 'reminder_2h' | 'reminder_1h')[] = []

    if (hoursUntilBooking <= 24 && hoursUntilBooking > 23) {
      reminders.push('reminder_24h')
    }
    if (hoursUntilBooking <= 2 && hoursUntilBooking > 1.5) {
      reminders.push('reminder_2h')
    }
    if (hoursUntilBooking <= 1 && hoursUntilBooking > 0.5) {
      reminders.push('reminder_1h')
    }

    return reminders
  }

  /**
   * Envoie un rappel si nécessaire
   */
  private async sendReminderIfNeeded(
    booking: any,
    reminderType: 'reminder_24h' | 'reminder_2h' | 'reminder_1h',
    hoursUntilBooking: number
  ): Promise<void> {
    try {
      // Vérifier si le rappel a déjà été envoyé
      const notificationKey = `${booking._id}_${reminderType}`
      const existingNotification =
        await this.getExistingNotification(notificationKey)

      if (existingNotification?.sent) {
        return // Déjà envoyé
      }

      const user = booking.userId
      const space = booking.spaceId

      if (!user || !space) {
        console.error(
          '❌ Données utilisateur ou espace manquantes pour la réservation',
          booking._id
        )
        return
      }

      // Envoyer l'email de rappel
      const emailResult = await sendBookingReminderEmail({
        email: user.email,
        firstName: user.firstName || user.name?.split(' ')[0] || 'Utilisateur',
        lastName:
          user.lastName || user.name?.split(' ').slice(1).join(' ') || '',
        bookingId: booking._id.toString(),
        spaceName: space.name,
        date: format(booking.date, 'dd MMMM yyyy', { locale: fr }),
        startTime: booking.startTime,
        endTime: booking.endTime,
        hoursUntilBooking,
      })

      if (emailResult.success) {
        await this.markNotificationAsSent(
          notificationKey,
          booking,
          reminderType
        )
        console.log(
          `✅ Rappel ${reminderType} envoyé pour la réservation ${booking._id}`
        )
      } else {
        await this.recordNotificationAttempt(
          notificationKey,
          booking,
          reminderType,
          emailResult.error
        )
        console.error(
          `❌ Échec envoi rappel ${reminderType} pour ${booking._id}:`,
          emailResult.error
        )
      }
    } catch (error) {
      console.error(
        `❌ Erreur lors de l'envoi du rappel ${reminderType}:`,
        error
      )
    }
  }

  /**
   * Obtient la date/heure complète de la réservation
   */
  private getBookingDateTime(booking: any): Date {
    const bookingDate = new Date(booking.date)
    const [hours, minutes] = booking.startTime.split(':').map(Number)
    bookingDate.setHours(hours, minutes, 0, 0)
    return bookingDate
  }

  /**
   * Vérifie si une notification a déjà été envoyée (simulation avec cache mémoire)
   * En production, cela devrait être stocké en base de données
   */
  private static notificationCache = new Map<string, ScheduledNotification>()

  private async getExistingNotification(
    key: string
  ): Promise<ScheduledNotification | undefined> {
    return NotificationScheduler.notificationCache.get(key)
  }

  /**
   * Marque une notification comme envoyée
   */
  private async markNotificationAsSent(
    key: string,
    booking: any,
    type: string
  ): Promise<void> {
    NotificationScheduler.notificationCache.set(key, {
      bookingId: booking._id.toString(),
      type: type as any,
      scheduledAt: new Date(),
      userId: booking.userId._id?.toString() || booking.userId.toString(),
      email: booking.userId.email || '',
      sent: true,
      attempts: 1,
    })
  }

  /**
   * Enregistre une tentative d'envoi échouée
   */
  private async recordNotificationAttempt(
    key: string,
    booking: any,
    type: string,
    error?: string
  ): Promise<void> {
    const existing = NotificationScheduler.notificationCache.get(key)
    const attempts = (existing?.attempts || 0) + 1

    NotificationScheduler.notificationCache.set(key, {
      bookingId: booking._id.toString(),
      type: type as any,
      scheduledAt: new Date(),
      userId: booking.userId._id?.toString() || booking.userId.toString(),
      email: booking.userId.email || '',
      sent: false,
      attempts,
    })

    // Arrêter les tentatives après 3 échecs
    if (attempts >= 3) {
      console.error(
        `❌ Abandon après ${attempts} tentatives pour la notification ${key}`
      )
    }
  }

  /**
   * Nettoie les notifications anciennes du cache
   */
  private cleanupOldNotifications(): void {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const entries = Array.from(
      NotificationScheduler.notificationCache.entries()
    )
    for (const [key, notification] of entries) {
      if (notification.scheduledAt < oneDayAgo) {
        NotificationScheduler.notificationCache.delete(key)
      }
    }
  }

  /**
   * Méthode utilitaire pour programmer une notification immédiate (pour les tests)
   */
  async sendImmediateReminder(
    bookingId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const booking =
        await Booking.findById(bookingId).populate('userId spaceId')

      if (!booking) {
        return { success: false, error: 'Réservation non trouvée' }
      }

      const user = booking.userId as any
      const space = booking.spaceId as any
      const now = new Date()
      const bookingDateTime = this.getBookingDateTime(booking)
      const hoursUntilBooking = Math.floor(
        (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)
      )

      return await sendBookingReminderEmail({
        email: user.email,
        firstName: user.firstName || user.name?.split(' ')[0] || 'Utilisateur',
        lastName:
          user.lastName || user.name?.split(' ').slice(1).join(' ') || '',
        bookingId: booking._id.toString(),
        spaceName: space.name,
        date: format(booking.date, 'dd MMMM yyyy', { locale: fr }),
        startTime: booking.startTime,
        endTime: booking.endTime,
        hoursUntilBooking: Math.max(0, hoursUntilBooking),
      })
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      }
    }
  }

  /**
   * Obtient les statistiques des notifications
   */
  getStats(): {
    totalNotifications: number
    sentNotifications: number
    failedNotifications: number
    cacheSize: number
  } {
    const notifications = Array.from(
      NotificationScheduler.notificationCache.values()
    )

    return {
      totalNotifications: notifications.length,
      sentNotifications: notifications.filter((n) => n.sent).length,
      failedNotifications: notifications.filter(
        (n) => !n.sent && n.attempts >= 3
      ).length,
      cacheSize: NotificationScheduler.notificationCache.size,
    }
  }
}

// Export de l'instance singleton
export const notificationScheduler = NotificationScheduler.getInstance()

// Auto-démarrage en production
if (process.env.NODE_ENV === 'production') {
  notificationScheduler.start()
}

// Nettoyage automatique toutes les heures
setInterval(
  () => {
    NotificationScheduler.getInstance()['cleanupOldNotifications']()
  },
  60 * 60 * 1000
)
