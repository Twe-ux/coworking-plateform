/**
 * Utilitaires d'authentification et de sécurité
 * Implémente les vérifications de rôles, permissions et audit de sécurité
 */

import {
  AuthSession,
  PROTECTED_ROUTES,
  PUBLIC_ROUTES,
  ROLE_HIERARCHY,
  SecurityAuditLog,
  UserRole,
} from '@/types/auth'
import crypto from 'crypto'
import { getServerSession } from 'next-auth'
import { NextRequest } from 'next/server'
import { authOptions } from './auth'
import { connectToDatabase } from './mongodb'

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
  const matchingRoute = PROTECTED_ROUTES.sort(
    (a, b) => b.path.length - a.path.length
  ).find((route) => pathname.startsWith(route.path))

  if (!matchingRoute) {
    // Par défaut, refuser l'accès aux routes non définies
    return false
  }

  // Vérifier si l'utilisateur a l'un des rôles autorisés
  return matchingRoute.allowedRoles.some((allowedRole) =>
    hasRole(userRole, allowedRole)
  )
}

/**
 * Vérifie si une route est publique
 */
export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => {
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
export function validateCSRFToken(
  token: string,
  sessionToken: string
): boolean {
  if (!token || !sessionToken) {
    return false
  }

  try {
    // Utiliser une comparaison temporellement constante pour éviter les attaques de timing
    return crypto.timingSafeEqual(
      Buffer.from(token, 'hex'),
      Buffer.from(sessionToken, 'hex')
    )
  } catch {
    return false
  }
}

/**
 * Extrait l'adresse IP réelle de la requête en tenant compte des proxies
 */
export function getRealIP(request: NextRequest | any): string {
  if (!request?.headers) {
    return 'unknown'
  }

  const forwarded =
    request.headers.get?.('x-forwarded-for') ||
    request.headers['x-forwarded-for']
  const realIP =
    request.headers.get?.('x-real-ip') || request.headers['x-real-ip']
  const remoteAddr =
    request.headers.get?.('x-remote-addr') || request.headers['x-remote-addr']

  if (forwarded) {
    const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded
    return ips.split(',')[0].trim()
  }

  if (realIP) {
    return Array.isArray(realIP) ? realIP[0] : realIP
  }

  if (remoteAddr) {
    return Array.isArray(remoteAddr) ? remoteAddr[0] : remoteAddr
  }

  return request.ip || 'unknown'
}

/**
 * Valide la force d'un mot de passe
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean
  errors: string[]
  score: number
} {
  const errors: string[] = []
  let score = 0

  // Longueur minimum
  if (password.length >= 12) {
    score += 2
  } else if (password.length >= 8) {
    score += 1
    errors.push(
      'Le mot de passe devrait contenir au moins 12 caractères pour une sécurité optimale'
    )
  } else {
    errors.push('Le mot de passe doit contenir au moins 8 caractères')
  }

  // Présence de lettres minuscules
  if (/(?=.*[a-z])/.test(password)) {
    score += 1
  } else {
    errors.push('Le mot de passe doit contenir au moins une lettre minuscule')
  }

  // Présence de lettres majuscules
  if (/(?=.*[A-Z])/.test(password)) {
    score += 1
  } else {
    errors.push('Le mot de passe doit contenir au moins une lettre majuscule')
  }

  // Présence de chiffres
  if (/(?=.*\d)/.test(password)) {
    score += 1
  } else {
    errors.push('Le mot de passe doit contenir au moins un chiffre')
  }

  // Présence de caractères spéciaux
  if (/(?=.*[@$!%*?&])/.test(password)) {
    score += 1
  } else {
    errors.push(
      'Le mot de passe doit contenir au moins un caractère spécial (@$!%*?&)'
    )
  }

  // Bonus pour diversité de caractères
  if (/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(password)) {
    score += 1
  }

  // Bonus pour longueur supérieure
  if (password.length >= 16) {
    score += 1
  }

  // Vérifier les mots de passe communs
  const commonPasswords = [
    'password',
    'password123',
    'admin',
    'admin123',
    'qwerty',
    'qwerty123',
    '123456789',
    '123456',
    'azerty',
    'azerty123',
    'motdepasse',
    'secret',
    'user',
    'guest',
    'test',
    'demo',
  ]

  const lowerPassword = password.toLowerCase()
  if (commonPasswords.some((common) => lowerPassword.includes(common))) {
    errors.push('Le mot de passe ne doit pas contenir de mots courants')
    score = Math.max(0, score - 2)
  }

  // Vérifier les répétitions
  if (/(.)\1{2,}/.test(password)) {
    errors.push('Le mot de passe ne devrait pas contenir de caractères répétés')
  }

  // Vérifier les séquences
  if (
    /(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i.test(
      password
    )
  ) {
    errors.push('Le mot de passe ne devrait pas contenir de séquences')
  }

  return {
    isValid: errors.length === 0 && score >= 5,
    errors,
    score: Math.min(10, score),
  }
}

/**
 * Log d'audit de sécurité
 */
export async function logSecurityEvent(
  event: Omit<SecurityAuditLog, 'id' | 'timestamp'>
): Promise<void> {
  const auditLog: SecurityAuditLog = {
    id: crypto.randomUUID(),
    timestamp: new Date(),
    ...event,
  }

  try {
    // Stocker en base de données pour un audit complet
    const { db } = await connectToDatabase()
    await db.collection('security_logs').insertOne(auditLog)

    // Log en console pour le développement
    if (process.env.NODE_ENV === 'development') {
      console.log('[SECURITY AUDIT]', JSON.stringify(auditLog, null, 2))
    }

    // Log critique en production
    if (process.env.NODE_ENV === 'production' && !event.success) {
      console.warn('[SECURITY ALERT]', {
        action: event.action,
        resource: event.resource,
        ip: event.ip,
        userId: event.userId,
        details: event.details,
      })
    }
  } catch (error) {
    // Ne pas faire échouer l'application si le logging échoue
    console.error("Erreur lors de l'enregistrement du log de sécurité:", error)
  }
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
export function getRedirectPath(
  userRole: UserRole,
  intendedPath?: string
): string {
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
      return '/login'
  }
}

/**
 * Système de protection contre les attaques par brute force
 */
const loginAttempts = new Map<
  string,
  {
    count: number
    lastAttempt: number
    blocked: boolean
  }
>()

export function checkBruteForce(ip: string): {
  isBlocked: boolean
  remainingTime?: number
} {
  const attempts = loginAttempts.get(ip)
  const now = Date.now()
  const maxAttempts = 5
  const lockoutDuration = 15 * 60 * 1000 // 15 minutes
  const resetWindow = 60 * 60 * 1000 // 1 heure pour reset automatique

  if (!attempts) {
    return { isBlocked: false }
  }

  // Réinitialiser si plus d'une heure s'est écoulée
  if (now - attempts.lastAttempt > resetWindow) {
    loginAttempts.delete(ip)
    return { isBlocked: false }
  }

  // Vérifier si bloqué
  if (attempts.blocked && attempts.count >= maxAttempts) {
    const remainingTime = lockoutDuration - (now - attempts.lastAttempt)
    if (remainingTime > 0) {
      return { isBlocked: true, remainingTime }
    } else {
      // La période de blocage est terminée, débloquer mais garder le compteur
      attempts.blocked = false
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
  const maxAttempts = 5
  const attempts = loginAttempts.get(ip) || {
    count: 0,
    lastAttempt: 0,
    blocked: false,
  }

  const newCount = attempts.count + 1
  const shouldBlock = newCount >= maxAttempts

  loginAttempts.set(ip, {
    count: newCount,
    lastAttempt: now,
    blocked: shouldBlock,
  })

  // Log si l'IP vient d'être bloquée
  if (shouldBlock && !attempts.blocked) {
    console.warn(
      `[SECURITY] IP ${ip} bloquée après ${newCount} tentatives de connexion échouées`
    )
  }
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

/**
 * Valide les permissions d'un utilisateur pour une action spécifique
 */
export function hasPermission(
  userPermissions: string[],
  requiredPermission: string
): boolean {
  return (
    userPermissions.includes(requiredPermission) ||
    userPermissions.includes('*')
  )
}

/**
 * Hash sécurisé d'un mot de passe avec bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcryptjs')
  const saltRounds = process.env.NODE_ENV === 'production' ? 12 : 10
  return bcrypt.hash(password, saltRounds)
}

/**
 * Vérifie un mot de passe contre son hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const bcrypt = await import('bcryptjs')
  return bcrypt.compare(password, hash)
}

/**
 * Génère un token de réinitialisation de mot de passe sécurisé
 */
export function generateResetToken(): { token: string; expires: Date } {
  const token = crypto.randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 heure
  return { token, expires }
}

/**
 * Nettoie les logs de sécurité anciens (à appeler périodiquement)
 */
export async function cleanupSecurityLogs(): Promise<void> {
  try {
    const { db } = await connectToDatabase()
    const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 90 jours

    const result = await db.collection('security_logs').deleteMany({
      timestamp: { $lt: cutoffDate },
    })

    console.log(
      `Nettoyage des logs de sécurité: ${result.deletedCount} entrées supprimées`
    )
  } catch (error) {
    console.error('Erreur lors du nettoyage des logs de sécurité:', error)
  }
}

/**
 * Obtient les statistiques de sécurité
 */
export async function getSecurityStats(days: number = 7): Promise<{
  totalEvents: number
  failedLogins: number
  successfulLogins: number
  blockedAttempts: number
  topIPs: Array<{ ip: string; count: number }>
}> {
  try {
    const { db } = await connectToDatabase()
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const [
      totalEvents,
      failedLogins,
      successfulLogins,
      blockedAttempts,
      topIPs,
    ] = await Promise.all([
      db.collection('security_logs').countDocuments({
        timestamp: { $gte: cutoffDate },
      }),
      db.collection('security_logs').countDocuments({
        timestamp: { $gte: cutoffDate },
        action: 'LOGIN_FAILED',
      }),
      db.collection('security_logs').countDocuments({
        timestamp: { $gte: cutoffDate },
        action: 'LOGIN_SUCCESS',
      }),
      db.collection('security_logs').countDocuments({
        timestamp: { $gte: cutoffDate },
        action: 'LOGIN_BLOCKED',
      }),
      db
        .collection('security_logs')
        .aggregate([
          { $match: { timestamp: { $gte: cutoffDate } } },
          { $group: { _id: '$ip', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
          { $project: { ip: '$_id', count: 1, _id: 0 } },
        ])
        .toArray(),
    ])

    return {
      totalEvents,
      failedLogins,
      successfulLogins,
      blockedAttempts,
      topIPs: topIPs as Array<{ ip: string; count: number }>,
    }
  } catch (error) {
    console.error(
      'Erreur lors de la récupération des statistiques de sécurité:',
      error
    )
    return {
      totalEvents: 0,
      failedLogins: 0,
      successfulLogins: 0,
      blockedAttempts: 0,
      topIPs: [],
    }
  }
}
