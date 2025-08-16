// Fonction utilitaire pour ouvrir le gestionnaire de cookies
export function openCookieBanner() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('openCookieBanner'))
  }
}

// Fonction pour vérifier si l'utilisateur a donné son consentement
export function hasUserConsented(): boolean {
  if (typeof window === 'undefined') return false
  
  const consent = localStorage.getItem('cookieConsent')
  return consent !== null
}

// Fonction pour obtenir les préférences cookies actuelles
export function getCookiePreferences() {
  if (typeof window === 'undefined') return null
  
  const preferences = localStorage.getItem('cookiePreferences')
  if (preferences) {
    try {
      return JSON.parse(preferences)
    } catch (error) {
      console.error('Error parsing cookie preferences:', error)
      return null
    }
  }
  return null
}

// Fonction pour réinitialiser le consentement cookies
export function resetCookieConsent() {
  if (typeof window === 'undefined') return
  
  localStorage.removeItem('cookieConsent')
  localStorage.removeItem('cookiePreferences')
  localStorage.removeItem('cookieConsentDate')
  
  // Recharger la page pour afficher à nouveau le banner
  window.location.reload()
}