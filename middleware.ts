import { withAuth } from 'next-auth/middleware'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { PROTECTED_ROUTES, PUBLIC_ROUTES, UserRole } from './types/auth'

/**
 * Middleware d'authentification et d'autorisation optimisé
 * Gère la protection des routes basée sur les rôles avec sécurité renforcée
 */
export default withAuth(
  function middleware(req: NextRequest & { nextauth: { token: any } }) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Routes publiques - accès libre
    if (isPublicRoute(pathname)) {
      return NextResponse.next()
    }

    // Vérification de l'authentification
    // Note: withAuth gère automatiquement la redirection vers la page de login
    // avec le callbackUrl approprié. Pas besoin de redirection manuelle ici.

    // Vérification du statut de l'utilisateur
    if (
      !token.isActive ||
      token.status === 'suspended' ||
      token.status === 'banned'
    ) {
      return NextResponse.redirect(new URL('/account-suspended', req.url))
    }

    // Vérification de l'expiration du token
    if (token.expiresAt && Date.now() > token.expiresAt) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('error', 'SessionExpired')
      return NextResponse.redirect(loginUrl)
    }

    const userRole = token.role as UserRole

    // Contrôle d'accès basé sur les rôles avec hiérarchie
    if (!hasRouteAccess(userRole, pathname)) {
      // Rediriger vers une page d'erreur appropriée selon le contexte
      if (
        pathname.startsWith('/dashboard/admin') ||
        pathname.startsWith('/admin')
      ) {
        return NextResponse.redirect(
          new URL('/unauthorized?reason=admin_required', req.url)
        )
      }
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }

    // Redirection automatique intelligente vers le dashboard approprié
    if (pathname === '/dashboard') {
      const redirectPath = getDashboardRedirect(userRole)
      return NextResponse.redirect(new URL(redirectPath, req.url))
    }

    // Headers de sécurité renforcés pour toutes les routes protégées
    const response = NextResponse.next()
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('X-DNS-Prefetch-Control', 'off')
    response.headers.set(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=()'
    )

    // HSTS en production uniquement
    if (process.env.NODE_ENV === 'production') {
      response.headers.set(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
      )
    }

    // CSP renforcé pour les routes sensibles
    if (
      pathname.startsWith('/admin') ||
      pathname.startsWith('/dashboard/admin')
    ) {
      response.headers.set(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'nonce-' 'strict-dynamic'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://cdn.jsdelivr.net https://unpkg.com; font-src 'self' data:; connect-src 'self' https://api.stripe.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
      )
    } else if (pathname.startsWith('/dashboard')) {
      // CSP moins strict pour les autres routes du dashboard
      const scriptSrc =
        process.env.NODE_ENV === 'development'
          ? "'self' 'unsafe-inline' 'unsafe-eval'"
          : "'self' 'unsafe-inline'"

      response.headers.set(
        'Content-Security-Policy',
        `default-src 'self'; script-src ${scriptSrc}; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; frame-ancestors 'none';`
      )
    }

    return response
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Routes publiques toujours autorisées
        if (isPublicRoute(pathname)) {
          return true
        }

        // API routes d'authentification
        if (pathname.startsWith('/api/auth')) {
          return true
        }

        // Routes de santé et statut
        if (pathname.startsWith('/api/health') || pathname === '/api/status') {
          return true
        }

        // Toutes les autres routes nécessitent une authentification
        return !!token && !!token.isActive
      },
    },
  }
)

/**
 * Vérifie si une route est publique
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => {
    if (route.endsWith('*')) {
      return pathname.startsWith(route.slice(0, -1))
    }
    return pathname === route || pathname.startsWith(route + '/')
  })
}

/**
 * Vérifie l'accès à une route basé sur le rôle avec hiérarchie
 */
function hasRouteAccess(userRole: UserRole, pathname: string): boolean {
  // Routes publiques
  if (isPublicRoute(pathname)) {
    return true
  }

  // Trouver la route protégée correspondante (la plus spécifique d'abord)
  const matchingRoute = PROTECTED_ROUTES.sort(
    (a, b) => b.path.length - a.path.length
  ).find((route) => pathname.startsWith(route.path))

  if (!matchingRoute) {
    // Pour les routes non définies, appliquer des règles par défaut
    // Admin peut accéder à tout sauf routes spécifiquement interdites
    if (userRole === UserRole.ADMIN) {
      return true
    }
    // Autres rôles: accès refusé par défaut pour sécurité
    return false
  }

  // Vérifier la hiérarchie des rôles
  return matchingRoute.allowedRoles.some((allowedRole) => {
    return hasRoleHierarchy(userRole, allowedRole)
  })
}

/**
 * Vérifie la hiérarchie des rôles
 */
function hasRoleHierarchy(userRole: UserRole, requiredRole: UserRole): boolean {
  const hierarchy = {
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

  return hierarchy[userRole]?.includes(requiredRole) ?? false
}

/**
 * Retourne la redirection appropriée pour le dashboard
 */
function getDashboardRedirect(userRole: UserRole): string {
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
      return '/dashboard/client'
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes - handled separately)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, favicon.svg, logo.svg (static assets)
     * - public folder assets
     * - manifest.json, robots.txt, sitemap.xml
     * - Service worker files
     */
    '/((?!api|_next/static|_next/image|favicon\\.ico|favicon\\.svg|logo\\.svg|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)|manifest\\.json|robots\\.txt|sitemap\\.xml|sw\\.js|workbox-.*\\.js).*)',
  ],
}
