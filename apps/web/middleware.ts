/**
 * Middleware de sécurité Next.js 14
 * Protection des routes basée sur les rôles avec sécurité renforcée
 * 
 * Fonctionnalités de sécurité implémentées :
 * - Vérification JWT tokens avec validation stricte
 * - Gestion hiérarchique des rôles
 * - Protection CSRF automatique
 * - Headers de sécurité (CSP, HSTS, etc.)
 * - Logging des accès et tentatives d'intrusion
 * - Rate limiting par IP
 * - Détection d'anomalies
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { 
  hasRouteAccess, 
  isPublicRoute, 
  getRealIP, 
  logSecurityEvent,
  getRedirectPath,
  validateCSRFToken
} from '@/lib/auth-utils'
import { UserRole } from '@/types/auth'

// Rate limiting par IP (en mémoire - à remplacer par Redis en production)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100 // 100 requêtes par minute par IP

// Détection d'anomalies
const suspiciousPatterns = [
  /\/\.env/,
  /\/wp-admin/,
  /\/phpmyadmin/,
  /\/admin\.php/,
  /\/config\.php/,
  /\/\.git/,
  /\/\.svn/,
  /\.(sql|backup|bak)$/,
  /<script/i,
  /javascript:/i,
  /vbscript:/i,
  /onload=/i,
  /onerror=/i,
  /eval\(/i,
  /union.*select/i,
  /drop.*table/i,
  /insert.*into/i,
  /update.*set/i,
  /delete.*from/i
]

/**
 * Vérifie le rate limiting pour une IP donnée
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry) {
    rateLimitMap.set(ip, { count: 1, lastReset: now })
    return true
  }

  // Reset si la fenêtre de temps est dépassée
  if (now - entry.lastReset > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, lastReset: now })
    return true
  }

  // Incrémenter le compteur
  entry.count++

  // Vérifier la limite
  return entry.count <= RATE_LIMIT_MAX_REQUESTS
}

/**
 * Détecte les patterns suspects dans l'URL
 */
function detectSuspiciousActivity(pathname: string, searchParams: URLSearchParams): boolean {
  const fullUrl = pathname + '?' + searchParams.toString()
  
  return suspiciousPatterns.some(pattern => pattern.test(fullUrl))
}

/**
 * Configure les headers de sécurité
 */
function setSecurityHeaders(response: NextResponse): void {
  // Content Security Policy (CSP)
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://api.stripe.com https://vercel.live",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ')

  // Headers de sécurité OWASP recommandés
  const securityHeaders = {
    // CSP
    'Content-Security-Policy': csp,
    
    // Protection contre le clickjacking
    'X-Frame-Options': 'DENY',
    
    // Protection contre le type sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // Protection XSS
    'X-XSS-Protection': '1; mode=block',
    
    // Force HTTPS (en production)
    'Strict-Transport-Security': process.env.NODE_ENV === 'production' 
      ? 'max-age=63072000; includeSubDomains; preload' 
      : '',
    
    // Contrôle du referrer
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Permissions Policy (anciennement Feature Policy)
    'Permissions-Policy': [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'gyroscope=()',
      'accelerometer=()'
    ].join(', '),
    
    // Protection contre les attaques de cache
    'Cache-Control': 'no-store, must-revalidate',
    'Pragma': 'no-cache',
    
    // Headers personnalisés pour le debugging
    'X-Robots-Tag': 'noindex, nofollow',
    'X-Powered-By': '', // Masquer les informations sur la technologie
  }

  // Appliquer tous les headers de sécurité
  Object.entries(securityHeaders).forEach(([key, value]) => {
    if (value) {
      response.headers.set(key, value)
    }
  })
}

/**
 * Middleware principal de sécurité
 */
