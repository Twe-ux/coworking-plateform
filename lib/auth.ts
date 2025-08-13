import { UserRole } from '@/types/auth'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import {
  checkBruteForce,
  generateCSRFToken,
  getRealIP,
  logSecurityEvent,
  recordFailedLogin,
  resetLoginAttempts,
  validateCSRFToken,
} from './auth-utils'
import { connectToDatabase } from './mongodb'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
        csrfToken: { label: 'CSRF Token', type: 'hidden' },
      },
      async authorize(credentials, req) {
        // SECURITY FIX: Pas de log des credentials en production
        if (process.env.NODE_ENV === 'development') {
          console.log('NextAuth authorize - début:', {
            hasEmail: !!credentials?.email,
            hasPassword: !!credentials?.password,
            email: credentials?.email,
          })
        }

        if (!credentials?.email || !credentials?.password) {
          if (process.env.NODE_ENV === 'development') {
            console.log('NextAuth authorize - credentials manquants')
          }
          return null
        }

        // SECURITY: Validation et sanitisation des entrées
        const { validateEmail, validatePasswordInput, checkRateLimit } =
          await import('./validation')

        // Get IP and user agent FIRST before using them
        const ip = getRealIP(req as any) || 'unknown'
        const userAgent = req?.headers?.['user-agent'] || 'unknown'

        // Rate limiting par IP
        if (!checkRateLimit(ip, 20, 2)) {
          // 20 tentatives max, 2 par seconde
          await logSecurityEvent({
            userId: undefined,
            action: 'RATE_LIMIT_EXCEEDED',
            resource: 'auth',
            ip,
            userAgent,
            success: false,
            details: { reason: 'too_many_requests' },
          })
          return null
        }

        // Validation email
        const emailValidation = validateEmail(credentials.email)
        if (!emailValidation.isValid) {
          await logSecurityEvent({
            userId: undefined,
            action: 'INVALID_EMAIL_FORMAT',
            resource: 'auth',
            ip,
            userAgent,
            success: false,
            details: { errors: emailValidation.errors },
          })
          return null
        }

        // Validation mot de passe (format uniquement, pas la force ici)
        const passwordValidation = validatePasswordInput(credentials.password)
        if (!passwordValidation.isValid) {
          await logSecurityEvent({
            userId: undefined,
            action: 'INVALID_PASSWORD_FORMAT',
            resource: 'auth',
            ip,
            userAgent,
            success: false,
            details: { errors: passwordValidation.errors },
          })
          return null
        }

        // SECURITY: CSRF validation (disabled in development for quick fix)
        if (process.env.NODE_ENV === 'production') {
          const sessionToken =
            req?.headers?.['x-csrf-token'] ||
            req?.body?.csrfToken ||
            credentials.csrfToken

          if (!sessionToken) {
            await logSecurityEvent({
              userId: undefined,
              action: 'CSRF_TOKEN_MISSING',
              resource: 'auth',
              ip: getRealIP(req as any) || 'unknown',
              userAgent: req?.headers?.['user-agent'] || 'unknown',
              success: false,
              details: { reason: 'csrf_token_required' },
            })
            return null
          }

          // Validation stricte du token CSRF
          if (
            !validateCSRFToken(
              sessionToken,
              process.env.NEXTAUTH_SECRET + sessionToken
            )
          ) {
            await logSecurityEvent({
              userId: undefined,
              action: 'CSRF_VALIDATION_FAILED',
              resource: 'auth',
              ip: getRealIP(req as any) || 'unknown',
              userAgent: req?.headers?.['user-agent'] || 'unknown',
              success: false,
              details: { reason: 'invalid_csrf_token' },
            })
            return null
          }
        }

        // Vérifier les tentatives de brute force
        const bruteForceCheck = checkBruteForce(ip)
        if (bruteForceCheck.isBlocked) {
          await logSecurityEvent({
            userId: undefined,
            action: 'LOGIN_BLOCKED',
            resource: 'auth',
            ip,
            userAgent,
            success: false,
            details: {
              reason: 'brute_force_protection',
              remainingTime: bruteForceCheck.remainingTime,
            },
          })
          return null
        }

        try {
          // SECURITY: Validation de la force du mot de passe même à la connexion
          const { validatePasswordStrength } = await import('./auth-utils')
          const passwordValidation = validatePasswordStrength(
            credentials.password
          )
          if (!passwordValidation.isValid && passwordValidation.score < 3) {
            // Log de tentative avec mot de passe faible
            await logSecurityEvent({
              userId: undefined,
              action: 'WEAK_PASSWORD_ATTEMPT',
              resource: 'auth',
              ip,
              userAgent,
              success: false,
              details: {
                email: credentials.email,
                passwordScore: passwordValidation.score,
                errors: passwordValidation.errors,
              },
            })
            // En production, on peut choisir de bloquer ou d'alerter l'utilisateur
          }

          if (process.env.NODE_ENV === 'development') {
            console.log('NextAuth authorize - connexion à la DB...')
          }
          const { db } = await connectToDatabase()
          if (process.env.NODE_ENV === 'development') {
            console.log(
              'NextAuth authorize - DB connectée, recherche utilisateur'
            )
          }

          const user = await db.collection('users').findOne({
            email: emailValidation.sanitized, // Utiliser l'email sanitisé
          })

          console.log('NextAuth authorize - utilisateur trouvé:', !!user)

          // SECURITY: Protection contre les timing attacks
          // On effectue toujours le hash même si l'utilisateur n'existe pas
          const dummyPassword =
            '$2a$10$dummypasswordhashtopreventtimingattacks.dummy'
          const userPassword = user?.password || dummyPassword

          const isPasswordValid = await bcrypt.compare(
            credentials.password, // Utiliser le mot de passe original
            userPassword
          )

          // Vérification de l'utilisateur ET du mot de passe en même temps
          if (!user || !isPasswordValid) {
            await recordFailedLogin(ip)
            await logSecurityEvent({
              userId: user?._id?.toString(),
              action: 'LOGIN_FAILED',
              resource: 'auth',
              ip,
              userAgent,
              success: false,
              details: {
                reason: !user ? 'user_not_found' : 'invalid_password',
                email: emailValidation.sanitized,
              },
            })
            return null
          }

          // Vérifier que l'utilisateur est actif
          if (!user.isActive || user.status !== 'active') {
            await logSecurityEvent({
              userId: user._id.toString(),
              action: 'LOGIN_FAILED',
              resource: 'auth',
              ip,
              userAgent,
              success: false,
              details: { reason: 'account_disabled' },
            })
            return null
          }

          // Réinitialiser les tentatives de connexion en cas de succès
          resetLoginAttempts(ip)

          // Mettre à jour la dernière connexion
          await db.collection('users').updateOne(
            { _id: user._id },
            {
              $set: { lastLoginAt: new Date() },
              $push: {
                loginHistory: {
                  timestamp: new Date(),
                  ip,
                  userAgent,
                  success: true,
                },
              } as any,
            }
          )

          // Log de connexion réussie
          await logSecurityEvent({
            userId: user._id.toString(),
            action: 'LOGIN_SUCCESS',
            resource: 'auth',
            ip,
            userAgent,
            success: true,
            details: { role: user.role },
          })

          console.log('Utilisateur trouvé dans la DB:', {
            id: user._id.toString(),
            email: user.email,
            role: user.role,
            isActive: user.isActive,
          })

          return {
            id: user._id.toString(),
            name:
              user.name ||
              `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
              'User',
            email: user.email,
            firstName: user.firstName || user.name?.split(' ')[0] || '',
            lastName: user.lastName || user.name?.split(' ')[1] || '',
            role: user.role as UserRole,
            permissions: user.permissions || [],
            isActive: user.isActive ?? true,
            image: user.image || undefined,
          }
        } catch (error) {
          console.error('NextAuth authorize - erreur:', error)
          await logSecurityEvent({
            userId: undefined,
            action: 'LOGIN_ERROR',
            resource: 'auth',
            ip,
            userAgent,
            success: false,
            details: {
              error: error instanceof Error ? error.message : 'unknown_error',
            },
          })
          return null
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 heures
    updateAge: 60 * 60, // Mettre à jour la session toutes les heures
    // SECURITY: Régénération des sessions pour éviter la fixation
    generateSessionToken: () => crypto.randomUUID(),
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 heures
    secret: process.env.NEXTAUTH_SECRET,
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.name = user.name
        token.email = user.email
        token.role = user.role
        token.firstName = user.firstName
        token.lastName = user.lastName
        token.permissions = user.permissions
        token.isActive = user.isActive
        token.image = user.image
        token.csrfToken = generateCSRFToken()
        token.expiresAt = Date.now() + 24 * 60 * 60 * 1000 // 24 heures
      }

      // Handle session updates (when update() is called)
      if (trigger === 'update' && session) {
        if (session.name) token.name = session.name
        if (session.image) token.image = session.image
        if (session.avatar) token.avatar = session.avatar
      }

      // Vérifier l'expiration du token
      if (token.expiresAt && Date.now() > (token.expiresAt as number)) {
        throw new Error('Token expired')
      }

      return token
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.sub!
        session.user.name = token.name as string
        session.user.email = token.email as string
        session.user.firstName = token.firstName as string
        session.user.lastName = token.lastName as string
        session.user.role = token.role as UserRole
        session.user.permissions = token.permissions as string[]
        session.user.isActive = token.isActive as boolean
        session.user.image = token.image as string
        session.csrfToken = token.csrfToken as string
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Sécurité : vérifier que l'URL de redirection est sûre
      try {
        // Forcer l'utilisation du bon baseUrl (port 3000)
        const correctBaseUrl =
          process.env.NEXTAUTH_URL || 'http://localhost:3000'

        // Si l'URL est relative, la construire avec le bon baseUrl
        if (url.startsWith('/')) {
          // Respecter l'URL de redirection demandée si elle est relative et sûre
          const allowedPaths = [
            '/',
            '/dashboard',
            '/dashboard/',
            '/reservation',
            '/dashboard/admin',
            '/dashboard/manager',
            '/dashboard/staff',
            '/dashboard/client',
          ]

          // Si l'URL relative est dans la liste autorisée ou commence par /dashboard
          if (allowedPaths.includes(url) || url.startsWith('/dashboard/')) {
            return `${correctBaseUrl}${url}`
          }

          // Pour les autres pages protégées, vérifier qu'elles sont sûres
          if (url.startsWith('/reservation') || url.match(/^\/[\w-]+$/)) {
            return `${correctBaseUrl}${url}`
          }

          // Fallback sécurisé
          return `${correctBaseUrl}/dashboard`
        }

        const redirectUrl = new URL(url)
        const correctBaseUrlObj = new URL(correctBaseUrl)

        // Autoriser seulement les redirections vers la même origine avec le bon port
        if (
          redirectUrl.hostname !== correctBaseUrlObj.hostname ||
          redirectUrl.port !== correctBaseUrlObj.port
        ) {
          console.warn(
            `Redirection bloquée vers ${url}, redirection vers ${correctBaseUrl}/dashboard`
          )
          return `${correctBaseUrl}/dashboard`
        }

        // Forcer le bon port dans l'URL de redirection
        redirectUrl.port = correctBaseUrlObj.port
        redirectUrl.protocol = correctBaseUrlObj.protocol

        return redirectUrl.toString()
      } catch (error) {
        // En cas d'erreur de parsing d'URL, rediriger vers le dashboard avec le bon port
        console.error('Erreur de redirection:', error)
        const correctBaseUrl =
          process.env.NEXTAUTH_URL || 'http://localhost:3000'
        return `${correctBaseUrl}/dashboard`
      }
    },
    async signIn({ user }) {
      // Vérifications supplémentaires de sécurité lors de la connexion
      return !!user.isActive
    },
  },
  pages: {
    signIn: '/login',
    error: '/login', // Error code passed in query string as ?error=
  },
  secret: process.env.NEXTAUTH_SECRET,
  // Options de sécurité supplémentaires
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === 'production'
          ? '__Secure-next-auth.session-token'
          : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60, // 24 heures
      },
    },
    callbackUrl: {
      name:
        process.env.NODE_ENV === 'production'
          ? '__Secure-next-auth.callback-url'
          : 'next-auth.callback-url',
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name:
        process.env.NODE_ENV === 'production'
          ? '__Host-next-auth.csrf-token'
          : 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      await logSecurityEvent({
        userId: user.id,
        action: 'SIGNIN_EVENT',
        resource: 'auth',
        ip: 'server',
        userAgent: 'nextauth',
        success: true,
        details: { isNewUser, provider: account?.provider },
      })
    },
    async signOut({ session, token }) {
      await logSecurityEvent({
        userId: (token?.id || session?.user?.id) as string,
        action: 'SIGNOUT_EVENT',
        resource: 'auth',
        ip: 'server',
        userAgent: 'nextauth',
        success: true,
        details: {},
      })
    },
    async session({ session, token }) {
      // Log périodique des sessions actives (pour monitoring)
      if (Math.random() < 0.01) {
        // 1% des vérifications de session
        await logSecurityEvent({
          userId: (session?.user?.id || token?.id) as string,
          action: 'SESSION_CHECK',
          resource: 'auth',
          ip: 'server',
          userAgent: 'nextauth',
          success: true,
          details: { role: session?.user?.role || token?.role },
        })
      }
    },
  },
}
