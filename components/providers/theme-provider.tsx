'use client'

import { createContext, useContext, useEffect, ReactNode } from 'react'

type Theme = 'light'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// Hook sécurisé qui ne lance pas d'erreur - toujours en thème clair
export function useThemeSafe() {
  const context = useContext(ThemeContext)
  return context || { theme: 'light' as Theme, toggleTheme: () => {} }
}

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  // Thème fixe pour le café coworking - ambiance chaleureuse
  const theme: Theme = 'light'
  
  useEffect(() => {
    // S'assurer que le thème sombre n'est jamais appliqué
    document.documentElement.classList.remove('dark')
    // Nettoyer le localStorage des anciens thèmes
    localStorage.removeItem('theme')
  }, [])

  const toggleTheme = () => {
    // Ne fait rien - le thème est fixe
    console.log('Theme toggle désactivé - thème café fixe')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}