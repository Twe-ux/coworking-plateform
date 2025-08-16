'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cookie, Settings, X, Check, Shield } from 'lucide-react'

export interface CookiePreferences {
  essential: boolean
  analytics: boolean
  marketing: boolean
  functional: boolean
}

interface CookieBannerProps {
  onAcceptAll?: (preferences: CookiePreferences) => void
  onRejectAll?: (preferences: CookiePreferences) => void
  onSavePreferences?: (preferences: CookiePreferences) => void
}

export function CookieBanner({ 
  onAcceptAll, 
  onRejectAll, 
  onSavePreferences 
}: CookieBannerProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true, // Toujours true, non modifiable
    analytics: false,
    marketing: false,
    functional: false
  })

  useEffect(() => {
    // Vérifier si l'utilisateur a déjà fait un choix
    const cookieConsent = localStorage.getItem('cookieConsent')
    const hasConsented = localStorage.getItem('cookiePreferences')
    
    if (!cookieConsent && !hasConsented) {
      // Délai pour éviter l'affichage immédiat
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 2000)
      return () => clearTimeout(timer)
    }

    // Écouter l'événement global pour ouvrir le banner
    const handleOpenCookieBanner = () => {
      setIsVisible(true)
      setShowSettings(true)
    }

    window.addEventListener('openCookieBanner', handleOpenCookieBanner)
    return () => window.removeEventListener('openCookieBanner', handleOpenCookieBanner)
  }, [])

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      essential: true,
      analytics: true,
      marketing: true,
      functional: true
    }
    
    localStorage.setItem('cookieConsent', 'accepted')
    localStorage.setItem('cookiePreferences', JSON.stringify(allAccepted))
    localStorage.setItem('cookieConsentDate', new Date().toISOString())
    
    setIsVisible(false)
    onAcceptAll?.(allAccepted)
  }

  const handleRejectAll = () => {
    const essentialOnly: CookiePreferences = {
      essential: true,
      analytics: false,
      marketing: false,
      functional: false
    }
    
    localStorage.setItem('cookieConsent', 'rejected')
    localStorage.setItem('cookiePreferences', JSON.stringify(essentialOnly))
    localStorage.setItem('cookieConsentDate', new Date().toISOString())
    
    setIsVisible(false)
    onRejectAll?.(essentialOnly)
  }

  const handleSavePreferences = () => {
    localStorage.setItem('cookieConsent', 'customized')
    localStorage.setItem('cookiePreferences', JSON.stringify(preferences))
    localStorage.setItem('cookieConsentDate', new Date().toISOString())
    
    setIsVisible(false)
    setShowSettings(false)
    onSavePreferences?.(preferences)
  }

  const togglePreference = (key: keyof CookiePreferences) => {
    if (key === 'essential') return // Ne peut pas être désactivé
    
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const cookieTypes = [
    {
      key: 'essential' as keyof CookiePreferences,
      title: 'Cookies essentiels',
      description: 'Nécessaires au fonctionnement du site (authentification, panier, sécurité)',
      icon: Shield,
      required: true,
      examples: ['Session utilisateur', 'Panier de réservation', 'Sécurité CSRF']
    },
    {
      key: 'functional' as keyof CookiePreferences,
      title: 'Cookies fonctionnels',
      description: 'Améliorent votre expérience (préférences, langue, thème)',
      icon: Settings,
      required: false,
      examples: ['Préférences de langue', 'Thème sombre/clair', 'Réglages interface']
    },
    {
      key: 'analytics' as keyof CookiePreferences,
      title: 'Cookies analytiques',
      description: 'Nous aident à comprendre comment vous utilisez notre site',
      icon: Cookie,
      required: false,
      examples: ['Google Analytics (anonymisé)', 'Statistiques de visite', 'Performances pages']
    },
    {
      key: 'marketing' as keyof CookiePreferences,
      title: 'Cookies marketing',
      description: 'Personnalisent les publicités et mesurent leur efficacité',
      icon: Cookie,
      required: false,
      examples: ['Publicités ciblées', 'Réseaux sociaux', 'Retargeting']
    }
  ]

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      >
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => !showSettings && setIsVisible(false)}
        />

        {/* Banner principal */}
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          {!showSettings ? (
            /* Vue simplifiée */
            <div className="p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 p-3 bg-blue-100 rounded-full">
                  <Cookie className="h-6 w-6 text-blue-600" />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    🍪 Ce site utilise des cookies
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Nous utilisons des cookies pour améliorer votre expérience, analyser le trafic et personnaliser le contenu. 
                    Vous pouvez accepter tous les cookies ou choisir vos préférences.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleAcceptAll}
                      className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center gap-2"
                    >
                      <Check className="h-4 w-4" />
                      Tout accepter
                    </button>
                    
                    <button
                      onClick={() => setShowSettings(true)}
                      className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      Personnaliser
                    </button>
                    
                    <button
                      onClick={handleRejectAll}
                      className="flex-1 border border-gray-300 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                    >
                      Refuser tout
                    </button>
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-4 text-center">
                    En continuant, vous acceptez notre{' '}
                    <a href="/confidentialite" className="text-blue-600 hover:underline">
                      politique de confidentialité
                    </a>{' '}
                    et{' '}
                    <a href="/cookies" className="text-blue-600 hover:underline">
                      politique des cookies
                    </a>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Vue détaillée des préférences */
            <div className="max-h-[80vh] overflow-y-auto">
              <div className="p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">
                    Préférences des cookies
                  </h3>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
                
                <p className="text-gray-600 mb-8">
                  Choisissez les types de cookies que vous acceptez. Vous pouvez modifier ces préférences à tout moment.
                </p>
                
                <div className="space-y-6">
                  {cookieTypes.map((cookieType, index) => (
                    <motion.div
                      key={cookieType.key}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`border rounded-xl p-6 ${
                        cookieType.required ? 'border-green-200 bg-green-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`flex-shrink-0 p-2 rounded-lg ${
                          cookieType.required ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          <cookieType.icon className={`h-5 w-5 ${
                            cookieType.required ? 'text-green-600' : 'text-gray-600'
                          }`} />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">
                              {cookieType.title}
                              {cookieType.required && (
                                <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                  Obligatoire
                                </span>
                              )}
                            </h4>
                            
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={preferences[cookieType.key]}
                                onChange={() => togglePreference(cookieType.key)}
                                disabled={cookieType.required}
                                className="sr-only peer"
                              />
                              <div className={`relative w-11 h-6 rounded-full transition-colors ${
                                preferences[cookieType.key] 
                                  ? 'bg-blue-600' 
                                  : 'bg-gray-200'
                              } ${cookieType.required ? 'opacity-50' : ''}`}>
                                <div className={`absolute top-[2px] left-[2px] bg-white border rounded-full h-5 w-5 transition-transform ${
                                  preferences[cookieType.key] ? 'translate-x-full' : ''
                                }`} />
                              </div>
                            </label>
                          </div>
                          
                          <p className="text-gray-600 text-sm mb-3">
                            {cookieType.description}
                          </p>
                          
                          <div className="text-xs text-gray-500">
                            <span className="font-medium">Exemples : </span>
                            {cookieType.examples.join(', ')}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t">
                  <button
                    onClick={handleSavePreferences}
                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-semibold"
                  >
                    Enregistrer mes préférences
                  </button>
                  
                  <button
                    onClick={handleAcceptAll}
                    className="flex-1 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors font-medium"
                  >
                    Tout accepter
                  </button>
                  
                  <button
                    onClick={handleRejectAll}
                    className="flex-1 border border-gray-300 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  >
                    Refuser tout
                  </button>
                </div>
                
                <div className="text-center mt-6">
                  <a 
                    href="/cookies" 
                    className="text-blue-600 hover:underline text-sm"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    📄 En savoir plus sur notre politique des cookies
                  </a>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Hook pour gérer les préférences cookies
export function useCookiePreferences() {
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    marketing: false,
    functional: false
  })

  useEffect(() => {
    const saved = localStorage.getItem('cookiePreferences')
    if (saved) {
      try {
        setPreferences(JSON.parse(saved))
      } catch (error) {
        console.error('Error parsing cookie preferences:', error)
      }
    }
  }, [])

  const updatePreferences = (newPreferences: CookiePreferences) => {
    setPreferences(newPreferences)
    localStorage.setItem('cookiePreferences', JSON.stringify(newPreferences))
    localStorage.setItem('cookieConsentDate', new Date().toISOString())
    
    // Ici vous pouvez ajouter la logique pour activer/désactiver les services
    // en fonction des préférences (Google Analytics, etc.)
  }

  const hasConsented = () => {
    return localStorage.getItem('cookieConsent') !== null
  }

  const getConsentDate = () => {
    const date = localStorage.getItem('cookieConsentDate')
    return date ? new Date(date) : null
  }

  const resetConsent = () => {
    localStorage.removeItem('cookieConsent')
    localStorage.removeItem('cookiePreferences')
    localStorage.removeItem('cookieConsentDate')
    setPreferences({
      essential: true,
      analytics: false,
      marketing: false,
      functional: false
    })
  }

  return {
    preferences,
    updatePreferences,
    hasConsented,
    getConsentDate,
    resetConsent
  }
}