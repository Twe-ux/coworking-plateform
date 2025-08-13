/**
 * Utilitaire client pour gérer les notifications push
 */

export interface PushNotificationPermission {
  granted: boolean
  denied: boolean
  default: boolean
  supported: boolean
}

export class PushNotificationClient {
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null
  private vapidPublicKey: string | null = null

  /**
   * Vérifie si les notifications push sont supportées
   */
  isSupported(): boolean {
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    )
  }

  /**
   * Obtient le statut des permissions
   */
  async getPermissionStatus(): Promise<PushNotificationPermission> {
    if (!this.isSupported()) {
      return {
        granted: false,
        denied: true,
        default: false,
        supported: false,
      }
    }

    const permission = await Notification.permission

    return {
      granted: permission === 'granted',
      denied: permission === 'denied',
      default: permission === 'default',
      supported: true,
    }
  }

  /**
   * Demande les permissions pour les notifications
   */
  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn('Notifications push non supportées')
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    } catch (error) {
      console.error('Erreur demande permission notifications:', error)
      return false
    }
  }

  /**
   * Initialise le service worker
   */
  async initializeServiceWorker(): Promise<boolean> {
    if (!this.isSupported()) {
      return false
    }

    try {
      this.serviceWorkerRegistration =
        await navigator.serviceWorker.register('/sw.js')
      console.log(
        'Service Worker enregistré:',
        this.serviceWorkerRegistration.scope
      )

      // Attendre que le service worker soit actif
      await navigator.serviceWorker.ready

      return true
    } catch (error) {
      console.error('Erreur enregistrement service worker:', error)
      return false
    }
  }

  /**
   * Récupère la clé publique VAPID depuis le serveur
   */
  async fetchVapidPublicKey(): Promise<string | null> {
    try {
      const response = await fetch('/api/push-notifications')
      const data = await response.json()

      if (data.success && data.vapidPublicKey) {
        this.vapidPublicKey = data.vapidPublicKey
        return this.vapidPublicKey
      }

      return null
    } catch (error) {
      console.error('Erreur récupération clé VAPID:', error)
      return null
    }
  }

  /**
   * S'abonne aux notifications push
   */
  async subscribe(): Promise<PushSubscription | null> {
    if (!this.serviceWorkerRegistration || !this.vapidPublicKey) {
      console.error('Service worker ou clé VAPID non initialisé')
      return null
    }

    try {
      // Vérifier si l'utilisateur a déjà une souscription
      const existingSubscription =
        await this.serviceWorkerRegistration.pushManager.getSubscription()
      if (existingSubscription) {
        console.log('Souscription existante trouvée')
        return existingSubscription
      }

      // Créer une nouvelle souscription
      const applicationServerKey = this.urlBase64ToUint8Array(
        this.vapidPublicKey
      )
      const subscription =
        await this.serviceWorkerRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
        })

      console.log('Nouvelle souscription push créée:', subscription)

      // Envoyer la souscription au serveur
      await this.sendSubscriptionToServer(subscription)

      return subscription
    } catch (error) {
      console.error('Erreur souscription push:', error)
      return null
    }
  }

  /**
   * Se désabonne des notifications push
   */
  async unsubscribe(): Promise<boolean> {
    if (!this.serviceWorkerRegistration) {
      return false
    }

    try {
      const subscription =
        await this.serviceWorkerRegistration.pushManager.getSubscription()

      if (subscription) {
        await subscription.unsubscribe()

        // Informer le serveur du désabonnement
        await this.sendUnsubscriptionToServer()

        console.log('Désabonnement push effectué')
        return true
      }

      return true // Pas de souscription à désactiver
    } catch (error) {
      console.error('Erreur désabonnement push:', error)
      return false
    }
  }

  /**
   * Envoie une notification de test
   */
  async sendTestNotification(): Promise<boolean> {
    if (!this.serviceWorkerRegistration) {
      console.error('Service worker non initialisé')
      return false
    }

    try {
      const subscription =
        await this.serviceWorkerRegistration.pushManager.getSubscription()

      if (!subscription) {
        console.error('Aucune souscription push active')
        return false
      }

      const response = await fetch('/api/push-notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'test',
          subscription: {
            endpoint: subscription.endpoint,
            keys: {
              auth: this.arrayBufferToBase64(subscription.getKey('auth')),
              p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')),
            },
          },
        }),
      })

      const result = await response.json()
      return result.success
    } catch (error) {
      console.error('Erreur envoi notification test:', error)
      return false
    }
  }

  /**
   * Initialisation complète du système de notifications push
   */
  async initialize(): Promise<boolean> {
    try {
      // 1. Vérifier le support
      if (!this.isSupported()) {
        console.warn('Notifications push non supportées par ce navigateur')
        return false
      }

      // 2. Initialiser le service worker
      const swInitialized = await this.initializeServiceWorker()
      if (!swInitialized) {
        console.error("Impossible d'initialiser le service worker")
        return false
      }

      // 3. Récupérer la clé VAPID
      const vapidKey = await this.fetchVapidPublicKey()
      if (!vapidKey) {
        console.error('Impossible de récupérer la clé VAPID')
        return false
      }

      console.log('✅ Système de notifications push initialisé')
      return true
    } catch (error) {
      console.error('Erreur initialisation notifications push:', error)
      return false
    }
  }

  /**
   * Envoie la souscription au serveur
   */
  private async sendSubscriptionToServer(
    subscription: PushSubscription
  ): Promise<void> {
    try {
      const response = await fetch('/api/push-notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'subscribe',
          subscription: {
            endpoint: subscription.endpoint,
            keys: {
              auth: this.arrayBufferToBase64(subscription.getKey('auth')),
              p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')),
            },
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Erreur envoi souscription au serveur')
      }
    } catch (error) {
      console.error('Erreur envoi souscription:', error)
      throw error
    }
  }

  /**
   * Informe le serveur du désabonnement
   */
  private async sendUnsubscriptionToServer(): Promise<void> {
    try {
      await fetch('/api/push-notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'unsubscribe',
        }),
      })
    } catch (error) {
      console.error('Erreur envoi désabonnement:', error)
    }
  }

  /**
   * Convertit une clé VAPID base64 en Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }

    return new Uint8Array(outputArray)
  }

  /**
   * Convertit un ArrayBuffer en base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer | null): string {
    if (!buffer) return ''

    const bytes = new Uint8Array(buffer)
    let binary = ''

    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }

    return window.btoa(binary)
  }
}

// Export de l'instance singleton
export const pushNotificationClient = new PushNotificationClient()
