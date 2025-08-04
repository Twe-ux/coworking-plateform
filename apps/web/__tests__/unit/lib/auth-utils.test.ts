/**
 * Tests unitaires pour auth-utils
 * Teste toutes les fonctions utilitaires d'authentification et de sécurité
 */

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { UserRole } from '@/types/auth'
import {
  hasRole,
  hasRouteAccess,
  isPublicRoute,
  generateCSRFToken,
  validateCSRFToken,
  getRealIP,
  validatePasswordStrength,
  logSecurityEvent,
  isSessionValid,
  getRedirectPath,
  checkBruteForce,
  recordFailedLogin,
  resetLoginAttempts,
  getSecureServerSession,
} from '@/lib/auth-utils'

// Mock des modules
jest.mock('next-auth')
jest.mock('crypto')

describe('auth-utils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock de crypto.randomBytes
    const crypto = require('crypto')
    crypto.randomBytes.mockReturnValue({
      toString: jest.fn().mockReturnValue('test-random-string')
    })
    crypto.timingSafeEqual.mockReturnValue(true)
    crypto.randomUUID.mockReturnValue('test-uuid-1234')
  })

  describe('hasRole', () => {
    it('devrait retourner true pour un rôle exact', () => {
      expect(hasRole(UserRole.ADMIN, UserRole.ADMIN)).toBe(true)
      expect(hasRole(UserRole.MANAGER, UserRole.MANAGER)).toBe(true)
      expect(hasRole(UserRole.STAFF, UserRole.STAFF)).toBe(true)
      expect(hasRole(UserRole.CLIENT, UserRole.CLIENT)).toBe(true)
    })

    it('devrait respecter la hiérarchie des rôles - ADMIN', () => {
      expect(hasRole(UserRole.ADMIN, UserRole.MANAGER)).toBe(true)
      expect(hasRole(UserRole.ADMIN, UserRole.STAFF)).toBe(true)
      expect(hasRole(UserRole.ADMIN, UserRole.CLIENT)).toBe(true)
    })

    it('devrait respecter la hiérarchie des rôles - MANAGER', () => {
      expect(hasRole(UserRole.MANAGER, UserRole.ADMIN)).toBe(false)
      expect(hasRole(UserRole.MANAGER, UserRole.STAFF)).toBe(true)
      expect(hasRole(UserRole.MANAGER, UserRole.CLIENT)).toBe(true)
    })

    it('devrait respecter la hiérarchie des rôles - STAFF', () => {
      expect(hasRole(UserRole.STAFF, UserRole.ADMIN)).toBe(false)
      expect(hasRole(UserRole.STAFF, UserRole.MANAGER)).toBe(false)
      expect(hasRole(UserRole.STAFF, UserRole.CLIENT)).toBe(true)
    })

    it('devrait respecter la hiérarchie des rôles - CLIENT', () => {
      expect(hasRole(UserRole.CLIENT, UserRole.ADMIN)).toBe(false)
      expect(hasRole(UserRole.CLIENT, UserRole.MANAGER)).toBe(false)
      expect(hasRole(UserRole.CLIENT, UserRole.STAFF)).toBe(false)
    })

    it('devrait retourner false pour un rôle non défini', () => {
      expect(hasRole('INVALID_ROLE' as UserRole, UserRole.CLIENT)).toBe(false)
    })
  })

  describe('hasRouteAccess', () => {
    it('devrait permettre l\'accès aux routes publiques pour tous', () => {
      expect(hasRouteAccess(UserRole.CLIENT, '/')).toBe(true)
      expect(hasRouteAccess(UserRole.CLIENT, '/auth/login')).toBe(true)
      expect(hasRouteAccess(UserRole.CLIENT, '/auth/register')).toBe(true)
    })

    it('devrait permettre l\'accès aux routes admin seulement aux admins', () => {
      expect(hasRouteAccess(UserRole.ADMIN, '/dashboard/admin')).toBe(true)
      expect(hasRouteAccess(UserRole.MANAGER, '/dashboard/admin')).toBe(false)
      expect(hasRouteAccess(UserRole.STAFF, '/dashboard/admin')).toBe(false)
      expect(hasRouteAccess(UserRole.CLIENT, '/dashboard/admin')).toBe(false)
    })

    it('devrait permettre l\'accès aux routes manager aux admins et managers', () => {
      expect(hasRouteAccess(UserRole.ADMIN, '/dashboard/manager')).toBe(true)
      expect(hasRouteAccess(UserRole.MANAGER, '/dashboard/manager')).toBe(true)
      expect(hasRouteAccess(UserRole.STAFF, '/dashboard/manager')).toBe(false)
      expect(hasRouteAccess(UserRole.CLIENT, '/dashboard/manager')).toBe(false)
    })

    it('devrait permettre l\'accès aux routes staff aux admins, managers et staff', () => {
      expect(hasRouteAccess(UserRole.ADMIN, '/dashboard/staff')).toBe(true)
      expect(hasRouteAccess(UserRole.MANAGER, '/dashboard/staff')).toBe(true)
      expect(hasRouteAccess(UserRole.STAFF, '/dashboard/staff')).toBe(true)
      expect(hasRouteAccess(UserRole.CLIENT, '/dashboard/staff')).toBe(false)
    })

    it('devrait permettre l\'accès aux routes client à tous les utilisateurs authentifiés', () => {
      expect(hasRouteAccess(UserRole.ADMIN, '/dashboard/client')).toBe(true)
      expect(hasRouteAccess(UserRole.MANAGER, '/dashboard/client')).toBe(true)
      expect(hasRouteAccess(UserRole.STAFF, '/dashboard/client')).toBe(true)
      expect(hasRouteAccess(UserRole.CLIENT, '/dashboard/client')).toBe(true)
    })

    it('devrait refuser l\'accès aux routes non définies', () => {
      expect(hasRouteAccess(UserRole.ADMIN, '/unknown/route')).toBe(false)
      expect(hasRouteAccess(UserRole.CLIENT, '/secret/path')).toBe(false)
    })

    it('devrait gérer les routes avec des sous-chemins', () => {
      expect(hasRouteAccess(UserRole.ADMIN, '/dashboard/admin/users')).toBe(true)
      expect(hasRouteAccess(UserRole.CLIENT, '/dashboard/admin/settings')).toBe(false)
    })
  })

  describe('isPublicRoute', () => {
    it('devrait identifier les routes publiques exactes', () => {
      expect(isPublicRoute('/')).toBe(true)
      expect(isPublicRoute('/auth/login')).toBe(true)
      expect(isPublicRoute('/auth/register')).toBe(true)
      expect(isPublicRoute('/auth/forgot-password')).toBe(true)
    })

    it('devrait identifier les routes publiques avec sous-chemins', () => {
      expect(isPublicRoute('/api/auth/callback')).toBe(true)
      expect(isPublicRoute('/api/auth/signin')).toBe(true)
      expect(isPublicRoute('/api/health')).toBe(true)
    })

    it('devrait retourner false pour les routes privées', () => {
      expect(isPublicRoute('/dashboard')).toBe(false)
      expect(isPublicRoute('/admin')).toBe(false)
      expect(isPublicRoute('/profile')).toBe(false)
    })

    it('devrait gérer les patterns avec wildcard', () => {
      expect(isPublicRoute('/auth/reset-password')).toBe(true)
      expect(isPublicRoute('/auth/verify-email')).toBe(true)
    })
  })

  describe('generateCSRFToken', () => {
    it('devrait générer un token CSRF de 64 caractères', () => {
      const token = generateCSRFToken()
      expect(token).toBe('test-random-string')
      expect(require('crypto').randomBytes).toHaveBeenCalledWith(32)
    })
  })

  describe('validateCSRFToken', () => {
    it('devrait valider un token CSRF correct', () => {
      const result = validateCSRFToken('valid-token', 'valid-token')
      expect(result).toBe(true)
      expect(require('crypto').timingSafeEqual).toHaveBeenCalled()
    })

    it('devrait rejeter un token CSRF vide', () => {
      expect(validateCSRFToken('', 'session-token')).toBe(false)
      expect(validateCSRFToken('token', '')).toBe(false)
      expect(validateCSRFToken('', '')).toBe(false)
    })

    it('devrait rejeter un token CSRF null ou undefined', () => {
      expect(validateCSRFToken(null as any, 'session-token')).toBe(false)
      expect(validateCSRFToken('token', null as any)).toBe(false)
      expect(validateCSRFToken(undefined as any, 'session-token')).toBe(false)
    })
  })

  describe('getRealIP', () => {
    it('devrait extraire l\'IP depuis x-forwarded-for', () => {
      const request = {
        headers: new Map([
          ['x-forwarded-for', '192.168.1.1, 10.0.0.1'],
        ]),
        ip: '127.0.0.1',
      } as any

      const ip = getRealIP(request)
      expect(ip).toBe('192.168.1.1')
    })

    it('devrait extraire l\'IP depuis x-real-ip si x-forwarded-for absent', () => {
      const request = {
        headers: new Map([
          ['x-real-ip', '192.168.1.2'],
        ]),
        ip: '127.0.0.1',
      } as any

      const ip = getRealIP(request)
      expect(ip).toBe('192.168.1.2')
    })

    it('devrait utiliser request.ip comme fallback', () => {
      const request = {
        headers: new Map(),
        ip: '127.0.0.1',
      } as any

      const ip = getRealIP(request)
      expect(ip).toBe('127.0.0.1')
    })

    it('devrait retourner "unknown" si aucune IP disponible', () => {
      const request = {
        headers: new Map(),
        ip: undefined,
      } as any

      const ip = getRealIP(request)
      expect(ip).toBe('unknown')
    })
  })

  describe('validatePasswordStrength', () => {
    it('devrait valider un mot de passe fort', () => {
      const result = validatePasswordStrength('SecurePassword123!')
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('devrait rejeter un mot de passe trop court', () => {
      const result = validatePasswordStrength('Short1!')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Le mot de passe doit contenir au moins 12 caractères')
    })

    it('devrait rejeter un mot de passe sans minuscule', () => {
      const result = validatePasswordStrength('PASSWORD123!')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Le mot de passe doit contenir au moins une lettre minuscule')
    })

    it('devrait rejeter un mot de passe sans majuscule', () => {
      const result = validatePasswordStrength('password123!')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Le mot de passe doit contenir au moins une lettre majuscule')
    })

    it('devrait rejeter un mot de passe sans chiffre', () => {
      const result = validatePasswordStrength('SecurePassword!')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Le mot de passe doit contenir au moins un chiffre')
    })

    it('devrait rejeter un mot de passe sans caractère spécial', () => {
      const result = validatePasswordStrength('SecurePassword123')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Le mot de passe doit contenir au moins un caractère spécial')
    })

    it('devrait rejeter les mots de passe communs', () => {
      const result = validatePasswordStrength('password123!')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Le mot de passe ne doit pas contenir de mots de passe courants')
    })

    it('devrait cumuler plusieurs erreurs', () => {
      const result = validatePasswordStrength('weak')
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(1)
    })
  })

  describe('logSecurityEvent', () => {
    it('devrait logger un événement de sécurité', async () => {
      const consoleLog = jest.spyOn(console, 'log').mockImplementation()

      await logSecurityEvent({
        userId: 'user-123',
        action: 'LOGIN_SUCCESS',
        resource: '/dashboard',
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        success: true,
      })

      expect(consoleLog).toHaveBeenCalledWith(
        '[SECURITY AUDIT]',
        expect.stringContaining('LOGIN_SUCCESS')
      )

      consoleLog.mockRestore()
    })

    it('devrait générer un ID et timestamp automatiquement', async () => {
      const consoleLog = jest.spyOn(console, 'log').mockImplementation()

      await logSecurityEvent({
        action: 'TEST_ACTION',
        resource: '/test',
        ip: '127.0.0.1',
        userAgent: 'test',
        success: true,
      })

      const logCall = consoleLog.mock.calls[0]
      const logData = JSON.parse(logCall[1])
      
      expect(logData.id).toBe('test-uuid-1234')
      expect(logData.timestamp).toBeDefined()
      expect(new Date(logData.timestamp)).toBeInstanceOf(Date)

      consoleLog.mockRestore()
    })
  })

  describe('isSessionValid', () => {
    it('devrait valider une session active et non expirée', () => {
      const session = {
        user: { isActive: true },
        expiresAt: Date.now() + 60 * 60 * 1000, // dans 1 heure
      } as any

      expect(isSessionValid(session)).toBe(true)
    })

    it('devrait rejeter une session nulle', () => {
      expect(isSessionValid(null)).toBe(false)
    })

    it('devrait rejeter une session expirée', () => {
      const session = {
        user: { isActive: true },
        expiresAt: Date.now() - 60 * 60 * 1000, // il y a 1 heure
      } as any

      expect(isSessionValid(session)).toBe(false)
    })

    it('devrait rejeter une session d\'utilisateur inactif', () => {
      const session = {
        user: { isActive: false },
        expiresAt: Date.now() + 60 * 60 * 1000,
      } as any

      expect(isSessionValid(session)).toBe(false)
    })
  })

  describe('getRedirectPath', () => {
    it('devrait rediriger vers le chemin demandé si accessible', () => {
      const path = getRedirectPath(UserRole.ADMIN, '/dashboard/admin')
      expect(path).toBe('/dashboard/admin')
    })

    it('devrait rediriger vers le dashboard approprié si chemin non accessible', () => {
      const path = getRedirectPath(UserRole.CLIENT, '/dashboard/admin')
      expect(path).toBe('/dashboard/client')
    })

    it('devrait rediriger vers le dashboard selon le rôle - ADMIN', () => {
      expect(getRedirectPath(UserRole.ADMIN)).toBe('/dashboard/admin')
    })

    it('devrait rediriger vers le dashboard selon le rôle - MANAGER', () => {
      expect(getRedirectPath(UserRole.MANAGER)).toBe('/dashboard/manager')
    })

    it('devrait rediriger vers le dashboard selon le rôle - STAFF', () => {
      expect(getRedirectPath(UserRole.STAFF)).toBe('/dashboard/staff')
    })

    it('devrait rediriger vers le dashboard selon le rôle - CLIENT', () => {
      expect(getRedirectPath(UserRole.CLIENT)).toBe('/dashboard/client')
    })

    it('devrait rediriger vers login pour un rôle invalide', () => {
      expect(getRedirectPath('INVALID' as UserRole)).toBe('/auth/login')
    })
  })

  describe('Brute Force Protection', () => {
    beforeEach(() => {
      // Nettoyer les tentatives entre les tests
      resetLoginAttempts('test-ip')
    })

    it('devrait permettre les premières tentatives', () => {
      const result = checkBruteForce('new-ip')
      expect(result.isBlocked).toBe(false)
    })

    it('devrait enregistrer les tentatives échouées', () => {
      const ip = 'test-ip-failed'
      
      recordFailedLogin(ip)
      recordFailedLogin(ip)
      
      const result = checkBruteForce(ip)
      expect(result.isBlocked).toBe(false) // Pas encore bloqué
    })

    it('devrait bloquer après 5 tentatives échouées', () => {
      const ip = 'test-ip-blocked'
      
      // 5 tentatives échouées
      for (let i = 0; i < 5; i++) {
        recordFailedLogin(ip)
      }
      
      const result = checkBruteForce(ip)
      expect(result.isBlocked).toBe(true)
      expect(result.remainingTime).toBeGreaterThan(0)
    })

    it('devrait réinitialiser les tentatives après la période de grâce', () => {
      const ip = 'test-ip-reset'
      
      // Simuler des tentatives anciennes en mockant Date.now()
      const originalDateNow = Date.now
      const oldTime = Date.now() - 2 * 60 * 60 * 1000 // 2 heures dans le passé
      
      Date.now = jest.fn().mockReturnValue(oldTime)
      recordFailedLogin(ip)
      recordFailedLogin(ip)
      
      // Revenir au temps présent
      Date.now = originalDateNow
      
      const result = checkBruteForce(ip)
      expect(result.isBlocked).toBe(false)
    })

    it('devrait réinitialiser manuellement les tentatives', () => {
      const ip = 'test-ip-manual-reset'
      
      recordFailedLogin(ip)
      recordFailedLogin(ip)
      
      resetLoginAttempts(ip)
      
      const result = checkBruteForce(ip)
      expect(result.isBlocked).toBe(false)
    })
  })

  describe('getSecureServerSession', () => {
    it('devrait retourner la session serveur', async () => {
      const mockSession = { user: { id: 'test-user' } }
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

      const session = await getSecureServerSession()
      expect(session).toBe(mockSession)
      expect(getServerSession).toHaveBeenCalled()
    })

    it('devrait gérer les erreurs et retourner null', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation()
      ;(getServerSession as jest.Mock).mockRejectedValue(new Error('Session error'))

      const session = await getSecureServerSession()
      expect(session).toBeNull()
      expect(consoleError).toHaveBeenCalled()

      consoleError.mockRestore()
    })
  })
})