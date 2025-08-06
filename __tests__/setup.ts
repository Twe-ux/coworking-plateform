/**
 * Configuration globale des tests
 * Setup de l'environnement de test avec mocks et utilitaires
 */

import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, beforeEach, vi } from 'vitest'
import { server } from './mocks/msw-server'

// Configuration de l'environnement de test
beforeAll(() => {
  // Démarrer le serveur MSW
  server.listen({ onUnhandledRequest: 'error' })

  // Variables d'environnement pour les tests
  process.env.NODE_ENV = 'test'
  process.env.NEXTAUTH_URL = 'http://localhost:3000'
  process.env.NEXTAUTH_SECRET = 'test-secret-key'
  process.env.MONGODB_URI = 'mongodb://localhost:27017/test-coworking'

  // Mock du router Next.js
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })

  // Mock des modules externes problématiques
  vi.mock('framer-motion', () => ({
    motion: new Proxy(
      {},
      {
        get: (target, prop) => {
          if (prop === 'div') {
            const DivComponent = ({ children, ...props }: any) =>
              React.createElement('div', props, children)
            DivComponent.displayName = 'MotionDiv'
            return DivComponent
          }
          if (prop === 'button') {
            const ButtonComponent = ({ children, ...props }: any) =>
              React.createElement('button', props, children)
            ButtonComponent.displayName = 'MotionButton'
            return ButtonComponent
          }
          return ({ children, ...props }: any) =>
            React.createElement('div', props, children)
        },
      }
    ),
    AnimatePresence: ({ children }: any) => children,
  }))
})

beforeEach(() => {
  // Reset tous les mocks avant chaque test
  vi.clearAllMocks()
})

afterEach(() => {
  // Nettoyer après chaque test
  cleanup()
  server.resetHandlers()
})

// Cleanup global après tous les tests
afterAll(() => {
  server.close()
})

// Utilitaires de test globaux
global.testUser = {
  admin: {
    id: '1',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    permissions: ['admin', 'manager', 'staff', 'client'],
    isActive: true,
  },
  manager: {
    id: '2',
    email: 'manager@example.com',
    firstName: 'Manager',
    lastName: 'User',
    role: 'manager',
    permissions: ['manager', 'staff', 'client'],
    isActive: true,
  },
  staff: {
    id: '3',
    email: 'staff@example.com',
    firstName: 'Staff',
    lastName: 'User',
    role: 'staff',
    permissions: ['staff', 'client'],
    isActive: true,
  },
  client: {
    id: '4',
    email: 'client@example.com',
    firstName: 'Client',
    lastName: 'User',
    role: 'client',
    permissions: ['client'],
    isActive: true,
  },
  inactive: {
    id: '5',
    email: 'inactive@example.com',
    firstName: 'Inactive',
    lastName: 'User',
    role: 'client',
    permissions: ['client'],
    isActive: false,
  },
}

// Extend expect matchers pour des tests plus spécifiques
expect.extend({
  toBeInTheDOM: (received) => {
    const pass = received && document.contains(received)
    return {
      pass,
      message: () =>
        pass
          ? `Expected element not to be in the DOM`
          : `Expected element to be in the DOM`,
    }
  },
})

declare global {
  var testUser: {
    admin: any
    manager: any
    staff: any
    client: any
    inactive: any
  }

  namespace Vi {
    interface Assertion {
      toBeInTheDOM(): void
    }
  }
}
