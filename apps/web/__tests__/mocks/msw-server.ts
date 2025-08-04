/**
 * Mock Service Worker (MSW) server pour les tests
 * Intercepte les appels API et fournit des réponses mockées
 */

import { setupServer } from 'msw/node'
import { handlers } from './auth-handlers'

// Configuration du serveur MSW avec les handlers d'authentification
export const server = setupServer(...handlers)

// Helper pour ajouter des handlers dynamiquement dans les tests
export const addHandler = (...newHandlers: any[]) => {
  server.use(...newHandlers)
}

// Helper pour réinitialiser les handlers
export const resetHandlers = () => {
  server.resetHandlers(...handlers)
}