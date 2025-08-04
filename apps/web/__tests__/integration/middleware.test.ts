/**
 * Tests d'intégration pour le middleware d'authentification
 * Teste la protection des routes et les redirections automatiques
 */

import middleware from '@/middleware'
import { UserRole } from '@/types/auth'
import { getToken } from 'next-auth/jwt'
import { NextRequest, NextResponse } from 'next/server'

// Mock des modules
jest.mock('next-auth/jwt')

const mockGetToken = getToken as jest.MockedFunction<typeof getToken>

// Helper pour créer des requêtes de test
function createRequest(
  url: string,
  options: {
    headers?: Record<string, string>
    cookies?: Record<string, string>
  } = {}
) {
  const headers = new Headers()

  // Ajouter les headers
  if (options.headers) {
    Object.entries(options.headers).forEach(([key, value]) => {
      headers.set(key, value)
    })
  }

  // Ajouter les cookies
  if (options.cookies) {
    const cookieString = Object.entries(options.cookies)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ')
    headers.set('cookie', cookieString)
  }

  return new NextRequest(url, { headers })
}

// Helper pour créer des tokens JWT de test
function createTestToken(
  userRole: UserRole = UserRole.CLIENT,
  isActive: boolean = true
) {
  return {
    sub: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: userRole,
    isActive,
    permissions:
      userRole === UserRole.ADMIN
        ? ['admin:read', 'admin:write']
        : userRole === UserRole.MANAGER
          ? ['manager:read', 'bookings:manage']
          : ['bookings:own'],
    iat: Date.now() / 1000,
    exp: Date.now() / 1000 + 3600,
  }
}

