// Service Worker pour les notifications push
const CACHE_NAME = 'coworking-cafe-v1'
const APP_NAME = 'Cow or King Café'

// Installation du service worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installé')
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/icons/icon-192x192.png',
        '/icons/badge-72x72.png'
      ])
    })
  )
  self.skipWaiting()
})

// Activation du service worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker activé')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Écoute des notifications push
self.addEventListener('push', (event) => {
  console.log('Notification push reçue:', event)
  
  if (event.data) {
    try {
      const data = event.data.json()
      console.log('Données push:', data)
      
      const notificationOptions = {
        body: data.body,
        icon: data.icon || '/icons/icon-192x192.png',
        badge: data.badge || '/icons/badge-72x72.png',
        image: data.image,
        data: data.data || {},
        actions: data.actions || [],
        tag: data.tag,
        requireInteraction: data.requireInteraction || false,
        vibrate: data.vibrate || [200, 100, 200],
        timestamp: Date.now()
      }

      event.waitUntil(
        self.registration.showNotification(data.title || APP_NAME, notificationOptions)
      )
    } catch (error) {
      console.error('Erreur traitement notification push:', error)
      
      // Notification par défaut en cas d'erreur
      event.waitUntil(
        self.registration.showNotification(APP_NAME, {
          body: 'Vous avez reçu une nouvelle notification',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png'
        })
      )
    }
  }
})

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', (event) => {
  console.log('Clic sur notification:', event)
  
  event.notification.close()
  
  const data = event.notification.data || {}
  const action = event.action || data.action || 'default'
  
  let url = '/'
  
  // Déterminer l'URL selon l'action et le type de notification
  switch (action) {
    case 'view':
    case 'view_booking':
      if (data.bookingId) {
        url = `/dashboard/client/bookings?booking=${data.bookingId}`
      } else {
        url = '/dashboard/client/bookings'
      }
      break
      
    case 'calendar':
      // Rediriger vers la page d'ajout au calendrier
      url = `/calendar/add?booking=${data.bookingId}`
      break
      
    case 'directions':
      // Ouvrir Google Maps (ou une autre app de navigation)
      url = 'https://maps.google.com'
      break
      
    case 'contact':
      url = '/contact'
      break
      
    case 'book':
    case 'book_again':
      url = '/reservation'
      break
      
    case 'default':
      // Action par défaut selon le type de notification
      switch (data.type) {
        case 'booking_confirmation':
        case 'booking_reminder':
          url = data.bookingId 
            ? `/dashboard/client/bookings?booking=${data.bookingId}`
            : '/dashboard/client/bookings'
          break
        case 'booking_cancellation':
          url = '/reservation'
          break
        default:
          url = '/dashboard'
      }
      break
  }
  
  // Ouvrir ou rediriger vers la page appropriée
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Chercher une fenêtre existante de l'application
      for (const client of clientList) {
        if (client.url.includes(self.location.origin)) {
          // Si une fenêtre existe, la focuser et naviguer vers l'URL
          return client.focus().then(() => client.navigate(url))
        }
      }
      
      // Sinon, ouvrir une nouvelle fenêtre
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})

// Gestion de la fermeture des notifications
self.addEventListener('notificationclose', (event) => {
  console.log('Notification fermée:', event.notification.tag)
  
  // Optionnel : envoyer des analytics ou logs
  const data = event.notification.data || {}
  if (data.type && data.bookingId) {
    // Ici on pourrait envoyer une requête pour tracker que la notification a été fermée
    // fetch('/api/analytics/notification-closed', { ... })
  }
})

// Écoute des messages du client
self.addEventListener('message', (event) => {
  console.log('Message reçu par SW:', event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// Gestion des requêtes réseau (optionnel - cache strategy basique)
self.addEventListener('fetch', (event) => {
  // Stratégie de cache simple pour les ressources statiques
  if (event.request.destination === 'image') {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).then((response) => {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone)
          })
          return response
        })
      })
    )
  }
})