export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  const ip = getRealIP(request)
  const userAgent = request.headers.get('user-agent') || 'unknown'

  // Créer la réponse de base
  const response = NextResponse.next()
  
  // Appliquer les headers de sécurité sur toutes les réponses
  setSecurityHeaders(response)

  try {
    // 1. Détection d'activité suspecte
    if (detectSuspiciousActivity(pathname, searchParams)) {
      await logSecurityEvent({
        userId: undefined,
        action: 'SUSPICIOUS_ACTIVITY',
        resource: pathname,
        ip,
        userAgent,
        success: false,
        details: { 
          pattern_detected: true, 
          url: pathname + '?' + searchParams.toString() 
        }
      })

      // Retourner une erreur 403 pour les requêtes suspectes
      return new NextResponse('Forbidden', { 
        status: 403,
        headers: response.headers
      })
    }

    // 2. Rate limiting
    if (!checkRateLimit(ip)) {
      await logSecurityEvent({
        userId: undefined,
        action: 'RATE_LIMIT_EXCEEDED',
        resource: pathname,
        ip,
        userAgent,
        success: false,
        details: { limit: RATE_LIMIT_MAX_REQUESTS, window: RATE_LIMIT_WINDOW }
      })

      return new NextResponse('Too Many Requests', { 
        status: 429,
        headers: {
          ...Object.fromEntries(response.headers.entries()),
          'Retry-After': '60'
        }
      })
    }

    // 3. Vérifier si la route est publique
    if (isPublicRoute(pathname)) {
      return response
    }

    // 4. Obtenir le token JWT de la session
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    })

    // 5. Vérifier l'authentification
    if (!token) {
      await logSecurityEvent({
        userId: undefined,
        action: 'UNAUTHORIZED_ACCESS',
        resource: pathname,
        ip,
        userAgent,
        success: false,
        details: { reason: 'no_token' }
      })

      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // 6. Vérifier que l'utilisateur est actif
    if (!token.isActive) {
      await logSecurityEvent({
        userId: token.id as string,
        action: 'ACCOUNT_DISABLED_ACCESS',
        resource: pathname,
        ip,
        userAgent,
        success: false,
        details: { reason: 'account_disabled' }
      })

      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('error', 'AccountDisabled')
      return NextResponse.redirect(loginUrl)
    }

    // 7. Vérifier l'expiration du token
    if (token.expiresAt && Date.now() > token.expiresAt) {
      await logSecurityEvent({
        userId: token.id as string,
        action: 'TOKEN_EXPIRED',
        resource: pathname,
        ip,
        userAgent,
        success: false,
        details: { expired_at: new Date(token.expiresAt) }
      })

      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('error', 'SessionExpired')
      return NextResponse.redirect(loginUrl)
    }

    // 8. Vérifier les permissions de rôle
    const userRole = token.role as UserRole
    if (!hasRouteAccess(userRole, pathname)) {
      await logSecurityEvent({
        userId: token.id as string,
        action: 'ACCESS_DENIED',
        resource: pathname,
        ip,
        userAgent,
        success: false,
        details: { 
          user_role: userRole, 
          required_access: 'route_permission',
          attempted_path: pathname 
        }
      })

      // Rediriger vers le dashboard approprié selon le rôle
      const redirectPath = getRedirectPath(userRole)
      return NextResponse.redirect(new URL(redirectPath, request.url))
    }

    // 9. Validation CSRF pour les requêtes de modification
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      const csrfToken = request.headers.get('x-csrf-token') || 
                       request.headers.get('x-xsrf-token') ||
                       searchParams.get('csrf')
      
      if (!csrfToken || !validateCSRFToken(csrfToken, token.csrfToken as string)) {
        await logSecurityEvent({
          userId: token.id as string,
          action: 'CSRF_VALIDATION_FAILED',
          resource: pathname,
          ip,
          userAgent,
          success: false,
          details: { 
            method: request.method,
            csrf_provided: !!csrfToken,
            headers: Object.fromEntries(request.headers.entries())
          }
        })

        return new NextResponse('CSRF Token Invalid', { 
          status: 403,
          headers: response.headers
        })
      }
    }

    // 10. Log d'accès autorisé (échantillonnage 5% pour éviter le spam)
    if (Math.random() < 0.05) {
      await logSecurityEvent({
        userId: token.id as string,
        action: 'ACCESS_GRANTED',
        resource: pathname,
        ip,
        userAgent,
        success: true,
        details: { 
          user_role: userRole,
          method: request.method 
        }
      })
    }

    // 11. Ajouter le token CSRF aux headers de réponse pour les requêtes GET
    if (request.method === 'GET') {
      response.headers.set('x-csrf-token', token.csrfToken as string)
    }

    return response

  } catch (error) {
    // Log des erreurs critiques du middleware
    await logSecurityEvent({
      userId: undefined,
      action: 'MIDDLEWARE_ERROR',
      resource: pathname,
      ip,
      userAgent,
      success: false,
      details: { 
        error: error instanceof Error ? error.message : 'unknown_error',
        stack: error instanceof Error ? error.stack : undefined
      }
    })

    console.error('[MIDDLEWARE ERROR]', error)

    // En cas d'erreur, rediriger vers la page de connexion par sécurité
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
}

/**
 * Configuration des routes où le middleware doit s'exécuter
 * Exclut les fichiers statiques et les API routes non sensibles
 */
export const config = {
  matcher: [
    /*
     * Matcher pour toutes les routes sauf :
     * - /api/auth/* (NextAuth routes)
     * - /_next/static (fichiers statiques)
     * - /_next/image (optimisation d'images)
     * - /favicon.ico (favicon)
     * - Fichiers publics (.png, .jpg, .svg, etc.)
     */
    '/((?!api/auth|api/health|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)',
  ],
}