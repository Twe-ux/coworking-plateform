'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface AccessibilityContextType {
  announce: (message: string, priority?: 'polite' | 'assertive') => void
  setFocus: (elementId: string) => void
  skipToContent: () => void
  currentFocus: string | null
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(
  null
)

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext)
  if (!context) {
    throw new Error(
      'useAccessibility must be used within AccessibilityProvider'
    )
  }
  return context
}

interface AccessibilityProviderProps {
  children: React.ReactNode
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({
  children,
}) => {
  const [announcements, setAnnouncements] = useState<
    { id: string; message: string; priority: 'polite' | 'assertive' }[]
  >([])
  const [currentFocus, setCurrentFocus] = useState<string | null>(null)
  const skipLinkRef = useRef<HTMLAnchorElement>(null)
  const mainContentRef = useRef<HTMLDivElement>(null)

  const announce = (
    message: string,
    priority: 'polite' | 'assertive' = 'polite'
  ) => {
    const id = Math.random().toString(36).substr(2, 9)
    setAnnouncements((prev) => [...prev, { id, message, priority }])

    // Remove announcement after it's been read
    setTimeout(() => {
      setAnnouncements((prev) => prev.filter((ann) => ann.id !== id))
    }, 1000)
  }

  const setFocus = (elementId: string) => {
    const element = document.getElementById(elementId)
    if (element) {
      element.focus()
      setCurrentFocus(elementId)
    }
  }

  const skipToContent = () => {
    if (mainContentRef.current) {
      mainContentRef.current.focus()
      mainContentRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Keyboard navigation handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip to content shortcut
      if (event.altKey && event.key === 's') {
        event.preventDefault()
        skipToContent()
        announce('Navigation vers le contenu principal')
      }

      // Help shortcut
      if (event.altKey && event.key === 'h') {
        event.preventDefault()
        announce(
          "Raccourcis disponibles: Alt+S pour aller au contenu, Alt+H pour l'aide",
          'assertive'
        )
      }

      // Escape to close modals or return to previous step
      if (event.key === 'Escape') {
        const activeElement = document.activeElement as HTMLElement
        if (activeElement && activeElement.closest('[role="dialog"]')) {
          // Let modal handle escape
          return
        }

        // Announce escape behavior
        announce('Touche Échap pressée')
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Focus management
  useEffect(() => {
    const handleFocusChange = () => {
      const activeElement = document.activeElement
      if (activeElement && activeElement.id) {
        setCurrentFocus(activeElement.id)
      }
    }

    document.addEventListener('focusin', handleFocusChange)
    return () => document.removeEventListener('focusin', handleFocusChange)
  }, [])

  return (
    <AccessibilityContext.Provider
      value={{ announce, setFocus, skipToContent, currentFocus }}
    >
      {/* Skip to content link */}
      <a
        ref={skipLinkRef}
        href="#main-content"
        className="focus:bg-coffee-primary focus:ring-coffee-primary/50 sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded focus:px-4 focus:py-2 focus:text-white focus:shadow-lg focus:ring-2 focus:outline-none"
        onClick={(e) => {
          e.preventDefault()
          skipToContent()
        }}
      >
        Aller au contenu principal
      </a>

      {/* Live region for announcements */}
      <div className="sr-only">
        {announcements.map((announcement) => (
          <div
            key={announcement.id}
            role="status"
            aria-live={announcement.priority}
            aria-atomic="true"
          >
            {announcement.message}
          </div>
        ))}
      </div>

      {/* Main content wrapper */}
      <div
        ref={mainContentRef}
        id="main-content"
        tabIndex={-1}
        className="outline-none"
      >
        {children}
      </div>

      {/* Keyboard shortcuts help */}
      <KeyboardShortcutsHelp />
    </AccessibilityContext.Provider>
  )
}

const KeyboardShortcutsHelp: React.FC = () => {
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && event.key === 'h') {
        event.preventDefault()
        setShowHelp(true)
      }
      if (event.key === 'Escape' && showHelp) {
        setShowHelp(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showHelp])

  return (
    <AnimatePresence>
      {showHelp && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setShowHelp(false)}
          />

          {/* Help modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-white p-6 shadow-xl"
            role="dialog"
            aria-labelledby="shortcuts-title"
            aria-describedby="shortcuts-description"
          >
            <div className="space-y-4">
              <div>
                <h3
                  id="shortcuts-title"
                  className="text-coffee-primary text-lg font-semibold"
                >
                  Raccourcis clavier
                </h3>
                <p id="shortcuts-description" className="text-sm text-gray-600">
                  Utilisez ces raccourcis pour naviguer plus facilement
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Alt + S</span>
                  <span className="text-sm text-gray-600">
                    Aller au contenu
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Alt + H</span>
                  <span className="text-sm text-gray-600">Afficher l'aide</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Échap</span>
                  <span className="text-sm text-gray-600">
                    Fermer les modales
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Tab</span>
                  <span className="text-sm text-gray-600">Navigation</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Entrée/Espace</span>
                  <span className="text-sm text-gray-600">Activer</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Flèches</span>
                  <span className="text-sm text-gray-600">
                    Navigation dans les groupes
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowHelp(false)}
                className="bg-coffee-primary hover:bg-coffee-primary/90 focus:ring-coffee-primary/50 w-full rounded-md px-4 py-2 text-white focus:ring-2 focus:outline-none"
                autoFocus
              >
                Fermer (Échap)
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Hook for form accessibility
export const useFormAccessibility = () => {
  const { announce } = useAccessibility()

  const announceError = (fieldName: string, error: string) => {
    announce(`Erreur sur le champ ${fieldName}: ${error}`, 'assertive')
  }

  const announceSuccess = (message: string) => {
    announce(message, 'polite')
  }

  const announceFieldChange = (fieldName: string, value: string) => {
    announce(`${fieldName} modifié: ${value}`, 'polite')
  }

  return { announceError, announceSuccess, announceFieldChange }
}

// Hook for step navigation accessibility
export const useStepAccessibility = () => {
  const { announce, setFocus } = useAccessibility()

  const announceStepChange = (
    currentStep: number,
    totalSteps: number,
    stepTitle: string
  ) => {
    announce(
      `Étape ${currentStep} sur ${totalSteps}: ${stepTitle}`,
      'assertive'
    )
  }

  const announceValidationError = (errors: string[]) => {
    const errorMessage = `${errors.length} erreur${errors.length > 1 ? 's' : ''} trouvée${errors.length > 1 ? 's' : ''}: ${errors.join(', ')}`
    announce(errorMessage, 'assertive')
  }

  const focusFirstError = () => {
    const errorElement = document.querySelector(
      '[aria-invalid="true"]'
    ) as HTMLElement
    if (errorElement) {
      errorElement.focus()
    }
  }

  return { announceStepChange, announceValidationError, focusFirstError }
}

export default AccessibilityProvider
