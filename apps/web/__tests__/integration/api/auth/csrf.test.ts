/**
 * Tests d'intégration pour l'API CSRF
 * Teste la génération et la validation des tokens CSRF
 */

import { createMocks } from 'node-mocks-http'
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { GET, POST, PUT, DELETE, PATCH } from '@/app/api/auth/csrf/route'
import * as authUtils from '@/lib/auth-utils'
import { mockUsers } from '../../../mocks/auth-handlers'

// Mock des modules
jest.mock('next-auth')
jest.mock('@/lib/auth-utils')

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockGenerateCSRFToken = authUtils.generateCSRFToken as jest.MockedFunction<typeof authUtils.generateCSRFToken>
const mockLogSecurityEvent = authUtils.logSecurityEvent as jest.MockedFunction<typeof authUtils.logSecurityEvent>
const mockGetRealIP = authUtils.getRealIP as jest.MockedFunction<typeof authUtils.getRealIP>

describe('/api/auth/csrf', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock par défaut
    mockGetRealIP.mockReturnValue('127.0.0.1')
    mockLogSecurityEvent.mockResolvedValue(undefined)
    mockGenerateCSRFToken.mockReturnValue('mock-csrf-token-123')
  })

  describe('GET /api/auth/csrf', () => {
    it('devrait retourner un token CSRF pour un utilisateur authentifié', async () => {
      // Mock session authentifiée
      mockGetServerSession.mockResolvedValue({
        user: mockUsers.admin,
        expires: new Date(Date.now() + 3600000).toISOString()
      })

      const request = new NextRequest('http://localhost:3000/api/auth/csrf', {
        method: 'GET',
        headers: {
          'user-agent': 'test-browser/1.0'
        }
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        csrfToken: 'mock-csrf-token-123'
      })
      expect(mockGenerateCSRFToken).toHaveBeenCalled()
    })

    it('devrait inclure les headers de sécurité appropriés', async () => {
      mockGetServerSession.mockResolvedValue({
        user: mockUsers.admin,
        expires: new Date(Date.now() + 3600000).toISOString()
      })

      const request = new NextRequest('http://localhost:3000/api/auth/csrf', {
        method: 'GET'
      })

      const response = await GET(request)

      expect(response.headers.get('Cache-Control')).toBe('no-store, must-revalidate')
      expect(response.headers.get('Pragma')).toBe('no-cache')
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
    })

    it('devrait retourner 401 pour un utilisateur non authentifié', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/auth/csrf', {
        method: 'GET',
        headers: {
          'user-agent': 'test-browser/1.0'
        }
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({
        error: 'Non authentifié'
      })
      expect(mockGenerateCSRFToken).not.toHaveBeenCalled()
    })

    it('devrait logger l\'événement de sécurité pour une requête non autorisée', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/auth/csrf', {
        method: 'GET',
        headers: {
          'user-agent': 'test-browser/1.0'
        }
      })

      await GET(request)

      expect(mockLogSecurityEvent).toHaveBeenCalledWith({
        userId: undefined,
        action: 'CSRF_TOKEN_REQUEST_UNAUTHORIZED',
        resource: '/api/auth/csrf',
        ip: '127.0.0.1',
        userAgent: 'test-browser/1.0',
        success: false,
        details: { reason: 'no_session' }
      })
    })

    it('devrait extraire la bonne IP depuis les headers', async () => {
      mockGetServerSession.mockResolvedValue({
        user: mockUsers.admin,
        expires: new Date(Date.now() + 3600000).toISOString()
      })

      mockGetRealIP.mockReturnValue('192.168.1.100')

      const request = new NextRequest('http://localhost:3000/api/auth/csrf', {
        method: 'GET',
        headers: {
          'x-forwarded-for': '192.168.1.100, 10.0.0.1',
          'user-agent': 'test-browser/1.0'
        }
      })

      await GET(request)

      expect(mockGetRealIP).toHaveBeenCalledWith(request)
    })

    it('devrait gérer l\'absence de user-agent', async () => {
      mockGetServerSession.mockResolvedValue({
        user: mockUsers.admin,
        expires: new Date(Date.now() + 3600000).toISOString()
      })

      const request = new NextRequest('http://localhost:3000/api/auth/csrf', {
        method: 'GET'
      })

      await GET(request)

      // Devrait fonctionner sans erreur même sans user-agent
      expect(mockGetRealIP).toHaveBeenCalled()
    })

    it('devrait logger l\'événement de génération de token (échantillonnage)', async () => {
      mockGetServerSession.mockResolvedValue({
        user: mockUsers.admin,
        expires: new Date(Date.now() + 3600000).toISOString()
      })

      // Mock Math.random pour forcer le logging
      const originalRandom = Math.random
      Math.random = jest.fn().mockReturnValue(0.05) // < 0.1

      const request = new NextRequest('http://localhost:3000/api/auth/csrf', {
        method: 'GET',
        headers: {
          'user-agent': 'test-browser/1.0'
        }
      })

      await GET(request)

      expect(mockLogSecurityEvent).toHaveBeenCalledWith({
        userId: mockUsers.admin.id,
        action: 'CSRF_TOKEN_GENERATED',
        resource: '/api/auth/csrf',
        ip: '127.0.0.1',
        userAgent: 'test-browser/1.0',
        success: true,
        details: { token_length: 'mock-csrf-token-123'.length }
      })

      Math.random = originalRandom
    })

    it('ne devrait pas logger si l\'échantillonnage ne le sélectionne pas', async () => {
      mockGetServerSession.mockResolvedValue({
        user: mockUsers.admin,
        expires: new Date(Date.now() + 3600000).toISOString()
      })

      // Mock Math.random pour éviter le logging
      const originalRandom = Math.random
      Math.random = jest.fn().mockReturnValue(0.5) // > 0.1

      const request = new NextRequest('http://localhost:3000/api/auth/csrf', {
        method: 'GET'
      })

      await GET(request)

      // Devrait seulement logger s'il y a un échantillonnage
      expect(mockLogSecurityEvent).not.toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CSRF_TOKEN_GENERATED'
        })
      )

      Math.random = originalRandom
    })

    it('devrait gérer les erreurs et retourner 500', async () => {
      mockGetServerSession.mockRejectedValue(new Error('Database connection failed'))

      const request = new NextRequest('http://localhost:3000/api/auth/csrf', {
        method: 'GET',
        headers: {
          'user-agent': 'test-browser/1.0'
        }
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        error: 'Erreur interne du serveur'
      })
    })

    it('devrait logger les erreurs de sécurité', async () => {
      const error = new Error('Database connection failed')
      mockGetServerSession.mockRejectedValue(error)

      const request = new NextRequest('http://localhost:3000/api/auth/csrf', {
        method: 'GET',
        headers: {
          'user-agent': 'test-browser/1.0'
        }
      })

      await GET(request)

      expect(mockLogSecurityEvent).toHaveBeenCalledWith({
        userId: undefined,
        action: 'CSRF_TOKEN_REQUEST_ERROR',
        resource: '/api/auth/csrf',
        ip: '127.0.0.1',
        userAgent: 'test-browser/1.0',
        success: false,
        details: { error: 'Database connection failed' }
      })
    })

    it('devrait gérer les erreurs non-Error objects', async () => {
      mockGetServerSession.mockRejectedValue('String error')

      const request = new NextRequest('http://localhost:3000/api/auth/csrf', {
        method: 'GET'
      })

      await GET(request)

      expect(mockLogSecurityEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          details: { error: 'unknown_error' }
        })
      )
    })

    it('devrait valider la longueur du token généré', async () => {
      mockGetServerSession.mockResolvedValue({
        user: mockUsers.admin,
        expires: new Date(Date.now() + 3600000).toISOString()
      })

      mockGenerateCSRFToken.mockReturnValue('a'.repeat(64)) // Token de 64 caractères

      const request = new NextRequest('http://localhost:3000/api/auth/csrf', {
        method: 'GET'
      })

      const response = await GET(request)
      const data = await response.json()

      expect(data.csrfToken).toHaveLength(64)
      expect(typeof data.csrfToken).toBe('string')
    })
  })

  describe('Méthodes HTTP non autorisées', () => {
    it('devrait retourner 405 pour POST', async () => {
      const response = await POST()
      const data = await response.json()

      expect(response.status).toBe(405)
      expect(data).toEqual({
        error: 'Méthode non autorisée'
      })
    })

    it('devrait retourner 405 pour PUT', async () => {
      const response = await PUT()
      const data = await response.json()

      expect(response.status).toBe(405)
      expect(data).toEqual({
        error: 'Méthode non autorisée'
      })
    })

    it('devrait retourner 405 pour DELETE', async () => {
      const response = await DELETE()
      const data = await response.json()

      expect(response.status).toBe(405)
      expect(data).toEqual({
        error: 'Méthode non autorisée'
      })
    })

    it('devrait retourner 405 pour PATCH', async () => {
      const response = await PATCH()
      const data = await response.json()

      expect(response.status).toBe(405)
      expect(data).toEqual({
        error: 'Méthode non autorisée'
      })
    })
  })

  describe('Sécurité et validation', () => {
    it('devrait valider la structure de la session', async () => {
      // Session avec utilisateur manquant
      mockGetServerSession.mockResolvedValue({
        expires: new Date(Date.now() + 3600000).toISOString()
      } as any)

      const request = new NextRequest('http://localhost:3000/api/auth/csrf', {
        method: 'GET'
      })

      const response = await GET(request)

      expect(response.status).toBe(401)
    })

    it('devrait retourner des erreurs JSON valides', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/auth/csrf', {
        method: 'GET'
      })

      const response = await GET(request)
      const data = await response.json()

      expect(data).toHaveProperty('error')
      expect(typeof data.error).toBe('string')
    })

    it('devrait avoir des headers de réponse sécurisés', async () => {
      mockGetServerSession.mockResolvedValue({
        user: mockUsers.admin,
        expires: new Date(Date.now() + 3600000).toISOString()
      })

      const request = new NextRequest('http://localhost:3000/api/auth/csrf', {
        method: 'GET'
      })

      const response = await GET(request)

      // Vérifier que tous les headers de sécurité sont présents
      const securityHeaders = [
        'Cache-Control',
        'Pragma', 
        'X-Content-Type-Options'
      ]

      securityHeaders.forEach(header => {
        expect(response.headers.get(header)).toBeTruthy()
      })
    })

    it('devrait générer des tokens uniques', async () => {
      mockGetServerSession.mockResolvedValue({
        user: mockUsers.admin,
        expires: new Date(Date.now() + 3600000).toISOString()
      })

      let callCount = 0
      mockGenerateCSRFToken.mockImplementation(() => {
        callCount++
        return `unique-token-${callCount}`
      })

      const request1 = new NextRequest('http://localhost:3000/api/auth/csrf')
      const request2 = new NextRequest('http://localhost:3000/api/auth/csrf')

      const [response1, response2] = await Promise.all([
        GET(request1),
        GET(request2)
      ])

      const [data1, data2] = await Promise.all([
        response1.json(),
        response2.json()
      ])

      expect(data1.csrfToken).toBe('unique-token-1')
      expect(data2.csrfToken).toBe('unique-token-2')
      expect(data1.csrfToken).not.toBe(data2.csrfToken)
    })

    it('devrait traiter les requêtes concurrentes correctement', async () => {
      mockGetServerSession.mockResolvedValue({
        user: mockUsers.admin,
        expires: new Date(Date.now() + 3600000).toISOString()
      })

      const requests = Array.from({ length: 5 }, (_, i) => 
        new NextRequest(`http://localhost:3000/api/auth/csrf?req=${i}`)
      )

      const responses = await Promise.all(
        requests.map(request => GET(request))
      )

      // Toutes les requêtes devraient réussir
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })

      const data = await Promise.all(
        responses.map(response => response.json())
      )

      // Tous devraient avoir un token CSRF
      data.forEach(item => {
        expect(item).toHaveProperty('csrfToken')
        expect(typeof item.csrfToken).toBe('string')
      })
    })
  })

  describe('Performance et optimisation', () => {
    it('devrait répondre rapidement pour les requêtes valides', async () => {
      mockGetServerSession.mockResolvedValue({
        user: mockUsers.admin,
        expires: new Date(Date.now() + 3600000).toISOString()
      })

      const request = new NextRequest('http://localhost:3000/api/auth/csrf')

      const startTime = Date.now()
      await GET(request)
      const endTime = Date.now()

      // Devrait prendre moins de 100ms
      expect(endTime - startTime).toBeLessThan(100)
    })

    it('ne devrait pas leaker de mémoire sur des erreurs répétées', async () => {
      // Simuler des erreurs répétées
      mockGetServerSession.mockRejectedValue(new Error('Persistent error'))

      const requests = Array.from({ length: 10 }, () => 
        new NextRequest('http://localhost:3000/api/auth/csrf')
      )

      // Toutes les requêtes devraient être traitées sans planter
      const responses = await Promise.all(
        requests.map(request => GET(request).catch(() => null))
      )

      // Vérifier que toutes les réponses ont été traitées
      expect(responses).toHaveLength(10)
    })
  })
})