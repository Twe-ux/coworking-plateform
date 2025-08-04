/**
 * Gestionnaires d'API mockés étendus pour l'authentification
 * Version complète avec base de données simulée et gestion avancée
 */

import { http, HttpResponse } from 'msw'
import { UserRole } from '@/types/auth'
import { mockUsers, createMockSession } from './auth-handlers'

// Base de données simulée pour les tests d'intégration
export const mockDatabase = {
  users: new Map(Object.entries(mockUsers)),
  sessions: new Map<string, any>(),
  passwordResetTokens: new Map<string, { email: string; expiresAt: number }>(),
  failedLoginAttempts: new Map<string, { count: number; lastAttempt: number }>(),
  emailVerificationTokens: new Map<string, { email: string; expiresAt: number }>(),
  
  // Helpers pour la gestion des données
  addUser(user: any) {
    this.users.set(user.id, user)
    return user
  },
  
  getUserByEmail(email: string) {
    return Array.from(this.users.values()).find(user => user.email === email)
  },
  
  createSession(userId: string) {
    const sessionId = `session-${userId}-${Date.now()}`
    const user = Array.from(this.users.values()).find(u => u.id === userId)
    if (!user) return null
    
    const userType = Object.keys(mockUsers).find(
      key => mockUsers[key as keyof typeof mockUsers].id === userId
    ) as keyof typeof mockUsers || 'client'
    
    const session = createMockSession(userType)
    this.sessions.set(sessionId, session)
    return { sessionId, session }
  },
  
  recordFailedLogin(ip: string) {
    const attempts = this.failedLoginAttempts.get(ip) || { count: 0, lastAttempt: 0 }
    attempts.count++
    attempts.lastAttempt = Date.now()
    this.failedLoginAttempts.set(ip, attempts)
  },
  
  isBlocked(ip: string) {
    const attempts = this.failedLoginAttempts.get(ip)
    if (!attempts || attempts.count < 5) return false
    
    const timeSinceLastAttempt = Date.now() - attempts.lastAttempt
    return timeSinceLastAttempt < 15 * 60 * 1000 // 15 minutes
  },
  
  clearFailedLogins(ip: string) {
    this.failedLoginAttempts.delete(ip)
  },
  
  createPasswordResetToken(email: string) {
    const token = `reset-token-${email}-${Date.now()}`
    this.passwordResetTokens.set(token, {
      email,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 heures
    })
    return token
  },
  
  validatePasswordResetToken(token: string) {
    const tokenData = this.passwordResetTokens.get(token)
    if (!tokenData || tokenData.expiresAt < Date.now()) {
      return null
    }
    return tokenData
  },
  
  consumePasswordResetToken(token: string) {
    const tokenData = this.passwordResetTokens.get(token)
    this.passwordResetTokens.delete(token)
    return tokenData
  },
  
  createEmailVerificationToken(email: string) {
    const token = `verify-token-${email}-${Date.now()}`
    this.emailVerificationTokens.set(token, {
      email,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 jours
    })
    return token
  },
  
  validateEmailVerificationToken(token: string) {
    const tokenData = this.emailVerificationTokens.get(token)
    if (!tokenData || tokenData.expiresAt < Date.now()) {
      return null
    }
    return tokenData
  },
  
  reset() {
    this.users.clear()
    Object.entries(mockUsers).forEach(([key, user]) => {
      this.users.set(key, user)
    })
    this.sessions.clear()
    this.passwordResetTokens.clear()
    this.failedLoginAttempts.clear()
    this.emailVerificationTokens.clear()
  }
}

