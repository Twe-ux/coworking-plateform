/**
 * Tests unitaires pour le hook useAuth
 * Couvre tous les cas d'usage et états d'authentification
 */

import { renderHook, act } from '@testing-library/react'
import { useAuth, useRequireAuth, useRequireRole } from '@/lib/hooks/use-auth'
import { UserRole } from '@/types/auth'
import {
  MockSessionProvider,
  userSessions,
  mockUseSession,
  createMockSession,
} from '../mocks/next-auth'
import { mockRouter } from '../mocks/next-router'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

// Wrapper pour les hooks avec session
const createHookWrapper = (session: any) => {
  const HookWrapper = ({ children }: { children: React.ReactNode }) => (
    <MockSessionProvider session={session}>{children}</MockSessionProvider>
  )
  HookWrapper.displayName = 'HookWrapper'
  return HookWrapper
}

describe('useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe("États d'authentification", () => {
    it('devrait retourner isLoading=true pendant le chargement', () => {
      mockUseSession.mockReturnValue(userSessions.loading)

      const { result } = renderHook(() => useAuth(), {
        wrapper: createHookWrapper(null),
      })

      expect(result.current.isLoading).toBe(true)
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBeNull()
    })

    it('devrait retourner isAuthenticated=false si non connecté', () => {
      mockUseSession.mockReturnValue(userSessions.unauthenticated)

      const { result } = renderHook(() => useAuth(), {
        wrapper: createHookWrapper(null),
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBeNull()
    })

    it('devrait retourner les données utilisateur si connecté et actif', () => {
      mockUseSession.mockReturnValue(userSessions.client)

      const { result } = renderHook(() => useAuth(), {
        wrapper: createHookWrapper(userSessions.client.data),
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.user).toEqual({
        id: global.testUser.client.id,
        email: global.testUser.client.email,
        firstName: global.testUser.client.firstName,
        lastName: global.testUser.client.lastName,
        role: global.testUser.client.role,
        permissions: global.testUser.client.permissions,
        isActive: global.testUser.client.isActive,
      })
    })

    it('devrait retourner isAuthenticated=false si utilisateur inactif', () => {
      mockUseSession.mockReturnValue(userSessions.inactive)

      const { result } = renderHook(() => useAuth(), {
        wrapper: createHookWrapper(userSessions.inactive.data),
      })

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user?.isActive).toBe(false)
    })
  })

  describe('Vérification des rôles', () => {
    it('devrait vérifier correctement les rôles avec hasRole', () => {
      mockUseSession.mockReturnValue(userSessions.admin)

      const { result } = renderHook(() => useAuth(), {
        wrapper: createHookWrapper(userSessions.admin.data),
      })

      expect(result.current.hasRole(UserRole.ADMIN)).toBe(true)
      expect(result.current.hasRole(UserRole.MANAGER)).toBe(true)
      expect(result.current.hasRole(UserRole.STAFF)).toBe(true)
      expect(result.current.hasRole(UserRole.CLIENT)).toBe(true)
    })

    it('devrait respecter la hiérarchie des rôles', () => {
      mockUseSession.mockReturnValue(userSessions.staff)

      const { result } = renderHook(() => useAuth(), {
        wrapper: createHookWrapper(userSessions.staff.data),
      })

      expect(result.current.hasRole(UserRole.ADMIN)).toBe(false)
      expect(result.current.hasRole(UserRole.MANAGER)).toBe(false)
      expect(result.current.hasRole(UserRole.STAFF)).toBe(true)
      expect(result.current.hasRole(UserRole.CLIENT)).toBe(true)
    })

    it('devrait retourner false si non authentifié', () => {
      mockUseSession.mockReturnValue(userSessions.unauthenticated)

      const { result } = renderHook(() => useAuth(), {
        wrapper: createHookWrapper(null),
      })

      expect(result.current.hasRole(UserRole.CLIENT)).toBe(false)
    })
  })

  describe('Vérification des permissions', () => {
    it('devrait vérifier correctement les permissions avec hasPermission', () => {
      mockUseSession.mockReturnValue(userSessions.manager)

      const { result } = renderHook(() => useAuth(), {
        wrapper: createHookWrapper(userSessions.manager.data),
      })

      expect(result.current.hasPermission('manager')).toBe(true)
      expect(result.current.hasPermission('staff')).toBe(true)
      expect(result.current.hasPermission('client')).toBe(true)
      expect(result.current.hasPermission('admin')).toBe(false)
    })

    it('devrait retourner false si non authentifié', () => {
      mockUseSession.mockReturnValue(userSessions.unauthenticated)

      const { result } = renderHook(() => useAuth(), {
        wrapper: createHookWrapper(null),
      })

      expect(result.current.hasPermission('client')).toBe(false)
    })
  })

  describe("Vérification d'accès aux routes", () => {
    it("devrait vérifier l'accès aux routes selon le rôle", () => {
      mockUseSession.mockReturnValue(userSessions.manager)

      const { result } = renderHook(() => useAuth(), {
        wrapper: createHookWrapper(userSessions.manager.data),
      })

      expect(result.current.hasRouteAccess('/dashboard/manager')).toBe(true)
      expect(result.current.hasRouteAccess('/dashboard/staff')).toBe(true)
      expect(result.current.hasRouteAccess('/dashboard/client')).toBe(true)
      expect(result.current.hasRouteAccess('/dashboard/admin')).toBe(false)
    })
  })

  describe('Actions de navigation', () => {
    it('devrait rediriger vers login avec requireAuth si non authentifié', () => {
      mockUseSession.mockReturnValue(userSessions.unauthenticated)

      const { result } = renderHook(() => useAuth(), {
        wrapper: createHookWrapper(null),
      })

      act(() => {
        result.current.requireAuth()
      })

      expect(mockRouter.push).toHaveBeenCalledWith('/login')
    })

    it('devrait rediriger vers login avec requireRole si non authentifié', () => {
      mockUseSession.mockReturnValue(userSessions.unauthenticated)

      const { result } = renderHook(() => useAuth(), {
        wrapper: createHookWrapper(null),
      })

      act(() => {
        result.current.requireRole(UserRole.MANAGER)
      })

      expect(mockRouter.push).toHaveBeenCalledWith('/login')
    })

    it('devrait rediriger vers dashboard approprié si rôle insuffisant', () => {
      mockUseSession.mockReturnValue(userSessions.staff)

      const { result } = renderHook(() => useAuth(), {
        wrapper: createHookWrapper(userSessions.staff.data),
      })

      act(() => {
        result.current.requireRole(UserRole.ADMIN)
      })

      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard/staff')
    })

    it('devrait rediriger vers le bon dashboard selon le rôle', () => {
      const testCases = [
        { session: userSessions.admin, expectedPath: '/dashboard/admin' },
        { session: userSessions.manager, expectedPath: '/dashboard/manager' },
        { session: userSessions.staff, expectedPath: '/dashboard/staff' },
        { session: userSessions.client, expectedPath: '/dashboard/client' },
      ]

      testCases.forEach(({ session, expectedPath }) => {
        mockUseSession.mockReturnValue(session)

        const { result } = renderHook(() => useAuth(), {
          wrapper: createHookWrapper(session.data),
        })

        act(() => {
          result.current.redirectToDashboard()
        })

        expect(mockRouter.push).toHaveBeenCalledWith(expectedPath)
      })
    })
  })

  describe('Token CSRF', () => {
    it('devrait retourner le token CSRF si disponible', () => {
      const sessionWithCSRF = createMockSession({
        csrfToken: 'test-csrf-token',
      })
      mockUseSession.mockReturnValue({
        ...userSessions.client,
        data: sessionWithCSRF,
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: createHookWrapper(sessionWithCSRF),
      })

      expect(result.current.csrfToken).toBe('test-csrf-token')
    })

    it('devrait retourner null si pas de token CSRF', () => {
      mockUseSession.mockReturnValue(userSessions.client)

      const { result } = renderHook(() => useAuth(), {
        wrapper: createHookWrapper(userSessions.client.data),
      })

      expect(result.current.csrfToken).toBeNull()
    })
  })
})

