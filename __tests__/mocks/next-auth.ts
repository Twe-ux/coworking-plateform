/**
 * Mocks pour NextAuth.js
 * Simule les fonctions d'authentification pour les tests
 */

import { UserRole } from '@/types/auth'
import { vi } from 'vitest'

// Mock de la session par défaut
export const mockSession = {
  user: {
    id: '1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.CLIENT,
    permissions: ['client'],
    isActive: true,
  },
  csrfToken: 'mock-csrf-token',
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
}

// Mock de useSession
export const mockUseSession = vi.fn(() => ({
  data: mockSession,
  status: 'authenticated',
  update: vi.fn(),
}))

// Mock de signIn
export const mockSignIn = vi.fn().mockResolvedValue({
  ok: true,
  error: null,
  status: 200,
  url: 'http://localhost:3000/dashboard',
})

// Mock de signOut
export const mockSignOut = vi.fn().mockResolvedValue({
  url: 'http://localhost:3000',
})

// Mock de getSession
export const mockGetSession = vi.fn().mockResolvedValue(mockSession)

// Mock du provider SessionProvider
export const MockSessionProvider = ({ children, session }: any) => {
  return children
}

// Helper pour créer une session personnalisée
export const createMockSession = (overrides: any = {}) => ({
  ...mockSession,
  user: {
    ...mockSession.user,
    ...overrides.user,
  },
  ...overrides,
})

// Helper pour simuler différents états de session
export const sessionStates = {
  authenticated: (user: any = {}) => ({
    data: createMockSession({ user }),
    status: 'authenticated' as const,
    update: vi.fn(),
  }),
  unauthenticated: () => ({
    data: null,
    status: 'unauthenticated' as const,
    update: vi.fn(),
  }),
  loading: () => ({
    data: null,
    status: 'loading' as const,
    update: vi.fn(),
  }),
}

// Configuration des mocks pour différents rôles
export const userSessions = {
  admin: sessionStates.authenticated(global.testUser.admin),
  manager: sessionStates.authenticated(global.testUser.manager),
  staff: sessionStates.authenticated(global.testUser.staff),
  client: sessionStates.authenticated(global.testUser.client),
  inactive: sessionStates.authenticated(global.testUser.inactive),
  unauthenticated: sessionStates.unauthenticated(),
  loading: sessionStates.loading(),
}

// Mock de NextAuth
vi.mock('next-auth/react', () => ({
  useSession: mockUseSession,
  signIn: mockSignIn,
  signOut: mockSignOut,
  getSession: mockGetSession,
  SessionProvider: MockSessionProvider,
}))
