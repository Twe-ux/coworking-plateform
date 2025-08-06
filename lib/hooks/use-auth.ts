/**
 * Hook d'authentification sécurisé pour les composants React
 * Fournit un accès facile et sécurisé aux données d'authentification
 */

'use client'

import {
  getRedirectPath,
  hasRole,
  hasRouteAccess,
} from '@/lib/auth-utils-client'
import { UserRole } from '@/types/auth'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useCallback, useMemo } from 'react'

export interface AuthState {
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    role: UserRole
    permissions: string[]
    isActive: boolean
  } | null
  isLoading: boolean
  isAuthenticated: boolean
  csrfToken: string | null
}

export interface AuthActions {
  hasRole: (requiredRole: UserRole) => boolean
  hasPermission: (permission: string) => boolean
  hasRouteAccess: (pathname: string) => boolean
  requireAuth: () => void
  requireRole: (requiredRole: UserRole) => void
  redirectToDashboard: () => void
}

export function useAuth(): AuthState & AuthActions {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Memoize auth state for performance
  const authState: AuthState = useMemo(
    () => ({
      user: session?.user
        ? {
            id: session.user.id,
            email: session.user.email || '',
            firstName: session.user.firstName || '',
            lastName: session.user.lastName || '',
            role: session.user.role,
            permissions: session.user.permissions || [],
            isActive: session.user.isActive,
          }
        : null,
      isLoading: status === 'loading',
      isAuthenticated: status === 'authenticated' && !!session?.user?.isActive,
      csrfToken: session?.csrfToken || null,
    }),
    [session, status]
  )

  // Memoize auth actions to prevent unnecessary re-renders
  const authActions: AuthActions = useMemo(
    () => ({
      hasRole: (requiredRole: UserRole) => {
        if (!authState.user) return false
        return hasRole(authState.user.role, requiredRole)
      },

      hasPermission: (permission: string) => {
        if (!authState.user) return false
        return authState.user.permissions.includes(permission)
      },

      hasRouteAccess: (pathname: string) => {
        if (!authState.user) return false
        return hasRouteAccess(authState.user.role, pathname)
      },

      requireAuth: () => {
        if (!authState.isAuthenticated) {
          const currentUrl = window.location.pathname + window.location.search
          const loginUrl =
            currentUrl !== '/login'
              ? `/login?callbackUrl=${encodeURIComponent(currentUrl)}`
              : '/login'
          router.push(loginUrl)
        }
      },

      requireRole: (requiredRole: UserRole) => {
        if (!authState.isAuthenticated) {
          const currentUrl = window.location.pathname + window.location.search
          const loginUrl = `/login?callbackUrl=${encodeURIComponent(currentUrl)}`
          router.push(loginUrl)
          return
        }

        if (!authState.user || !hasRole(authState.user.role, requiredRole)) {
          const redirectPath = authState.user
            ? getRedirectPath(authState.user.role)
            : '/login'
          router.push(redirectPath)
        }
      },

      redirectToDashboard: () => {
        if (authState.user) {
          const redirectPath = getRedirectPath(authState.user.role)
          router.push(redirectPath)
        } else {
          router.push('/login')
        }
      },
    }),
    [authState, router]
  )

  return { ...authState, ...authActions }
}

/**
 * Hook pour la protection des composants par rôle
 */
export function useRequireRole(requiredRole: UserRole) {
  const auth = useAuth()

  useEffect(() => {
    if (!auth.isLoading) {
      auth.requireRole(requiredRole)
    }
  }, [auth, requiredRole])

  return auth
}

/**
 * Hook pour la protection des composants par authentification
 */
export function useRequireAuth() {
  const auth = useAuth()

  useEffect(() => {
    if (!auth.isLoading) {
      auth.requireAuth()
    }
  }, [auth])

  return auth
}
