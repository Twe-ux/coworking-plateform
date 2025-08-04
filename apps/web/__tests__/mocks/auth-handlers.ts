/**
 * Handlers MSW pour les API routes d'authentification
 * Mock les endpoints NextAuth et les routes d'authentification personnalisées
 */

import { rest } from 'msw'
import { UserRole } from '@/types/auth'

// Données de test pour les utilisateurs
export const mockUsers = {
  admin: {
    id: 'admin-1',
    email: 'admin@coworking.com',
    firstName: 'Admin',
    lastName: 'User',
    role: UserRole.ADMIN,
    permissions: ['admin:read', 'admin:write', 'users:manage'],
    isActive: true,
    lastLoginAt: new Date('2024-01-15T10:00:00Z'),
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
  },
  manager: {
    id: 'manager-1',
    email: 'manager@coworking.com',
    firstName: 'Manager',
    lastName: 'User',
    role: UserRole.MANAGER,
    permissions: ['spaces:manage', 'bookings:manage'],
    isActive: true,
    lastLoginAt: new Date('2024-01-15T09:00:00Z'),
    createdAt: new Date('2024-01-02T10:00:00Z'),
    updatedAt: new Date('2024-01-15T09:00:00Z'),
  },
  staff: {
    id: 'staff-1',
    email: 'staff@coworking.com',
    firstName: 'Staff',
    lastName: 'User',
    role: UserRole.STAFF,
    permissions: ['bookings:read', 'spaces:read'],
    isActive: true,
    lastLoginAt: new Date('2024-01-15T08:00:00Z'),
    createdAt: new Date('2024-01-03T10:00:00Z'),
    updatedAt: new Date('2024-01-15T08:00:00Z'),
  },
  client: {
    id: 'client-1',
    email: 'client@coworking.com',
    firstName: 'Client',
    lastName: 'User',
    role: UserRole.CLIENT,
    permissions: ['bookings:own'],
    isActive: true,
    lastLoginAt: new Date('2024-01-15T07:00:00Z'),
    createdAt: new Date('2024-01-04T10:00:00Z'),
    updatedAt: new Date('2024-01-15T07:00:00Z'),
  },
  inactive: {
    id: 'inactive-1',
    email: 'inactive@coworking.com',
    firstName: 'Inactive',
    lastName: 'User',
    role: UserRole.CLIENT,
    permissions: [],
    isActive: false,
    lastLoginAt: new Date('2024-01-01T10:00:00Z'),
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z'),
  },
}

// Mots de passe de test (en production, ils seraient hashés)
export const mockPasswords = {
  'admin@coworking.com': 'AdminPassword123!',
  'manager@coworking.com': 'ManagerPassword123!',
  'staff@coworking.com': 'StaffPassword123!',
  'client@coworking.com': 'ClientPassword123!',
  'inactive@coworking.com': 'InactivePassword123!',
}

// Sessions mockées pour les tests
export const mockSessions = new Map<string, any>()

