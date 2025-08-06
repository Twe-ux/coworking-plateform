/**
 * Utilitaires pour nettoyer le cache d'authentification
 * Résout les problèmes persistants de configuration réseau
 */

/**
 * Nettoie tous les cookies et données locales liés à l'authentification
 */
export function clearAuthCache(): void {
  try {
    // Nettoyer localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (
          key.includes('nextauth') ||
          key.includes('auth') ||
          key.includes('session') ||
          key.includes('token')
        )) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
    }

    // Nettoyer sessionStorage
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const keysToRemove = []
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key && (
          key.includes('nextauth') ||
          key.includes('auth') ||
          key.includes('session') ||
          key.includes('token')
        )) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => sessionStorage.removeItem(key))
    }

    console.log('Cache authentification nettoyé côté client')
  } catch (error) {
    console.error('Erreur lors du nettoyage du cache:', error)
  }
}

/**
 * Nettoie le cache complet (client + serveur)
 */
export async function clearCompleteAuthCache(): Promise<void> {
  try {
    // Nettoyer côté client
    clearAuthCache()

    // Nettoyer côté serveur
    const response = await fetch('/api/auth/clear-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.warn('Impossible de nettoyer le cache serveur:', response.statusText)
    } else {
      console.log('Cache serveur nettoyé avec succès')
    }

    // Forcer le rechargement de la page pour s'assurer que tout est propre
    if (typeof window !== 'undefined') {
      // Attendre un peu pour s'assurer que les cookies sont supprimés
      setTimeout(() => {
        window.location.href = '/login'
      }, 100)
    }
  } catch (error) {
    console.error('Erreur lors du nettoyage complet:', error)
    // Fallback: nettoyer au moins côté client et recharger
    clearAuthCache()
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.location.href = '/login'
      }, 100)
    }
  }
}

/**
 * Vérifie et corrige les URLs avec des ports incorrects
 */
export function fixPortInUrls(): void {
  if (typeof window !== 'undefined') {
    const currentUrl = window.location.href
    
    // Si nous sommes sur le port 3001, rediriger vers 3000
    if (currentUrl.includes(':3001')) {
      const newUrl = currentUrl.replace(':3001', ':3000')
      console.log(`Redirection de ${currentUrl} vers ${newUrl}`)
      window.location.replace(newUrl)
    }
  }
}

/**
 * Solution complète pour résoudre les problèmes de configuration réseau
 */
export async function resolveNetworkConfigIssues(): Promise<void> {
  console.log('Résolution des problèmes de configuration réseau...')
  
  try {
    // 1. Vérifier et corriger les URLs
    fixPortInUrls()
    
    // 2. Nettoyer le cache complet
    await clearCompleteAuthCache()
    
    console.log('Problèmes de configuration réseau résolus')
  } catch (error) {
    console.error('Erreur lors de la résolution:', error)
    // Fallback simple
    clearAuthCache()
  }
}