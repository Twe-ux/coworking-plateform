import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { connectToDatabase } from './mongodb'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { UserRole } from '@/types/auth'
import { 
  generateCSRFToken,
  validatePasswordStrength,
  logSecurityEvent,
  checkBruteForce,
  recordFailedLogin,
  resetLoginAttempts,
  getRealIP
} from './auth-utils'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
        csrfToken: { label: 'CSRF Token', type: 'hidden' }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const ip = getRealIP(req as any) || 'unknown'
        const userAgent = req?.headers?.['user-agent'] || 'unknown'
        
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
            details: { reason: 'brute_force_protection', remainingTime: bruteForceCheck.remainingTime }
          })
          return null
        }

        try {
          const { db } = await connectToDatabase()
          
          const user = await db.collection('users').findOne({
            email: credentials.email
          })

          if (!user) {
            recordFailedLogin(ip)
            await logSecurityEvent({
              userId: undefined,
              action: 'LOGIN_FAILED',
              resource: 'auth',
              ip,
              userAgent,
              success: false,
              details: { reason: 'user_not_found', email: credentials.email }
            })
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            recordFailedLogin(ip)
            await logSecurityEvent({
              userId: user._id.toString(),
              action: 'LOGIN_FAILED',
              resource: 'auth',
              ip,
              userAgent,
              success: false,
              details: { reason: 'invalid_password' }
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
              details: { reason: 'account_disabled' }
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
                  success: true
                }
              } as any
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
            details: { role: user.role }
          })

          return {
            id: user._id.toString(),
            email: user.email,
            firstName: user.firstName || user.name?.split(' ')[0] || '',
            lastName: user.lastName || user.name?.split(' ')[1] || '',
            role: user.role as UserRole,
            permissions: user.permissions || [],
            isActive: user.isActive ?? true
          }
        } catch (error) {
          console.error('Erreur d\'authentification:', error)
          await logSecurityEvent({
            userId: undefined,
            action: 'LOGIN_ERROR',
            resource: 'auth',
            ip,
            userAgent,
            success: false,
            details: { error: error instanceof Error ? error.message : 'unknown_error' }
          })
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 heures
    updateAge: 60 * 60, // Mettre à jour la session toutes les heures
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 heures
    secret: process.env.NEXTAUTH_SECRET,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.firstName = user.firstName
        token.lastName = user.lastName
        token.permissions = user.permissions
        token.isActive = user.isActive
        token.csrfToken = generateCSRFToken()
        token.expiresAt = Date.now() + (24 * 60 * 60 * 1000) // 24 heures
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
        session.user.firstName = token.firstName as string
        session.user.lastName = token.lastName as string
        session.user.role = token.role as UserRole
        session.user.permissions = token.permissions as string[]
        session.user.isActive = token.isActive as boolean
        session.csrfToken = token.csrfToken as string
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Sécurité : vérifier que l'URL de redirection est sûre
      try {
        const redirectUrl = new URL(url, baseUrl)
        const baseUrlObj = new URL(baseUrl)
        
        // Autoriser seulement les redirections vers la même origine
        if (redirectUrl.origin !== baseUrlObj.origin) {
          return `${baseUrl}/dashboard`
        }
        
        // Permet les URLs de callback relatives
        if (url.startsWith("/")) return `${baseUrl}${url}`
        
        return url
      } catch {
        // En cas d'erreur de parsing d'URL, rediriger vers le dashboard
        return `${baseUrl}/dashboard`
      }
    },
    async signIn({ user }) {
      // Vérifications supplémentaires de sécurité lors de la connexion
      return !!user.isActive
    }
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login', // Error code passed in query string as ?error=
  },
  secret: process.env.NEXTAUTH_SECRET,
  // Options de sécurité supplémentaires
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 // 24 heures
      }
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.callback-url' : 'next-auth.callback-url',
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production' ? '__Host-next-auth.csrf-token' : 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
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
        details: { isNewUser, provider: account?.provider }
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
        details: {}
      })
    },
    async session({ session, token }) {
      // Log périodique des sessions actives (pour monitoring)
      if (Math.random() < 0.01) { // 1% des vérifications de session
        await logSecurityEvent({
          userId: (session?.user?.id || token?.id) as string,
          action: 'SESSION_CHECK',
          resource: 'auth',
          ip: 'server',
          userAgent: 'nextauth',
          success: true,
          details: { role: session?.user?.role || token?.role }
        })
      }
    }
  },
}