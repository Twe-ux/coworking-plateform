'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Settings, Save, RotateCcw, Check, X, Cookie, Shield, BarChart3, Target } from 'lucide-react'

export interface CookiePreferences {
  essential: boolean
  analytics: boolean
  marketing: boolean
  functional: boolean
}

export function CookiePreferencesManager() {
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true, // Toujours true
    analytics: false,
    marketing: false,
    functional: false
  })
  
  const [hasChanges, setHasChanges] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  useEffect(() => {
    // Charger les préférences sauvegardées
    const saved = localStorage.getItem('cookiePreferences')
    if (saved) {
      try {
        const parsedPreferences = JSON.parse(saved)
        setPreferences(parsedPreferences)
      } catch (error) {
        console.error('Error parsing saved preferences:', error)
      }
    }

    // Charger la date de dernière sauvegarde
    const savedDate = localStorage.getItem('cookieConsentDate')
    if (savedDate) {
      setLastSaved(new Date(savedDate))
    }
  }, [])

  const cookieCategories = [
    {
      key: 'essential' as keyof CookiePreferences,
      title: 'Cookies essentiels',
      description: 'Indispensables au fonctionnement du site',
      icon: Shield,
      color: 'green',
      required: true,
      details: [
        'Authentification et session utilisateur',
        'Panier de réservation et processus de commande',
        'Sécurité et protection contre les attaques',
        'Préférences de langue et navigation'
      ],
      examples: ['next-auth.session-token', 'reservation-cart', 'csrf-token']
    },
    {
      key: 'functional' as keyof CookiePreferences,
      title: 'Cookies fonctionnels',
      description: 'Améliorent votre expérience utilisateur',
      icon: Settings,
      color: 'blue',
      required: false,
      details: [
        'Mémorisation de vos préférences d\'affichage',
        'Thème sombre/clair et personnalisation',
        'Réglages d\'accessibilité',
        'Filtres et tri personnalisés'
      ],
      examples: ['user-preferences', 'theme-choice', 'display-settings']
    },
    {
      key: 'analytics' as keyof CookiePreferences,
      title: 'Cookies analytiques',
      description: 'Nous aident à améliorer le site',
      icon: BarChart3,
      color: 'purple',
      required: false,
      details: [
        'Statistiques de visite anonymisées',
        'Analyse des pages les plus consultées',
        'Mesure de performance et temps de chargement',
        'Identification des problèmes techniques'
      ],
      examples: ['_ga', '_ga_*', 'analytics-session']
    },
    {
      key: 'marketing' as keyof CookiePreferences,
      title: 'Cookies marketing',
      description: 'Personnalisent la publicité',
      icon: Target,
      color: 'orange',
      required: false,
      details: [
        'Publicités ciblées et pertinentes',
        'Mesure d\'efficacité des campagnes',
        'Intégrations réseaux sociaux',
        'Remarketing et retargeting'
      ],
      examples: ['_fbp', 'google-ads', 'social-widgets']
    }
  ]

  const getColorClasses = (color: string, type: 'bg' | 'text' | 'border' | 'hover') => {
    const colorMap = {
      green: {
        bg: 'bg-green-50',
        text: 'text-green-600',
        border: 'border-green-200',
        hover: 'hover:bg-green-100'
      },
      blue: {
        bg: 'bg-blue-50',
        text: 'text-blue-600',
        border: 'border-blue-200',
        hover: 'hover:bg-blue-100'
      },
      purple: {
        bg: 'bg-purple-50',
        text: 'text-purple-600',
        border: 'border-purple-200',
        hover: 'hover:bg-purple-100'
      },
      orange: {
        bg: 'bg-orange-50',
        text: 'text-orange-600',
        border: 'border-orange-200',
        hover: 'hover:bg-orange-100'
      }
    }
    return colorMap[color as keyof typeof colorMap]?.[type] || ''
  }

  const togglePreference = (key: keyof CookiePreferences) => {
    if (key === 'essential') return // Ne peut pas être désactivé

    setPreferences(prev => {
      const newPreferences = { ...prev, [key]: !prev[key] }
      setHasChanges(true)
      return newPreferences
    })
  }

  const handleSave = async () => {
    setSaveStatus('saving')
    
    try {
      // Simulation d'une sauvegarde (délai)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Sauvegarder dans localStorage
      localStorage.setItem('cookiePreferences', JSON.stringify(preferences))
      localStorage.setItem('cookieConsent', 'customized')
      localStorage.setItem('cookieConsentDate', new Date().toISOString())
      
      setLastSaved(new Date())
      setHasChanges(false)
      setSaveStatus('saved')
      
      // Reset du statut après 3 secondes
      setTimeout(() => setSaveStatus('idle'), 3000)
      
    } catch (error) {
      console.error('Error saving preferences:', error)
      setSaveStatus('idle')
    }
  }

  const handleReset = () => {
    setPreferences({
      essential: true,
      analytics: false,
      marketing: false,
      functional: false
    })
    setHasChanges(true)
  }

  const acceptAll = () => {
    setPreferences({
      essential: true,
      analytics: true,
      marketing: true,
      functional: true
    })
    setHasChanges(true)
  }

  const rejectOptional = () => {
    setPreferences({
      essential: true,
      analytics: false,
      marketing: false,
      functional: false
    })
    setHasChanges(true)
  }

  const getActiveCount = () => {
    return Object.values(preferences).filter(Boolean).length
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Cookie className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Gestionnaire de préférences
            </h3>
            <p className="text-gray-600 text-sm">
              {getActiveCount()} sur {cookieCategories.length} catégories activées
            </p>
          </div>
        </div>
        
        {lastSaved && (
          <div className="text-sm text-gray-500">
            Dernière mise à jour : {lastSaved.toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        )}
      </div>

      <div className="space-y-6 mb-8">
        {cookieCategories.map((category, index) => (
          <motion.div
            key={category.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`border rounded-xl p-6 transition-all duration-200 ${
              getColorClasses(category.color, 'bg')
            } ${
              getColorClasses(category.color, 'border')
            } ${
              category.required ? 'opacity-90' : 'cursor-pointer'
            } ${
              !category.required ? getColorClasses(category.color, 'hover') : ''
            }`}
            onClick={() => !category.required && togglePreference(category.key)}
          >
            <div className="flex items-start gap-4">
              <div className={`flex-shrink-0 p-2 rounded-lg ${
                category.required ? 'bg-green-100' : 'bg-white'
              }`}>
                <category.icon className={`h-5 w-5 ${
                  category.required ? 'text-green-600' : getColorClasses(category.color, 'text')
                }`} />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      {category.title}
                      {category.required && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          Obligatoire
                        </span>
                      )}
                    </h4>
                    <p className="text-gray-600 text-sm">
                      {category.description}
                    </p>
                  </div>
                  
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences[category.key]}
                      onChange={() => togglePreference(category.key)}
                      disabled={category.required}
                      className="sr-only peer"
                    />
                    <div className={`relative w-11 h-6 rounded-full transition-colors ${
                      preferences[category.key] 
                        ? 'bg-blue-600' 
                        : 'bg-gray-200'
                    } ${category.required ? 'opacity-50' : ''}`}>
                      <div className={`absolute top-[2px] left-[2px] bg-white border rounded-full h-5 w-5 transition-transform flex items-center justify-center ${
                        preferences[category.key] ? 'translate-x-full' : ''
                      }`}>
                        {preferences[category.key] && (
                          <Check className="h-3 w-3 text-blue-600" />
                        )}
                      </div>
                    </div>
                  </label>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <h5 className="text-sm font-medium text-gray-800 mb-2">
                      Utilisé pour :
                    </h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {category.details.map((detail, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <div className="w-1 h-1 bg-gray-400 rounded-full flex-shrink-0 mt-2" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="bg-white/50 rounded-lg p-3">
                    <h5 className="text-xs font-medium text-gray-700 mb-1">
                      Exemples de cookies :
                    </h5>
                    <div className="flex flex-wrap gap-1">
                      {category.examples.map((example, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2 py-1 text-xs font-mono bg-gray-100 text-gray-600 rounded"
                        >
                          {example}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Actions rapides */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <button
          onClick={acceptAll}
          className="flex-1 bg-green-600 text-white px-4 py-3 rounded-xl hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
        >
          <Check className="h-4 w-4" />
          Tout accepter
        </button>
        
        <button
          onClick={rejectOptional}
          className="flex-1 bg-gray-600 text-white px-4 py-3 rounded-xl hover:bg-gray-700 transition-colors font-medium flex items-center justify-center gap-2"
        >
          <X className="h-4 w-4" />
          Rejeter optionnels
        </button>
        
        <button
          onClick={handleReset}
          className="flex-1 border border-gray-300 text-gray-700 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Réinitialiser
        </button>
      </div>

      {/* Bouton de sauvegarde */}
      <motion.button
        onClick={handleSave}
        disabled={!hasChanges || saveStatus === 'saving'}
        className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-3 ${
          !hasChanges
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
            : saveStatus === 'saving'
            ? 'bg-blue-400 text-white cursor-wait'
            : saveStatus === 'saved'
            ? 'bg-green-600 text-white'
            : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg transform hover:scale-[1.02]'
        }`}
        whileHover={hasChanges && saveStatus === 'idle' ? { scale: 1.02 } : {}}
        whileTap={hasChanges && saveStatus === 'idle' ? { scale: 0.98 } : {}}
      >
        {saveStatus === 'saving' ? (
          <>
            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
            Sauvegarde en cours...
          </>
        ) : saveStatus === 'saved' ? (
          <>
            <Check className="h-5 w-5" />
            Préférences sauvegardées
          </>
        ) : (
          <>
            <Save className="h-5 w-5" />
            {hasChanges ? 'Sauvegarder mes préférences' : 'Aucun changement à sauvegarder'}
          </>
        )}
      </motion.button>

      {/* Informations supplémentaires */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <h4 className="font-semibold text-blue-900 mb-2">
          💡 Bon à savoir
        </h4>
        <ul className="text-blue-800 text-sm space-y-1">
          <li>• Vous pouvez modifier ces préférences à tout moment</li>
          <li>• Les cookies essentiels ne peuvent pas être désactivés</li>
          <li>• Vos choix sont conservés pendant 13 mois maximum</li>
          <li>• Supprimez vos cookies navigateur pour réinitialiser</li>
        </ul>
      </div>
    </div>
  )
}