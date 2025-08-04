/**
 * Tests unitaires pour le hook useAuth
 * Teste toutes les fonctionnalités d'authentification et de gestion des sessions
 */

import { renderHook, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useAuth, useRequireRole, useRequireAuth } from '@/lib/hooks/use-auth'
import { UserRole } from '@/types/auth'
import { 
  AuthWrapper, 
  createTestSession, 
  mockUseSession, 
  createMockRouter,
  mockUsers
} from '../../utils/test-helpers'

// Mock des modules
jest.mock('next/navigation')
jest.mock('next-auth/react')

describe('useAuth Hook', () => {
  const mockPush = jest.fn()
  const mockRouter = createMockRouter({ push: mockPush })

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    
    // Mock de fetch pour CSRF token
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ csrfToken: 'test-csrf-token' }),
    })

    // Mock de document.querySelector pour CSRF meta tag
    const mockQuerySelector = jest.fn()
    Object.defineProperty(document, 'querySelector', {
      value: mockQuerySelector,
      configurable: true,
    })
  })

  describe('État d\'authentification', () => {
    it('devrait retourner un état non authentifié quand il n\'y a pas de session', () => {
      mockUseSession(null, 'unauthenticated')

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <AuthWrapper session={null}>{children}</AuthWrapper>
      })

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.user).toBeNull()
    })

    it('devrait retourner un état de chargement pendant la résolution de session', () => {
      mockUseSession(null, 'loading')

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <AuthWrapper session={null}>{children}</AuthWrapper>
      })

      expect(result.current.isLoading).toBe(true)
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('devrait retourner un état authentifié avec les données utilisateur', () => {
      const session = createTestSession('client')
      mockUseSession(session, 'authenticated')

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <AuthWrapper session={session}>{children}</AuthWrapper>
      })

      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.user).toEqual(session.user)
    })

    it('ne devrait pas être authentifié si l\'utilisateur est inactif', () => {
      const session = createTestSession('inactive')
      mockUseSession(session, 'authenticated')

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <AuthWrapper session={session}>{children}</AuthWrapper>
      })

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toEqual(session.user)
    })
  })

  describe('Gestion du token CSRF', () => {
    it('devrait récupérer le token CSRF depuis la session', () => {
      const session = createTestSession('client')
      mockUseSession(session, 'authenticated')

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <AuthWrapper session={session}>{children}</AuthWrapper>
      })

      expect(result.current.csrfToken).toBe(session.csrfToken)
    })

    it('devrait récupérer le token CSRF depuis les meta tags', async () => {
      const session = createTestSession('client')
      // Session sans CSRF token
      const sessionWithoutCSRF = { ...session, csrfToken: undefined }
      mockUseSession(sessionWithoutCSRF, 'authenticated')

      const mockQuerySelector = document.querySelector as jest.Mock
      mockQuerySelector.mockReturnValue({
        getAttribute: jest.fn().mockReturnValue('meta-csrf-token')
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <AuthWrapper session={sessionWithoutCSRF}>{children}</AuthWrapper>
      })

      await waitFor(() => {
        expect(result.current.csrfToken).toBe('meta-csrf-token')
      })
    })

    it('devrait récupérer le token CSRF depuis l\'API si pas dans les meta tags', async () => {
      const session = createTestSession('client')
      const sessionWithoutCSRF = { ...session, csrfToken: undefined }
      mockUseSession(sessionWithoutCSRF, 'authenticated')

      const mockQuerySelector = document.querySelector as jest.Mock
      mockQuerySelector.mockReturnValue(null)

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <AuthWrapper session={sessionWithoutCSRF}>{children}</AuthWrapper>
      })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/csrf')
        expect(result.current.csrfToken).toBe('test-csrf-token')
      })
    })
  })

  describe('Vérifications de rôles', () => {
    it('devrait correctement vérifier les rôles hiérarchiques', () => {
      const session = createTestSession('admin')
      mockUseSession(session, 'authenticated')

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <AuthWrapper session={session}>{children}</AuthWrapper>
      })

      expect(result.current.hasRole(UserRole.ADMIN)).toBe(true)
      expect(result.current.hasRole(UserRole.MANAGER)).toBe(true)
      expect(result.current.hasRole(UserRole.STAFF)).toBe(true)
      expect(result.current.hasRole(UserRole.CLIENT)).toBe(true)
    })

    it('devrait correctement limiter les rôles pour un manager', () => {
      const session = createTestSession('manager')
      mockUseSession(session, 'authenticated')

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <AuthWrapper session={session}>{children}</AuthWrapper>
      })

      expect(result.current.hasRole(UserRole.ADMIN)).toBe(false)
      expect(result.current.hasRole(UserRole.MANAGER)).toBe(true)
      expect(result.current.hasRole(UserRole.STAFF)).toBe(true)
      expect(result.current.hasRole(UserRole.CLIENT)).toBe(true)
    })

    it('devrait retourner false pour les rôles quand non authentifié', () => {
      mockUseSession(null, 'unauthenticated')

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <AuthWrapper session={null}>{children}</AuthWrapper>
      })

      expect(result.current.hasRole(UserRole.CLIENT)).toBe(false)
      expect(result.current.hasRole(UserRole.ADMIN)).toBe(false)
    })
  })

  describe('Vérifications de permissions', () => {
    it('devrait vérifier les permissions de l\'utilisateur', () => {
      const session = createTestSession('admin')
      mockUseSession(session, 'authenticated')

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <AuthWrapper session={session}>{children}</AuthWrapper>
      })

      expect(result.current.hasPermission('admin:read')).toBe(true)
      expect(result.current.hasPermission('admin:write')).toBe(true)
      expect(result.current.hasPermission('nonexistent:permission')).toBe(false)
    })

    it('devrait retourner false pour les permissions quand non authentifié', () => {
      mockUseSession(null, 'unauthenticated')

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <AuthWrapper session={null}>{children}</AuthWrapper>
      })

      expect(result.current.hasPermission('admin:read')).toBe(false)
    })
  })

  describe('Accès aux routes', () => {
    it('devrait vérifier l\'accès aux routes basé sur le rôle', () => {
      const session = createTestSession('admin')
      mockUseSession(session, 'authenticated')

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <AuthWrapper session={session}>{children}</AuthWrapper>
      })

      expect(result.current.hasRouteAccess('/dashboard/admin')).toBe(true)
      expect(result.current.hasRouteAccess('/dashboard/manager')).toBe(true)
      expect(result.current.hasRouteAccess('/dashboard/client')).toBe(true)
    })

    it('devrait refuser l\'accès aux routes non autorisées', () => {
      const session = createTestSession('client')
      mockUseSession(session, 'authenticated')

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <AuthWrapper session={session}>{children}</AuthWrapper>
      })

      expect(result.current.hasRouteAccess('/dashboard/admin')).toBe(false)
      expect(result.current.hasRouteAccess('/dashboard/manager')).toBe(false)
      expect(result.current.hasRouteAccess('/dashboard/client')).toBe(true)
    })
  })

  describe('Actions de redirection', () => {
    it('devrait rediriger vers login quand requireAuth appelé sans authentification', () => {
      mockUseSession(null, 'unauthenticated')

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <AuthWrapper session={null}>{children}</AuthWrapper>
      })

      result.current.requireAuth()

      expect(mockPush).toHaveBeenCalledWith('/auth/login')
    })

    it('ne devrait pas rediriger quand requireAuth appelé avec authentification', () => {
      const session = createTestSession('client')
      mockUseSession(session, 'authenticated')

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <AuthWrapper session={session}>{children}</AuthWrapper>
      })

      result.current.requireAuth()

      expect(mockPush).not.toHaveBeenCalled()
    })

    it('devrait rediriger vers login quand requireRole appelé sans authentification', () => {
      mockUseSession(null, 'unauthenticated')

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <AuthWrapper session={null}>{children}</AuthWrapper>
      })

      result.current.requireRole(UserRole.ADMIN)

      expect(mockPush).toHaveBeenCalledWith('/auth/login')
    })

    it('devrait rediriger vers dashboard approprié quand requireRole appelé avec rôle insuffisant', () => {
      const session = createTestSession('client')
      mockUseSession(session, 'authenticated')

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <AuthWrapper session={session}>{children}</AuthWrapper>
      })

      result.current.requireRole(UserRole.ADMIN)

      expect(mockPush).toHaveBeenCalledWith('/dashboard/client')
    })

    it('devrait rediriger vers le dashboard approprié selon le rôle', () => {
      const session = createTestSession('admin')
      mockUseSession(session, 'authenticated')

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <AuthWrapper session={session}>{children}</AuthWrapper>
      })

      result.current.redirectToDashboard()

      expect(mockPush).toHaveBeenCalledWith('/dashboard/admin')
    })

    it('devrait rediriger vers login si pas d\'utilisateur lors de redirectToDashboard', () => {
      mockUseSession(null, 'unauthenticated')

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <AuthWrapper session={null}>{children}</AuthWrapper>
      })

      result.current.redirectToDashboard()

      expect(mockPush).toHaveBeenCalledWith('/auth/login')
    })
  })
})

