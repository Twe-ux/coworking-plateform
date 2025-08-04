/**
 * Composants de protection des routes côté client
 * Complément au middleware serveur pour une sécurité multicouche
 */

'use client'

import React from 'react'
import { useAuth, useRequireRole, useRequireAuth } from '@/lib/hooks/use-auth'
import { UserRole } from '@/types/auth'

interface RouteGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface RoleGuardProps extends RouteGuardProps {
  requiredRole: UserRole
  allowedRoles?: UserRole[]
}

/**
 * Composant de chargement sécurisé par défaut
 */
const DefaultLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-pulse flex space-x-4">
      <div className="rounded-full bg-gray-300 h-12 w-12"></div>
      <div className="flex-1 space-y-2 py-1">
        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
      </div>
    </div>
  </div>
)

/**
 * Composant d'accès refusé par défaut
 */
const DefaultAccessDenied = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="text-6xl text-red-500 mb-4">🚫</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Accès refusé</h1>
      <p className="text-gray-600 mb-4">
        Vous n'avez pas les permissions nécessaires pour accéder à cette page.
      </p>
      <button
        onClick={() => window.history.back()}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        Retour
      </button>
    </div>
  </div>
)

/**
 * Garde d'authentification - Vérifie que l'utilisateur est connecté
 */
export function AuthGuard({ children, fallback }: RouteGuardProps) {
  const auth = useRequireAuth()

  if (auth.isLoading) {
    return fallback || <DefaultLoadingFallback />
  }

  if (!auth.isAuthenticated) {
    return fallback || <DefaultAccessDenied />
  }

  return <>{children}</>
}

/**
 * Garde de rôle - Vérifie que l'utilisateur a le rôle requis
 */
export function RoleGuard({ 
  children, 
  requiredRole, 
  allowedRoles, 
  fallback 
}: RoleGuardProps) {
  const auth = useRequireRole(requiredRole)

  if (auth.isLoading) {
    return fallback || <DefaultLoadingFallback />
  }

  if (!auth.isAuthenticated) {
    return fallback || <DefaultAccessDenied />
  }

  // Vérifier le rôle requis ou les rôles autorisés
  const hasAccess = allowedRoles 
    ? allowedRoles.some(role => auth.hasRole(role))
    : auth.hasRole(requiredRole)

  if (!hasAccess) {
    return fallback || <DefaultAccessDenied />
  }

  return <>{children}</>
}

/**
 * Garde d'admin - Accès réservé aux administrateurs
 */
export function AdminGuard({ children, fallback }: RouteGuardProps) {
  return (
    <RoleGuard requiredRole={UserRole.ADMIN} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

/**
 * Garde de manager - Accès pour admin et manager
 */
export function ManagerGuard({ children, fallback }: RouteGuardProps) {
  return (
    <RoleGuard 
      requiredRole={UserRole.MANAGER} 
      allowedRoles={[UserRole.ADMIN, UserRole.MANAGER]}
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  )
}

/**
 * Garde de staff - Accès pour admin, manager et staff
 */
export function StaffGuard({ children, fallback }: RouteGuardProps) {
  return (
    <RoleGuard 
      requiredRole={UserRole.STAFF}
      allowedRoles={[UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF]}
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  )
}

/**
 * Composant conditionnel basé sur le rôle
 */
interface ConditionalRenderProps {
  role?: UserRole
  roles?: UserRole[]
  permission?: string
  permissions?: string[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ConditionalRender({
  role,
  roles,
  permission,
  permissions,
  children,
  fallback = null
}: ConditionalRenderProps) {
  const auth = useAuth()

  if (auth.isLoading) {
    return fallback
  }

  if (!auth.isAuthenticated) {
    return fallback
  }

  // Vérifier les rôles
  if (role && !auth.hasRole(role)) {
    return fallback
  }

  if (roles && !roles.some(r => auth.hasRole(r))) {
    return fallback
  }

  // Vérifier les permissions
  if (permission && !auth.hasPermission(permission)) {
    return fallback
  }

  if (permissions && !permissions.some(p => auth.hasPermission(p))) {
    return fallback
  }

  return <>{children}</>
}

/**
 * HOC pour protéger une page entière
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    requiredRole?: UserRole
    allowedRoles?: UserRole[]
    loadingFallback?: React.ComponentType
    accessDeniedFallback?: React.ComponentType
  }
) {
  const WrappedComponent = (props: P) => {
    const LoadingComponent = options?.loadingFallback || DefaultLoadingFallback
    const AccessDeniedComponent = options?.accessDeniedFallback || DefaultAccessDenied

    if (options?.requiredRole || options?.allowedRoles) {
      return (
        <RoleGuard
          requiredRole={options.requiredRole || UserRole.CLIENT}
          allowedRoles={options.allowedRoles}
          fallback={<LoadingComponent />}
        >
          <Component {...props} />
        </RoleGuard>
      )
    }

    return (
      <AuthGuard fallback={<LoadingComponent />}>
        <Component {...props} />
      </AuthGuard>
    )
  }

  WrappedComponent.displayName = `withAuth(${Component.displayName || Component.name})`

  return WrappedComponent
}

/**
 * Hook pour vérifier l'accès à une route côté client
 */
export function useRouteAccess(pathname: string) {
  const auth = useAuth()
  
  return {
    hasAccess: auth.hasRouteAccess(pathname),
    isLoading: auth.isLoading,
    isAuthenticated: auth.isAuthenticated
  }
}