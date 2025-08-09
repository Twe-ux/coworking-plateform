/**
 * Types d'authentification pour la plateforme coworking
 * Définit les rôles, permissions et structures de données sécurisées
 */

import { DefaultSession } from 'next-auth'

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  STAFF = 'staff',
  CLIENT = 'client',
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  permissions?: string[]
  isActive: boolean
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface AuthSession {
  user: User
  accessToken: string
  refreshToken?: string
  expiresAt: number
  csrfToken: string
}

export interface RoutePermission {
  path: string
  allowedRoles: UserRole[]
  requiresPermissions?: string[]
  isPublic?: boolean
}

export interface SecurityAuditLog {
  id: string
  userId?: string
  action: string
  resource: string
  ip: string
  userAgent: string
  timestamp: Date
  success: boolean
  details?: Record<string, any>
}

// Hiérarchie des rôles - un rôle supérieur hérite des permissions inférieures
export const ROLE_HIERARCHY: Record<UserRole, UserRole[]> = {
  [UserRole.ADMIN]: [
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.STAFF,
    UserRole.CLIENT,
  ],
  [UserRole.MANAGER]: [UserRole.MANAGER, UserRole.STAFF, UserRole.CLIENT],
  [UserRole.STAFF]: [UserRole.STAFF, UserRole.CLIENT],
  [UserRole.CLIENT]: [UserRole.CLIENT],
}

// Configuration des routes protégées
export const PROTECTED_ROUTES: RoutePermission[] = [
  {
    path: '/admin',
    allowedRoles: [UserRole.ADMIN],
  },
  {
    path: '/dashboard/admin',
    allowedRoles: [UserRole.ADMIN],
  },
  {
    path: '/dashboard/manager',
    allowedRoles: [UserRole.ADMIN, UserRole.MANAGER],
  },
  {
    path: '/dashboard/staff',
    allowedRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF],
  },
  {
    path: '/dashboard/client',
    allowedRoles: [
      UserRole.ADMIN,
      UserRole.MANAGER,
      UserRole.STAFF,
      UserRole.CLIENT,
    ],
  },
  {
    path: '/dashboard',
    allowedRoles: [
      UserRole.ADMIN,
      UserRole.MANAGER,
      UserRole.STAFF,
      UserRole.CLIENT,
    ],
  },
  {
    path: '/payment/form',
    allowedRoles: [
      UserRole.ADMIN,
      UserRole.MANAGER,
      UserRole.STAFF,
      UserRole.CLIENT,
    ],
  },
  {
    path: '/reservation',
    allowedRoles: [
      UserRole.ADMIN,
      UserRole.MANAGER,
      UserRole.STAFF,
      UserRole.CLIENT,
    ],
  },
]

// Routes publiques qui ne nécessitent pas d'authentification
export const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/payment/success',
  '/payment/cancel',
  '/api/auth',
  '/api/health',
  // Routes de test (développement uniquement)
  ...(process.env.NODE_ENV === 'development' ? ['/test-email', '/api/test-email'] : []),
]

// Extensions de types pour NextAuth
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      firstName: string
      lastName: string
      role: UserRole
      permissions: string[]
      isActive: boolean
    } & DefaultSession['user']
    csrfToken?: string
    expiresAt?: number
  }

  interface User {
    id: string
    firstName: string
    lastName: string
    role: UserRole
    permissions: string[]
    isActive: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    firstName: string
    lastName: string
    role: UserRole
    permissions: string[]
    isActive: boolean
    csrfToken: string
    expiresAt: number
  }
}