describe('useRequireAuth Hook', () => {
  it('devrait rediriger automatiquement si non authentifié', () => {
    mockUseSession.mockReturnValue(userSessions.unauthenticated)

    renderHook(() => useRequireAuth(), {
      wrapper: createHookWrapper(null),
    })

    expect(mockRouter.push).toHaveBeenCalledWith('/login')
  })

  it('ne devrait pas rediriger si authentifié', () => {
    mockUseSession.mockReturnValue(userSessions.client)

    renderHook(() => useRequireAuth(), {
      wrapper: createHookWrapper(userSessions.client.data),
    })

    expect(mockRouter.push).not.toHaveBeenCalled()
  })

  it('ne devrait pas rediriger pendant le chargement', () => {
    mockUseSession.mockReturnValue(userSessions.loading)

    renderHook(() => useRequireAuth(), {
      wrapper: createHookWrapper(null),
    })

    expect(mockRouter.push).not.toHaveBeenCalled()
  })
})

describe('useRequireRole Hook', () => {
  it('devrait rediriger vers login si non authentifié', () => {
    mockUseSession.mockReturnValue(userSessions.unauthenticated)

    renderHook(() => useRequireRole(UserRole.ADMIN), {
      wrapper: createHookWrapper(null),
    })

    expect(mockRouter.push).toHaveBeenCalledWith('/login')
  })

  it('devrait rediriger vers dashboard approprié si rôle insuffisant', () => {
    mockUseSession.mockReturnValue(userSessions.client)

    renderHook(() => useRequireRole(UserRole.ADMIN), {
      wrapper: createHookWrapper(userSessions.client.data),
    })

    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard/client')
  })

  it('ne devrait pas rediriger si rôle suffisant', () => {
    mockUseSession.mockReturnValue(userSessions.admin)

    renderHook(() => useRequireRole(UserRole.MANAGER), {
      wrapper: createHookWrapper(userSessions.admin.data),
    })

    expect(mockRouter.push).not.toHaveBeenCalled()
  })

  it('ne devrait pas rediriger pendant le chargement', () => {
    mockUseSession.mockReturnValue(userSessions.loading)

    renderHook(() => useRequireRole(UserRole.ADMIN), {
      wrapper: createHookWrapper(null),
    })

    expect(mockRouter.push).not.toHaveBeenCalled()
  })
})