// Gestionnaires étendus pour les tests d'intégration
export const extendedAuthHandlers = [
  // Session avec gestion des IDs
  http.get('/api/auth/session', ({ request }) => {
    const sessionId = request.headers.get('x-session-id')
    
    if (sessionId && mockDatabase.sessions.has(sessionId)) {
      return HttpResponse.json(mockDatabase.sessions.get(sessionId))
    }
    
    return HttpResponse.json(null)
  }),

  // Connexion avec protection brute force
  http.post('/api/auth/signin', async ({ request }) => {
    const body = await request.json() as any
    const { email, password } = body
    const clientIP = request.headers.get('x-forwarded-for') || '127.0.0.1'

    // Vérifier le brute force
    if (mockDatabase.isBlocked(clientIP)) {
      return HttpResponse.json(
        { error: 'Trop de tentatives de connexion. Veuillez réessayer plus tard.' },
        { status: 429 }
      )
    }

    const user = mockDatabase.getUserByEmail(email)
    
    // Mots de passe valides pour les tests
    const validPasswords = {
      'admin@coworking.com': 'AdminPassword123!',
      'manager@coworking.com': 'ManagerPassword123!',
      'staff@coworking.com': 'StaffPassword123!',
      'client@coworking.com': 'ClientPassword123!',
      'inactive@coworking.com': 'InactivePassword123!',
    }

    if (!user || validPasswords[email as keyof typeof validPasswords] !== password) {
      mockDatabase.recordFailedLogin(clientIP)
      return HttpResponse.json(
        { error: 'Identifiants invalides' },
        { status: 401 }
      )
    }

    if (!user.isActive) {
      return HttpResponse.json(
        { error: 'Compte désactivé' },
        { status: 401 }
      )
    }

    // Connexion réussie
    mockDatabase.clearFailedLogins(clientIP)
    const sessionResult = mockDatabase.createSession(user.id)
    
    if (!sessionResult) {
      return HttpResponse.json(
        { error: 'Erreur de session' },
        { status: 500 }
      )
    }
    
    return HttpResponse.json(sessionResult.session, {
      headers: {
        'Set-Cookie': `sessionId=${sessionResult.sessionId}; HttpOnly; Secure; SameSite=Strict`,
        'X-Session-Id': sessionResult.sessionId
      }
    })
  }),

  // Déconnexion
  http.post('/api/auth/signout', ({ request }) => {
    const sessionId = request.headers.get('x-session-id')
    if (sessionId) {
      mockDatabase.sessions.delete(sessionId)
    }
    
    return HttpResponse.json(
      { message: 'Déconnecté avec succès' },
      {
        headers: {
          'Set-Cookie': 'sessionId=; Max-Age=0; HttpOnly; Secure; SameSite=Strict'
        }
      }
    )
  }),

  // CSRF avec authentification
  http.get('/api/auth/csrf', ({ request }) => {
    const sessionId = request.headers.get('x-session-id')
    
    if (!sessionId || !mockDatabase.sessions.has(sessionId)) {
      return HttpResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }
    
    return HttpResponse.json({
      csrfToken: `csrf-${sessionId}-${Date.now()}`
    }, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache',
        'X-Content-Type-Options': 'nosniff'
      }
    })
  }),

  // Inscription complète
  http.post('/api/auth/register', async ({ request }) => {
    const body = await request.json() as any
    const { email, password, firstName, lastName } = body

    // Validation complète
    if (!email || !password || !firstName || !lastName) {
      return HttpResponse.json(
        { message: 'Tous les champs sont requis.' },
        { status: 400 }
      )
    }

    if (mockDatabase.getUserByEmail(email)) {
      return HttpResponse.json(
        { message: 'Un compte avec cette adresse email existe déjà.' },
        { status: 409 }
      )
    }

    // Validation de mot de passe stricte
    if (password.length < 8 || 
        !/[A-Z]/.test(password) || 
        !/[a-z]/.test(password) || 
        !/[0-9]/.test(password) ||
        !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return HttpResponse.json(
        { message: 'Le mot de passe ne respecte pas les critères de sécurité.' },
        { status: 400 }
      )
    }

    const newUser = {
      id: `user-${Date.now()}`,
      email,
      firstName,
      lastName,
      role: UserRole.CLIENT,
      permissions: ['bookings:own'],
      isActive: true,
      emailVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    mockDatabase.addUser(newUser)

    // Créer un token de vérification
    const verificationToken = mockDatabase.createEmailVerificationToken(email)

    return HttpResponse.json({
      message: 'Compte créé avec succès. Veuillez vérifier votre email.',
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        isActive: newUser.isActive,
        emailVerified: newUser.emailVerified,
      },
      verificationToken // En production, ceci serait envoyé par email
    }, { status: 201 })
  }),

  // Récupération de mot de passe
  http.post('/api/auth/forgot-password', async ({ request }) => {
    const body = await request.json() as any
    const { email } = body

    if (!email) {
      return HttpResponse.json(
        { message: 'L\'adresse email est requise.' },
        { status: 400 }
      )
    }

    const user = mockDatabase.getUserByEmail(email)
    if (user && user.isActive) {
      const resetToken = mockDatabase.createPasswordResetToken(email)
      console.log(`[MOCK] Reset token pour ${email}: ${resetToken}`)
    }

    // Toujours retourner succès pour la sécurité
    return HttpResponse.json({
      message: 'Si cette adresse email existe dans notre système, vous recevrez un lien de réinitialisation dans quelques minutes.'
    })
  }),

  // Réinitialisation de mot de passe
  http.post('/api/auth/reset-password', async ({ request }) => {
    const body = await request.json() as any
    const { token, password } = body

    if (!token || !password) {
      return HttpResponse.json(
        { message: 'Token et mot de passe requis.' },
        { status: 400 }
      )
    }

    const tokenData = mockDatabase.validatePasswordResetToken(token)
    if (!tokenData) {
      return HttpResponse.json(
        { message: 'Token invalide ou expiré.' },
        { status: 400 }
      )
    }

    // Validation stricte du mot de passe
    if (password.length < 8 || 
        !/[A-Z]/.test(password) || 
        !/[a-z]/.test(password) || 
        !/[0-9]/.test(password) ||
        !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return HttpResponse.json(
        { message: 'Le mot de passe ne respecte pas les critères de sécurité.' },
        { status: 400 }
      )
    }

    mockDatabase.consumePasswordResetToken(token)

    return HttpResponse.json({
      message: 'Mot de passe réinitialisé avec succès.'
    })
  }),

  // Vérification d'email
  http.post('/api/auth/verify-email', async ({ request }) => {
    const body = await request.json() as any
    const { token } = body

    if (!token) {
      return HttpResponse.json(
        { message: 'Token de vérification requis.' },
        { status: 400 }
      )
    }

    const tokenData = mockDatabase.validateEmailVerificationToken(token)
    if (!tokenData) {
      return HttpResponse.json(
        { message: 'Token de vérification invalide ou expiré.' },
        { status: 400 }
      )
    }

    const user = mockDatabase.getUserByEmail(tokenData.email)
    if (user) {
      user.emailVerified = true
      user.updatedAt = new Date().toISOString()
    }

    mockDatabase.emailVerificationTokens.delete(token)

    return HttpResponse.json({
      message: 'Email vérifié avec succès.'
    })
  }),

  // Validation de session
  http.get('/api/auth/validate-session', ({ request }) => {
    const sessionId = request.headers.get('x-session-id')
    
    if (!sessionId || !mockDatabase.sessions.has(sessionId)) {
      return HttpResponse.json(
        { error: 'Session invalide' },
        { status: 401 }
      )
    }

    const session = mockDatabase.sessions.get(sessionId)
    return HttpResponse.json({
      valid: true,
      user: session.user,
      expiresAt: session.expires
    })
  }),

  // Gestion des permissions
  http.get('/api/auth/permissions', ({ request }) => {
    const sessionId = request.headers.get('x-session-id')
    
    if (!sessionId || !mockDatabase.sessions.has(sessionId)) {
      return HttpResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const session = mockDatabase.sessions.get(sessionId)
    return HttpResponse.json({
      permissions: session.user.permissions,
      role: session.user.role
    })
  }),

  // Changement de mot de passe
  http.post('/api/auth/change-password', async ({ request }) => {
    const sessionId = request.headers.get('x-session-id')
    
    if (!sessionId || !mockDatabase.sessions.has(sessionId)) {
      return HttpResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const body = await request.json() as any
    const { currentPassword, newPassword } = body
    const session = mockDatabase.sessions.get(sessionId)

    // Validation du mot de passe actuel (simulé)
    if (!currentPassword) {
      return HttpResponse.json(
        { message: 'Mot de passe actuel requis.' },
        { status: 400 }
      )
    }

    // Validation du nouveau mot de passe
    if (newPassword.length < 8 || 
        !/[A-Z]/.test(newPassword) || 
        !/[a-z]/.test(newPassword) || 
        !/[0-9]/.test(newPassword) ||
        !/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      return HttpResponse.json(
        { message: 'Le nouveau mot de passe ne respecte pas les critères de sécurité.' },
        { status: 400 }
      )
    }

    return HttpResponse.json({
      message: 'Mot de passe modifié avec succès.'
    })
  }),

  // Rafraîchissement de session
  http.post('/api/auth/refresh-session', ({ request }) => {
    const sessionId = request.headers.get('x-session-id')
    
    if (!sessionId || !mockDatabase.sessions.has(sessionId)) {
      return HttpResponse.json(
        { error: 'Session invalide' },
        { status: 401 }
      )
    }

    const session = mockDatabase.sessions.get(sessionId)
    session.expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    
    return HttpResponse.json({
      message: 'Session rafraîchie avec succès.',
      expiresAt: session.expires
    })
  }),
]

// Gestionnaires spécialisés pour différents scénarios de test
export const securityTestHandlers = [
  // Rate limiting
  http.post('/api/auth/signin', () => {
    return HttpResponse.json(
      { error: 'Trop de tentatives de connexion. Veuillez réessayer plus tard.' },
      { status: 429 }
    )
  }),

  // CSRF invalide
  http.get('/api/auth/csrf', () => {
    return HttpResponse.json(
      { error: 'Non authentifié' },
      { status: 401 }
    )
  }),
]

export const performanceTestHandlers = [
  // Réponses lentes
  http.get('/api/auth/session', async () => {
    await new Promise(resolve => setTimeout(resolve, 3000))
    return HttpResponse.json(createMockSession('client'))
  }),

  // Timeouts
  http.post('/api/auth/signin', async () => {
    await new Promise(resolve => setTimeout(resolve, 10000))
    return HttpResponse.json({ error: 'Timeout' }, { status: 408 })
  }),
]