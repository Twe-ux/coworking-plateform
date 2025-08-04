/**
 * Configuration Jest pour les tests d'authentification
 * Setup global pour tous les tests de l'application
 */

import '@testing-library/jest-dom'
import { server } from '../mocks/msw-server'
import { configure } from '@testing-library/react'

// Configuration de React Testing Library
configure({
  testIdAttribute: 'data-testid',
  // Augmente le timeout pour les tests asynchrones
  asyncUtilTimeout: 5000,
})

// Variables d'environnement pour les tests
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-jwt-signing'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.NODE_ENV = 'test'

// Mock de next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  })),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  usePathname: jest.fn(() => '/'),
  useParams: jest.fn(() => ({})),
  notFound: jest.fn(),
  redirect: jest.fn(),
}))

// Mock de next-auth/react
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated',
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(),
}))

// Mock de next-auth pour les tests côté serveur
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

// Mock de next-auth/jwt
jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(),
}))

// Mock du module crypto pour les tests
Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: jest.fn(() => 'test-uuid-1234'),
    randomBytes: jest.fn((size: number) => ({
      toString: jest.fn(() => 'test-random-string'),
    })),
    timingSafeEqual: jest.fn(() => true),
  },
})

// Mock de fetch pour les tests
global.fetch = jest.fn()

// Mock de console pour éviter les logs pendant les tests
const originalConsole = { ...console }
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}

// Setup MSW
beforeAll(() => {
  server.listen({
    onUnhandledRequest: 'error',
  })
})

afterEach(() => {
  server.resetHandlers()
  jest.clearAllMocks()
  // Reset console
  global.console = originalConsole
})

afterAll(() => {
  server.close()
})

// Mock des variables d'environnement Next.js
process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = JSON.stringify({})

// Mock de window.location pour les tests de redirection
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: '',
    assign: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
  },
  writable: true,
})

// Mock de window.history
Object.defineProperty(window, 'history', {
  value: {
    pushState: jest.fn(),
    replaceState: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    go: jest.fn(),
    length: 1,
    state: null,
  },
  writable: true,
})

// Mock de document.cookie
Object.defineProperty(document, 'cookie', {
  writable: true,
  value: '',
})

// Mock de localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock de sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
})

// Mock de ResizeObserver pour les composants UI
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock de IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
}))

// Helpers globaux pour les tests
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveAuthRedirect(): R
      toHaveCSRFToken(): R
      toHaveSecurityHeaders(): R
    }
  }
}

// Matchers Jest personnalisés pour l'authentification
expect.extend({
  toHaveAuthRedirect(received: any) {
    const pass = received?.headers?.get?.('location')?.includes('/auth/login') || 
                 received?.url?.includes('/auth/login')
    
    return {
      pass,
      message: () => 
        pass 
          ? `Expected not to have auth redirect`
          : `Expected to have auth redirect to /auth/login`,
    }
  },

  toHaveCSRFToken(received: any) {
    const pass = received?.headers?.get?.('x-csrf-token') ||
                 received?.headers?.['x-csrf-token']
    
    return {
      pass: !!pass,
      message: () => 
        pass 
          ? `Expected not to have CSRF token`
          : `Expected to have CSRF token in headers`,
    }
  },

  toHaveSecurityHeaders(received: any) {
    const headers = received?.headers || {}
    const requiredHeaders = [
      'x-frame-options',
      'x-content-type-options',
      'x-xss-protection',
      'content-security-policy'
    ]
    
    const missingHeaders = requiredHeaders.filter(header => 
      !headers.get?.(header) && !headers[header]
    )
    
    const pass = missingHeaders.length === 0
    
    return {
      pass,
      message: () => 
        pass 
          ? `Expected not to have all security headers`
          : `Expected to have security headers. Missing: ${missingHeaders.join(', ')}`,
    }
  },
})