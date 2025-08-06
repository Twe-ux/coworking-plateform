/**
 * Mock Service Worker Server
 * Intercepte les requêtes HTTP pour les tests
 */

import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

// Gestionnaires des requêtes API
const handlers = [
  // Mock des endpoints NextAuth
  http.post('http://localhost:3000/api/auth/signin', async ({ request }) => {
    const body = await request.json()
    const { email, password } = body as { email: string; password: string }

    // Simuler la validation des credentials
    const validUsers = [
      { email: 'admin@example.com', password: 'password123', role: 'admin' },
      {
        email: 'manager@example.com',
        password: 'password123',
        role: 'manager',
      },
      { email: 'staff@example.com', password: 'password123', role: 'staff' },
      { email: 'client@example.com', password: 'password123', role: 'client' },
      { email: 'test@example.com', password: 'password123', role: 'client' },
    ]

    const user = validUsers.find(
      (u) => u.email === email && u.password === password
    )

    if (!user) {
      return new HttpResponse(null, {
        status: 401,
        statusText: 'Unauthorized',
      })
    }

    return HttpResponse.json({
      id: '1',
      email: user.email,
      role: user.role,
      isActive: true,
    })
  }),

  http.post('http://localhost:3000/api/auth/signout', () => {
    return new HttpResponse(null, { status: 200 })
  }),

  http.get('http://localhost:3000/api/auth/session', () => {
    return HttpResponse.json({
      user: global.testUser.client,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      csrfToken: 'mock-csrf-token',
    })
  }),

  // Mock des endpoints de l'API
  http.get('http://localhost:3000/api/users/profile', ({ request }) => {
    const authHeader = request.headers.get('Authorization')

    if (!authHeader) {
      return new HttpResponse(null, { status: 401 })
    }

    return HttpResponse.json(global.testUser.client)
  }),

  // Mock de la validation des permissions
  http.post('http://localhost:3000/api/auth/validate', async ({ request }) => {
    const body = await request.json()
    const { role, resource } = body as { role: string; resource: string }

    const permissions = {
      admin: ['admin', 'manager', 'staff', 'client'],
      manager: ['manager', 'staff', 'client'],
      staff: ['staff', 'client'],
      client: ['client'],
    }

    const hasPermission =
      permissions[role as keyof typeof permissions]?.includes(resource)

    return HttpResponse.json({ hasPermission })
  }),

  // Mock des erreurs de sécurité
  http.post('http://localhost:3000/api/auth/brute-force', () => {
    return new HttpResponse('Too Many Requests', { status: 429 })
  }),

  // Mock des endpoints de santé
  http.get('http://localhost:3000/api/health', () => {
    return HttpResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    })
  }),
]

// Configuration du serveur MSW
export const server = setupServer(...handlers)

// Helpers pour modifier les réponses pendant les tests
export const mockApiResponse = (
  endpoint: string,
  response: any,
  status = 200
) => {
  server.use(
    http.get(endpoint, () => {
      if (status >= 400) {
        return new HttpResponse(JSON.stringify(response), { status })
      }
      return HttpResponse.json(response)
    })
  )
}

export const mockApiError = (
  endpoint: string,
  status = 500,
  message = 'Internal Server Error'
) => {
  server.use(
    http.get(endpoint, () => {
      return new HttpResponse(message, { status })
    })
  )
}

// Helpers spécifiques pour les tests d'authentification
export const mockSuccessfulLogin = (user = global.testUser.client) => {
  server.use(
    http.post('http://localhost:3000/api/auth/signin', () => {
      return HttpResponse.json(user)
    })
  )
}

export const mockFailedLogin = (error = 'CredentialsSignin') => {
  server.use(
    http.post('http://localhost:3000/api/auth/signin', () => {
      return new HttpResponse(JSON.stringify({ error }), { status: 401 })
    })
  )
}

export const mockSessionExpired = () => {
  server.use(
    http.get('http://localhost:3000/api/auth/session', () => {
      return new HttpResponse(null, { status: 401 })
    })
  )
}