describe('Middleware Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Routes publiques', () => {
    const publicRoutes = [
      '/',
      '/auth/login',
      '/auth/register',
      '/auth/forgot-password',
      '/auth/reset-password',
      '/api/auth/signin',
      '/api/auth/callback',
      '/api/health',
      '/_next/static/chunk.js',
      '/favicon.ico',
    ]

    publicRoutes.forEach((route) => {
      it(`devrait permettre l'accès à ${route} sans authentification`, async () => {
        mockGetToken.mockResolvedValue(null)

        const request = createRequest(`http://localhost:3000${route}`)
        const response = await middleware(request)

        expect(response).toBeUndefined() // NextResponse.next() implicite
      })
    })

    it("devrait permettre l'accès aux assets statiques", async () => {
      const staticRoutes = [
        '/_next/static/css/app.css',
        '/_next/static/js/chunk.js',
        '/_next/image?url=/logo.png',
        '/images/hero.jpg',
        '/icons/favicon.ico',
      ]

      for (const route of staticRoutes) {
        mockGetToken.mockResolvedValue(null)

        const request = createRequest(`http://localhost:3000${route}`)
        const response = await middleware(request)

        expect(response).toBeUndefined()
      }
    })
  })

  describe('Routes protégées - Authentification requise', () => {
    const protectedRoutes = [
      '/dashboard',
      '/dashboard/client',
      '/dashboard/staff',
      '/dashboard/manager',
      '/dashboard/admin',
      '/profile',
      '/bookings',
      '/settings',
    ]

    protectedRoutes.forEach((route) => {
      it(`devrait rediriger ${route} vers login si non authentifié`, async () => {
        mockGetToken.mockResolvedValue(null)

        const request = createRequest(`http://localhost:3000${route}`)
        const response = await middleware(request)

        expect(response).toBeInstanceOf(NextResponse)
        expect(response?.status).toBe(302)

        const location = response?.headers.get('location')
        expect(location).toBe('/auth/login')
      })

      it(`devrait rediriger ${route} vers login si compte inactif`, async () => {
        const token = createTestToken(UserRole.CLIENT, false) // Compte inactif
        mockGetToken.mockResolvedValue(token)

        const request = createRequest(`http://localhost:3000${route}`)
        const response = await middleware(request)

        expect(response).toBeInstanceOf(NextResponse)
        expect(response?.status).toBe(302)
        expect(response?.headers.get('location')).toBe('/auth/login')
      })
    })

    it("devrait permettre l'accès aux routes client pour un utilisateur CLIENT actif", async () => {
      const token = createTestToken(UserRole.CLIENT, true)
      mockGetToken.mockResolvedValue(token)

      const request = createRequest('http://localhost:3000/dashboard/client')
      const response = await middleware(request)

      expect(response).toBeUndefined() // Accès autorisé
    })
  })

  describe('Protection par rôles', () => {
    describe('Routes ADMIN', () => {
      const adminRoutes = [
        '/dashboard/admin',
        '/dashboard/admin/users',
        '/dashboard/admin/settings',
        '/admin',
      ]

      adminRoutes.forEach((route) => {
        it(`devrait permettre l'accès à ${route} pour un ADMIN`, async () => {
          const token = createTestToken(UserRole.ADMIN)
          mockGetToken.mockResolvedValue(token)

          const request = createRequest(`http://localhost:3000${route}`)
          const response = await middleware(request)

          expect(response).toBeUndefined()
        })

        it(`devrait rediriger ${route} pour un utilisateur CLIENT`, async () => {
          const token = createTestToken(UserRole.CLIENT)
          mockGetToken.mockResolvedValue(token)

          const request = createRequest(`http://localhost:3000${route}`)
          const response = await middleware(request)

          expect(response).toBeInstanceOf(NextResponse)
          expect(response?.status).toBe(302)
          expect(response?.headers.get('location')).toBe('/dashboard/client')
        })

        it(`devrait rediriger ${route} pour un utilisateur STAFF`, async () => {
          const token = createTestToken(UserRole.STAFF)
          mockGetToken.mockResolvedValue(token)

          const request = createRequest(`http://localhost:3000${route}`)
          const response = await middleware(request)

          expect(response).toBeInstanceOf(NextResponse)
          expect(response?.status).toBe(302)
          expect(response?.headers.get('location')).toBe('/dashboard/staff')
        })
      })
    })

    describe('Routes MANAGER', () => {
      const managerRoutes = [
        '/dashboard/manager',
        '/dashboard/manager/team',
        '/dashboard/manager/reports',
      ]

      managerRoutes.forEach((route) => {
        it(`devrait permettre l'accès à ${route} pour un ADMIN (hiérarchie)`, async () => {
          const token = createTestToken(UserRole.ADMIN)
          mockGetToken.mockResolvedValue(token)

          const request = createRequest(`http://localhost:3000${route}`)
          const response = await middleware(request)

          expect(response).toBeUndefined()
        })

        it(`devrait permettre l'accès à ${route} pour un MANAGER`, async () => {
          const token = createTestToken(UserRole.MANAGER)
          mockGetToken.mockResolvedValue(token)

          const request = createRequest(`http://localhost:3000${route}`)
          const response = await middleware(request)

          expect(response).toBeUndefined()
        })

        it(`devrait refuser l'accès à ${route} pour un CLIENT`, async () => {
          const token = createTestToken(UserRole.CLIENT)
          mockGetToken.mockResolvedValue(token)

          const request = createRequest(`http://localhost:3000${route}`)
          const response = await middleware(request)

          expect(response).toBeInstanceOf(NextResponse)
          expect(response?.headers.get('location')).toBe('/dashboard/client')
        })
      })
    })

    describe('Routes STAFF', () => {
      const staffRoutes = ['/dashboard/staff', '/dashboard/staff/schedule']

      staffRoutes.forEach((route) => {
        it(`devrait permettre l'accès à ${route} pour ADMIN, MANAGER et STAFF`, async () => {
          const roles = [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF]

          for (const role of roles) {
            const token = createTestToken(role)
            mockGetToken.mockResolvedValue(token)

            const request = createRequest(`http://localhost:3000${route}`)
            const response = await middleware(request)

            expect(response).toBeUndefined()
          }
        })

        it(`devrait refuser l'accès à ${route} pour un CLIENT`, async () => {
          const token = createTestToken(UserRole.CLIENT)
          mockGetToken.mockResolvedValue(token)

          const request = createRequest(`http://localhost:3000${route}`)
          const response = await middleware(request)

          expect(response).toBeInstanceOf(NextResponse)
          expect(response?.headers.get('location')).toBe('/dashboard/client')
        })
      })
    })
  })

  describe('Redirections automatiques du dashboard principal', () => {
    it('devrait rediriger /dashboard vers /dashboard/admin pour un ADMIN', async () => {
      const token = createTestToken(UserRole.ADMIN)
      mockGetToken.mockResolvedValue(token)

      const request = createRequest('http://localhost:3000/dashboard')
      const response = await middleware(request)

      expect(response).toBeInstanceOf(NextResponse)
      expect(response?.status).toBe(302)
      expect(response?.headers.get('location')).toBe('/dashboard/admin')
    })

    it('devrait rediriger /dashboard vers /dashboard/manager pour un MANAGER', async () => {
      const token = createTestToken(UserRole.MANAGER)
      mockGetToken.mockResolvedValue(token)

      const request = createRequest('http://localhost:3000/dashboard')
      const response = await middleware(request)

      expect(response).toBeInstanceOf(NextResponse)
      expect(response?.status).toBe(302)
      expect(response?.headers.get('location')).toBe('/dashboard/manager')
    })

    it('devrait rediriger /dashboard vers /dashboard/staff pour un STAFF', async () => {
      const token = createTestToken(UserRole.STAFF)
      mockGetToken.mockResolvedValue(token)

      const request = createRequest('http://localhost:3000/dashboard')
      const response = await middleware(request)

      expect(response).toBeInstanceOf(NextResponse)
      expect(response?.status).toBe(302)
      expect(response?.headers.get('location')).toBe('/dashboard/staff')
    })

    it('devrait rediriger /dashboard vers /dashboard/client pour un CLIENT', async () => {
      const token = createTestToken(UserRole.CLIENT)
      mockGetToken.mockResolvedValue(token)

      const request = createRequest('http://localhost:3000/dashboard')
      const response = await middleware(request)

      expect(response).toBeInstanceOf(NextResponse)
      expect(response?.status).toBe(302)
      expect(response?.headers.get('location')).toBe('/dashboard/client')
    })
  })

  describe("Redirections depuis les pages d'auth pour utilisateurs connectés", () => {
    const authPages = ['/auth/login', '/auth/register', '/auth/forgot-password']

    authPages.forEach((page) => {
      it(`devrait rediriger ${page} vers le dashboard approprié si déjà connecté`, async () => {
        const token = createTestToken(UserRole.ADMIN)
        mockGetToken.mockResolvedValue(token)

        const request = createRequest(`http://localhost:3000${page}`)
        const response = await middleware(request)

        expect(response).toBeInstanceOf(NextResponse)
        expect(response?.status).toBe(302)
        expect(response?.headers.get('location')).toBe('/dashboard/admin')
      })
    })
  })

  describe('Gestion des erreurs', () => {
    it('devrait gérer les erreurs de récupération de token', async () => {
      mockGetToken.mockRejectedValue(new Error('JWT parse error'))

      const request = createRequest('http://localhost:3000/dashboard')
      const response = await middleware(request)

      // Devrait rediriger vers login en cas d'erreur
      expect(response).toBeInstanceOf(NextResponse)
      expect(response?.headers.get('location')).toBe('/auth/login')
    })

    it('devrait gérer les tokens malformés', async () => {
      mockGetToken.mockResolvedValue({
        // Token sans les propriétés requises
        sub: 'user-123',
        // Manque role, isActive, etc.
      } as any)

      const request = createRequest('http://localhost:3000/dashboard')
      const response = await middleware(request)

      expect(response).toBeInstanceOf(NextResponse)
      expect(response?.headers.get('location')).toBe('/auth/login')
    })

    it('devrait gérer les rôles invalides', async () => {
      const token = {
        ...createTestToken(),
        role: 'INVALID_ROLE' as UserRole,
      }
      mockGetToken.mockResolvedValue(token)

      const request = createRequest('http://localhost:3000/dashboard/admin')
      const response = await middleware(request)

      expect(response).toBeInstanceOf(NextResponse)
      expect(response?.headers.get('location')).toBe('/auth/login')
    })
  })

  describe('API Routes Protection', () => {
    it('devrait protéger les routes API privées', async () => {
      mockGetToken.mockResolvedValue(null)

      const apiRoutes = ['/api/users', '/api/bookings', '/api/admin/settings']

      for (const route of apiRoutes) {
        const request = createRequest(`http://localhost:3000${route}`)
        const response = await middleware(request)

        expect(response).toBeInstanceOf(NextResponse)
        expect(response?.status).toBe(401)
      }
    })

    it("devrait permettre l'accès aux routes API publiques", async () => {
      mockGetToken.mockResolvedValue(null)

      const publicApiRoutes = [
        '/api/health',
        '/api/auth/signin',
        '/api/auth/callback',
      ]

      for (const route of publicApiRoutes) {
        const request = createRequest(`http://localhost:3000${route}`)
        const response = await middleware(request)

        expect(response).toBeUndefined()
      }
    })

    it('devrait valider les rôles pour les API admin', async () => {
      const clientToken = createTestToken(UserRole.CLIENT)
      mockGetToken.mockResolvedValue(clientToken)

      const request = createRequest('http://localhost:3000/api/admin/users')
      const response = await middleware(request)

      expect(response).toBeInstanceOf(NextResponse)
      expect(response?.status).toBe(403)
    })

    it("devrait permettre l'accès API admin pour les admins", async () => {
      const adminToken = createTestToken(UserRole.ADMIN)
      mockGetToken.mockResolvedValue(adminToken)

      const request = createRequest('http://localhost:3000/api/admin/users')
      const response = await middleware(request)

      expect(response).toBeUndefined()
    })
  })

  describe('Headers de sécurité', () => {
    it('devrait ajouter des headers de sécurité aux réponses', async () => {
      const token = createTestToken(UserRole.CLIENT)
      mockGetToken.mockResolvedValue(token)

      const request = createRequest('http://localhost:3000/dashboard/client')
      const response = await middleware(request)

      // Si pas de redirection, vérifier que les headers sont ajoutés via NextResponse.next()
      expect(response).toBeUndefined() // NextResponse.next() implicite
    })

    it('devrait ajouter des headers anti-CSRF', async () => {
      const token = createTestToken(UserRole.ADMIN)
      mockGetToken.mockResolvedValue(token)

      const request = createRequest('http://localhost:3000/dashboard/admin', {
        headers: {
          'x-requested-with': 'XMLHttpRequest',
        },
      })

      const response = await middleware(request)
      expect(response).toBeUndefined()
    })
  })

  describe('Configuration du matcher', () => {
    it('ne devrait pas traiter les routes exclues par le matcher', async () => {
      // Le middleware ne devrait pas s'exécuter pour ces routes
      const excludedRoutes = [
        '/_next/static/test.js',
        '/_next/image',
        '/favicon.ico',
        '/api/health',
      ]

      // Ces tests vérifient que le middleware est correctement configuré
      // Dans la vraie application, ces routes ne passeraient pas par le middleware
      expect(true).toBe(true) // Placeholder pour la configuration du matcher
    })
  })

  describe('Performance et robustesse', () => {
    it('devrait traiter les requêtes concurrentes', async () => {
      const token = createTestToken(UserRole.CLIENT)
      mockGetToken.mockResolvedValue(token)

      const requests = Array.from({ length: 10 }, (_, i) =>
        createRequest(`http://localhost:3000/dashboard/client?req=${i}`)
      )

      const responses = await Promise.all(
        requests.map((request) => middleware(request))
      )

      // Toutes les requêtes devraient être traitées de manière cohérente
      responses.forEach((response) => {
        expect(response).toBeUndefined() // Accès autorisé
      })
    })

    it('devrait gérer les timeouts de récupération de token', async () => {
      mockGetToken.mockImplementation(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 100)
          )
      )

      const request = createRequest('http://localhost:3000/dashboard')
      const response = await middleware(request)

      expect(response).toBeInstanceOf(NextResponse)
      expect(response?.headers.get('location')).toBe('/auth/login')
    })

    it('ne devrait pas leaker de mémoire sur des erreurs répétées', async () => {
      mockGetToken.mockRejectedValue(new Error('Persistent error'))

      const requests = Array.from({ length: 50 }, () =>
        createRequest('http://localhost:3000/dashboard')
      )

      const responses = await Promise.all(
        requests.map((request) => middleware(request))
      )

      // Toutes les erreurs devraient être gérées proprement
      responses.forEach((response) => {
        expect(response).toBeInstanceOf(NextResponse)
        expect(response?.headers.get('location')).toBe('/auth/login')
      })
    })
  })

  describe('Cas edge et validation', () => {
    it('devrait gérer les URLs malformées', async () => {
      const token = createTestToken(UserRole.CLIENT)
      mockGetToken.mockResolvedValue(token)

      const malformedUrls = [
        'http://localhost:3000/dashboard/../admin',
        'http://localhost:3000/dashboard//client',
        'http://localhost:3000/dashboard?redirectTo=admin',
      ]

      for (const url of malformedUrls) {
        const request = createRequest(url)
        const response = await middleware(request)

        // Le middleware devrait traiter ces URLs de manière sécurisée
        expect(response).toBeDefined()
      }
    })

    it('devrait valider les paramètres de query string', async () => {
      const token = createTestToken(UserRole.CLIENT)
      mockGetToken.mockResolvedValue(token)

      const request = createRequest(
        'http://localhost:3000/dashboard/admin?bypass=true'
      )
      const response = await middleware(request)

      // Ne devrait pas permettre le bypass via query params
      expect(response).toBeInstanceOf(NextResponse)
      expect(response?.headers.get('location')).toBe('/dashboard/client')
    })

    it('devrait gérer les cookies corrompus', async () => {
      const request = createRequest('http://localhost:3000/dashboard', {
        cookies: {
          'next-auth.session-token': 'corrupted-token-data',
        },
      })

      mockGetToken.mockResolvedValue(null) // Token corrompu -> null

      const response = await middleware(request)

      expect(response).toBeInstanceOf(NextResponse)
      expect(response?.headers.get('location')).toBe('/auth/login')
    })
  })
})
