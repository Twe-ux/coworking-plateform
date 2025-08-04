/**
 * Hook d'authentification sécurisé pour les composants React
 * Fournit un accès facile et sécurisé aux données d'authentification
 */

'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { UserRole } from '@/types/auth'
import { hasRole, hasRouteAccess, getRedirectPath } from '@/lib/auth-utils'

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
  const [csrfToken, setCsrfToken] = useState<string | null>(null)

  // Récupérer le token CSRF du header ou du cookie
  useEffect(() => {
    const fetchCSRFToken = () => {
      // Essayer de récupérer depuis les meta tags
      const metaCSRF = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
      if (metaCSRF) {
        setCsrfToken(metaCSRF)
        return
      }

      // Essayer de récupérer depuis un appel API
      fetch('/api/auth/csrf')
        .then(response => response.json())
        .then(data => setCsrfToken(data.csrfToken))
        .catch(console.error)
    }

    if (status === 'authenticated') {
      fetchCSRFToken()
    }
  }, [status])

  const authState: AuthState = {
    user: session?.user ? {
      id: session.user.id,
      email: session.user.email || '',
      firstName: session.user.firstName || '',
      lastName: session.user.lastName || '',
      role: session.user.role,
      permissions: session.user.permissions || [],
      isActive: session.user.isActive
    } : null,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated' && !!session?.user?.isActive,
    csrfToken: session?.csrfToken || csrfToken
  }

  const authActions: AuthActions = {
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
        router.push('/auth/login')
      }
    },

    requireRole: (requiredRole: UserRole) => {
      if (!authState.isAuthenticated) {
        router.push('/auth/login')
        return
      }

      if (!authActions.hasRole(requiredRole)) {
        const redirectPath = getRedirectPath(authState.user!.role)
        router.push(redirectPath)
      }
    },

    redirectToDashboard: () => {
      if (authState.user) {
        const redirectPath = getRedirectPath(authState.user.role)
        router.push(redirectPath)
      } else {
        router.push('/auth/login')
      }
    }
  }

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
  }, [auth.isLoading, auth.isAuthenticated, requiredRole])

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
  }, [auth.isLoading, auth.isAuthenticated])

  return auth
}