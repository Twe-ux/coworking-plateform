/**
 * Client-side authentication utilities
 * Safe for client-side use without server dependencies
 */

import { 
  UserRole, 
  ROLE_HIERARCHY, 
  PROTECTED_ROUTES,
  PUBLIC_ROUTES,
  AuthSession 
} from '@/types/auth'

/**
 * Vérifie si un utilisateur a un rôle spécifique ou supérieur
 */
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  const allowedRoles = ROLE_HIERARCHY[userRole]
  return allowedRoles ? allowedRoles.includes(requiredRole) : false
}

/**
 * Vérifie si un utilisateur peut accéder à une route
 */
export function hasRouteAccess(userRole: UserRole | undefined, route: string): boolean {
  // Routes publiques accessibles à tous
  if (PUBLIC_ROUTES.includes(route)) {
    return true
  }

  // Si pas d'utilisateur connecté, seules les routes publiques sont accessibles
  if (!userRole) {
    return false
  }

  // Vérifier les routes protégées
  for (const permission of PROTECTED_ROUTES) {
    if (route.startsWith(permission.path) || route === permission.path) {
      return permission.allowedRoles.includes(userRole)
    }
  }

  // Par défaut, autoriser l'accès aux routes non définies pour les utilisateurs connectés
  return true
}

/**
 * Obtient le chemin de redirection approprié selon le rôle
 */
export function getRedirectPath(role: UserRole): string {
  switch (role) {
    case UserRole.ADMIN:
      return '/dashboard/admin'
    case UserRole.MANAGER:
      return '/dashboard/manager'
    case UserRole.STAFF:
      return '/dashboard/staff'
    case UserRole.CLIENT:
      return '/dashboard'
    default:
      return '/dashboard'
  }
}

/**
 * Extrait les informations de session pour le client
 */
export function extractSessionInfo(session: any): AuthSession | null {
  if (!session?.user) {
    return null
  }

  return {
    user: {
      id: session.user.id || '',
      email: session.user.email || '',
      firstName: session.user.firstName || '',
      lastName: session.user.lastName || '',
      role: session.user.role || UserRole.CLIENT,
      isActive: session.user.isActive ?? true,
      createdAt: session.user.createdAt || new Date(),
      updatedAt: session.user.updatedAt || new Date(),
    },
    accessToken: session.accessToken || '',
    csrfToken: session.csrfToken || '',
    expiresAt: session.expires || Date.now() + 24 * 60 * 60 * 1000, // 24h par défaut
  }
}