/**
 * Utilitaires d'authentification et de sécurité
 * Implémente les vérifications de rôles, permissions et audit de sécurité
 */

import { getServerSession } from 'next-auth'
import { NextRequest } from 'next/server'
import crypto from 'crypto'
import { 
  UserRole, 
  RoutePermission, 
  ROLE_HIERARCHY, 
  PROTECTED_ROUTES,
  PUBLIC_ROUTES,
  SecurityAuditLog,
  AuthSession 
} from '@/types/auth'
import { authOptions } from './auth'

/**
 * Vérifie si un utilisateur a le rôle requis en tenant compte de la hiérarchie
 */
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole]?.includes(requiredRole) ?? false
}

/**
 * Vérifie si un utilisateur a accès à une route spécifique
 */
export function hasRouteAccess(userRole: UserRole, pathname: string): boolean {
  // Vérifier d'abord si c'est une route publique
  if (isPublicRoute(pathname)) {
    return true
  }

  // Trouver la route protégée correspondante (la plus spécifique d'abord)
  const matchingRoute = PROTECTED_ROUTES
    .sort((a, b) => b.path.length - a.path.length)
    .find(route => pathname.startsWith(route.path))

  if (!matchingRoute) {
    // Par défaut, refuser l'accès aux routes non définies
    return false
  }

  // Vérifier si l'utilisateur a l'un des rôles autorisés
  return matchingRoute.allowedRoles.some(allowedRole => hasRole(userRole, allowedRole))
}

/**
 * Vérifie si une route est publique
 */
export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => {
    if (route.endsWith('*')) {
      return pathname.startsWith(route.slice(0, -1))
    }
    return pathname === route || pathname.startsWith(route + '/')
  })
}

/**
 * Génère un token CSRF sécurisé
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Valide un token CSRF
 */
export function validateCSRFToken(token: string, sessionToken: string): boolean {
  if (!token || !sessionToken) {
    return false
  }
  
  // Utiliser une comparaison temporellement constante pour éviter les attaques de timing
  return crypto.timingSafeEqual(
    Buffer.from(token, 'hex'),
    Buffer.from(sessionToken, 'hex')
  )
}

/**
 * Extrait l'adresse IP réelle de la requête en tenant compte des proxies
 */
export function getRealIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  return request.ip || 'unknown'
}

/**
 * Valide la force d'un mot de passe
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (password.length < 12) {
    errors.push('Le mot de passe doit contenir au moins 12 caractères')
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une lettre minuscule')
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une lettre majuscule')
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un chiffre')
  }
  
  if (!/(?=.*[@$!%*?&])/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un caractère spécial')
  }
  
  // Vérifier les mots de passe communs
  const commonPasswords = [
    'password123', 'admin123', 'qwerty123', '123456789',
    'password!', 'admin!', 'qwerty!', 'azerty123'
  ]
  
  if (commonPasswords.some(common => password.toLowerCase().includes(common.toLowerCase()))) {
    errors.push('Le mot de passe ne doit pas contenir de mots de passe courants')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Log d'audit de sécurité
 */
export async function logSecurityEvent(event: Omit<SecurityAuditLog, 'id' | 'timestamp'>): Promise<void> {
  const auditLog: SecurityAuditLog = {
    id: crypto.randomUUID(),
    timestamp: new Date(),
    ...event
  }
  
  // En production, envoyer vers un service de logging sécurisé
  console.log('[SECURITY AUDIT]', JSON.stringify(auditLog, null, 2))
  
  // TODO: Implémenter l'envoi vers un service de logging externe
  // - Elasticsearch/Kibana
  // - Splunk
  // - CloudWatch
  // - Service de SIEM
}

/**
 * Vérifie si une session est valide et non expirée
 */
export function isSessionValid(session: AuthSession | null): boolean {
  if (!session) {
    return false
  }
  
  const now = Date.now()
  return session.expiresAt > now && session.user.isActive
}

/**
 * Calcule la redirection appropriée basée sur le rôle de l'utilisateur
 */
export function getRedirectPath(userRole: UserRole, intendedPath?: string): string {
  // Si un chemin était demandé et que l'utilisateur y a accès, l'y rediriger
  if (intendedPath && hasRouteAccess(userRole, intendedPath)) {
    return intendedPath
  }
  
  // Sinon, rediriger vers le dashboard approprié selon le rôle
  switch (userRole) {
    case UserRole.ADMIN:
      return '/dashboard/admin'
    case UserRole.MANAGER:
      return '/dashboard/manager'
    case UserRole.STAFF:
      return '/dashboard/staff'
    case UserRole.CLIENT:
      return '/dashboard/client'
    default:
      return '/auth/login'
  }
}

/**
 * Vérifie les tentatives de brute force
 */
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>()

export function checkBruteForce(ip: string): { isBlocked: boolean; remainingTime?: number } {
  const attempts = loginAttempts.get(ip)
  const now = Date.now()
  const maxAttempts = 5
  const lockoutDuration = 15 * 60 * 1000 // 15 minutes
  
  if (!attempts) {
    return { isBlocked: false }
  }
  
  // Réinitialiser si plus d'une heure s'est écoulée
  if (now - attempts.lastAttempt > 60 * 60 * 1000) {
    loginAttempts.delete(ip)
    return { isBlocked: false }
  }
  
  // Vérifier si bloqué
  if (attempts.count >= maxAttempts) {
    const remainingTime = lockoutDuration - (now - attempts.lastAttempt)
    if (remainingTime > 0) {
      return { isBlocked: true, remainingTime }
    } else {
      // La période de blocage est terminée
      loginAttempts.delete(ip)
      return { isBlocked: false }
    }
  }
  
  return { isBlocked: false }
}

/**
 * Enregistre une tentative de connexion échouée
 */
export function recordFailedLogin(ip: string): void {
  const now = Date.now()
  const attempts = loginAttempts.get(ip) || { count: 0, lastAttempt: 0 }
  
  loginAttempts.set(ip, {
    count: attempts.count + 1,
    lastAttempt: now
  })
}

/**
 * Réinitialise les tentatives de connexion pour une IP
 */
export function resetLoginAttempts(ip: string): void {
  loginAttempts.delete(ip)
}

/**
 * Obtient la session serveur de manière sécurisée
 */
export async function getSecureServerSession() {
  try {
    return await getServerSession(authOptions)
  } catch (error) {
    console.error('Erreur lors de la récupération de la session:', error)
    return null
  }
}