// Handlers pour les routes d'authentification
export const handlers = [
  // NextAuth CSRF endpoint
  rest.get('/api/auth/csrf', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        csrfToken: 'test-csrf-token-123',
      })
    )
  }),

  // NextAuth session endpoint
  rest.get('/api/auth/session', (req, res, ctx) => {
    const authHeader = req.headers.get('authorization')
    const sessionToken = req.cookies['next-auth.session-token'] || req.cookies['__Secure-next-auth.session-token']
    
    if (!authHeader && !sessionToken) {
      return res(
        ctx.status(200),
        ctx.json({})
      )
    }

    // Simuler une session basée sur le token
    const mockSession = mockSessions.get(sessionToken || 'default')
    
    if (mockSession) {
      return res(
        ctx.status(200),
        ctx.json({
          user: mockSession.user,
          accessToken: mockSession.accessToken,
          csrfToken: 'test-csrf-token-123',
          expires: mockSession.expires,
        })
      )
    }

    return res(
      ctx.status(200),
      ctx.json({})
    )
  }),

  // NextAuth signin endpoint
  rest.post('/api/auth/signin/credentials', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        url: 'http://localhost:3000/dashboard'
      })
    )
  }),

  // Connexion avec credentials
  rest.post('/api/auth/callback/credentials', async (req, res, ctx) => {
    const body = await req.json()
    const { email, password } = body

    // Vérifier les credentials
    if (mockPasswords[email as keyof typeof mockPasswords] === password) {
      const user = Object.values(mockUsers).find(u => u.email === email)
      
      if (user && user.isActive) {
        // Créer une session mockée
        const sessionToken = `session-${user.id}-${Date.now()}`
        const session = {
          user,
          accessToken: `access-${user.id}-${Date.now()}`,
          csrfToken: 'test-csrf-token-123',
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
        }
        
        mockSessions.set(sessionToken, session)
        
        return res(
          ctx.status(200),
          ctx.cookie('next-auth.session-token', sessionToken),
          ctx.json({
            url: 'http://localhost:3000/dashboard',
            ok: true,
          })
        )
      } else if (user && !user.isActive) {
        return res(
          ctx.status(401),
          ctx.json({
            error: 'AccountDisabled',
            message: 'Votre compte a été désactivé.',
          })
        )
      }
    }

    return res(
      ctx.status(401),
      ctx.json({
        error: 'CredentialsSignin',
        message: 'Email ou mot de passe incorrect.',
      })
    )
  }),

  // Inscription
  rest.post('/api/auth/register', async (req, res, ctx) => {
    const body = await req.json()
    const { email, password, firstName, lastName } = body

    // Simuler une validation
    if (!email || !password || !firstName || !lastName) {
      return res(
        ctx.status(400),
        ctx.json({
          message: 'Tous les champs sont requis.',
        })
      )
    }

    // Vérifier si l'email existe déjà
    const existingUser = Object.values(mockUsers).find(u => u.email === email)
    if (existingUser) {
      return res(
        ctx.status(409),
        ctx.json({
          message: 'Un compte avec cette adresse email existe déjà.',
        })
      )
    }

    // Valider le mot de passe
    if (password.length < 8) {
      return res(
        ctx.status(400),
        ctx.json({
          message: 'Le mot de passe doit contenir au moins 8 caractères.',
        })
      )
    }

    // Simuler la création d'un compte
    return res(
      ctx.status(201),
      ctx.json({
        message: 'Compte créé avec succès.',
        user: {
          id: `new-user-${Date.now()}`,
          email,
          firstName,
          lastName,
          role: UserRole.CLIENT,
          isActive: true,
        },
      })
    )
  }),

  // Mot de passe oublié
  rest.post('/api/auth/forgot-password', async (req, res, ctx) => {
    const body = await req.json()
    const { email } = body

    if (!email) {
      return res(
        ctx.status(400),
        ctx.json({
          message: 'L\'adresse email est requise.',
        })
      )
    }

    // Toujours retourner succès pour la sécurité (ne pas révéler si l'email existe)
    return res(
      ctx.status(200),
      ctx.json({
        message: 'Si cette adresse email existe, un lien de réinitialisation a été envoyé.',
      })
    )
  }),

  // Réinitialisation du mot de passe
  rest.post('/api/auth/reset-password', async (req, res, ctx) => {
    const body = await req.json()
    const { token, password } = body

    if (!token || !password) {
      return res(
        ctx.status(400),
        ctx.json({
          message: 'Token et nouveau mot de passe requis.',
        })
      )
    }

    // Simuler la validation du token
    if (token === 'invalid-token') {
      return res(
        ctx.status(400),
        ctx.json({
          message: 'Token invalide ou expiré.',
        })
      )
    }

    // Valider le nouveau mot de passe
    if (password.length < 8) {
      return res(
        ctx.status(400),
        ctx.json({
          message: 'Le mot de passe doit contenir au moins 8 caractères.',
        })
      )
    }

    return res(
      ctx.status(200),
      ctx.json({
        message: 'Mot de passe réinitialisé avec succès.',
      })
    )
  }),

  // Déconnexion
  rest.post('/api/auth/signout', (req, res, ctx) => {
    const sessionToken = req.cookies['next-auth.session-token'] || req.cookies['__Secure-next-auth.session-token']
    
    if (sessionToken) {
      mockSessions.delete(sessionToken)
    }

    return res(
      ctx.status(200),
      ctx.cookie('next-auth.session-token', '', { maxAge: 0 }),
      ctx.json({
        url: 'http://localhost:3000/auth/login'
      })
    )
  }),

  // Endpoint de vérification de santé
  rest.get('/api/health', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
      })
    )
  }),

  // Fallback pour les routes non mockées
  rest.all('*', (req, res, ctx) => {
    console.warn(`Unhandled ${req.method} request to ${req.url}`)
    return res(
      ctx.status(404),
      ctx.json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.url} not found in MSW handlers`,
      })
    )
  }),
]

// Helpers pour les tests
export const createMockSession = (userType: keyof typeof mockUsers) => {
  const user = mockUsers[userType]
  const sessionToken = `test-session-${user.id}`
  const session = {
    user,
    accessToken: `test-access-${user.id}`,
    csrfToken: 'test-csrf-token-123',
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }
  
  mockSessions.set(sessionToken, session)
  return { sessionToken, session }
}

export const clearMockSessions = () => {
  mockSessions.clear()
}

export const getMockUser = (userType: keyof typeof mockUsers) => {
  return mockUsers[userType]
}