describe('useRequireRole Hook', () => {
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
  })

  it('devrait rediriger si l\'utilisateur n\'a pas le rôle requis', async () => {
    const session = createTestSession('client')
    mockUseSession(session, 'authenticated')

    renderHook(() => useRequireRole(UserRole.ADMIN), {
      wrapper: ({ children }) => <AuthWrapper session={session}>{children}</AuthWrapper>
    })

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard/client')
    })
  })

  it('ne devrait pas rediriger si l\'utilisateur a le rôle requis', async () => {
    const session = createTestSession('admin')
    mockUseSession(session, 'authenticated')

    renderHook(() => useRequireRole(UserRole.ADMIN), {
      wrapper: ({ children }) => <AuthWrapper session={session}>{children}</AuthWrapper>
    })

    await waitFor(() => {
      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  it('ne devrait pas rediriger pendant le chargement', () => {
    mockUseSession(null, 'loading')

    renderHook(() => useRequireRole(UserRole.ADMIN), {
      wrapper: ({ children }) => <AuthWrapper session={null}>{children}</AuthWrapper>
    })

    expect(mockPush).not.toHaveBeenCalled()
  })
})

describe('useRequireAuth Hook', () => {
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
  })

  it('devrait rediriger vers login si non authentifié', async () => {
    mockUseSession(null, 'unauthenticated')

    renderHook(() => useRequireAuth(), {
      wrapper: ({ children }) => <AuthWrapper session={null}>{children}</AuthWrapper>
    })

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/auth/login')
    })
  })

  it('ne devrait pas rediriger si authentifié', async () => {
    const session = createTestSession('client')
    mockUseSession(session, 'authenticated')

    renderHook(() => useRequireAuth(), {
      wrapper: ({ children }) => <AuthWrapper session={session}>{children}</AuthWrapper>
    })

    await waitFor(() => {
      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  it('ne devrait pas rediriger pendant le chargement', () => {
    mockUseSession(null, 'loading')

    renderHook(() => useRequireAuth(), {
      wrapper: ({ children }) => <AuthWrapper session={null}>{children}</AuthWrapper>
    })

    expect(mockPush).not.toHaveBeenCalled()
  })
})

describe('Gestion des erreurs', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({ push: jest.fn() })
  })

  it('devrait gérer les erreurs lors de la récupération du token CSRF', async () => {
    const session = createTestSession('client')
    const sessionWithoutCSRF = { ...session, csrfToken: undefined }
    mockUseSession(sessionWithoutCSRF, 'authenticated')

    const mockQuerySelector = document.querySelector as jest.Mock
    mockQuerySelector.mockReturnValue(null)

    // Mock fetch qui échoue
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))

    const consoleError = jest.spyOn(console, 'error').mockImplementation()

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthWrapper session={sessionWithoutCSRF}>{children}</AuthWrapper>
    })

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalled()
    })

    expect(result.current.csrfToken).toBeNull()

    consoleError.mockRestore()
  })
})