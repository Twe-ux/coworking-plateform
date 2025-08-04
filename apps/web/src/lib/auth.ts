import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { UserRole } from '@/types/auth'
import { 
  generateCSRFToken, 
  validatePasswordStrength, 
  logSecurityEvent,
  checkBruteForce,
  recordFailedLogin,
  resetLoginAttempts
} from './auth-utils'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        csrfToken: { label: 'CSRF Token', type: 'hidden' }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const ip = req?.headers?.['x-forwarded-for'] || req?.headers?.['x-real-ip'] || 'unknown'
        
        // Vérifier les tentatives de brute force
        const bruteForceCheck = checkBruteForce(ip as string)
        if (bruteForceCheck.isBlocked) {
          await logSecurityEvent({
            userId: undefined,
            action: 'LOGIN_BLOCKED',
            resource: 'auth',
            ip: ip as string,
            userAgent: req?.headers?.['user-agent'] || 'unknown',
            success: false,
            details: { reason: 'brute_force_protection', remainingTime: bruteForceCheck.remainingTime }
          })
          return null
        }

        try {
          // Validation de la force du mot de passe (pour les nouveaux comptes)
          const passwordValidation = validatePasswordStrength(credentials.password)
          if (!passwordValidation.isValid) {
            await logSecurityEvent({
              userId: undefined,
              action: 'LOGIN_FAILED',
              resource: 'auth',
              ip: ip as string,
              userAgent: req?.headers?.['user-agent'] || 'unknown',
              success: false,
              details: { reason: 'weak_password', errors: passwordValidation.errors }
            })
          }

          // TODO: Remplacer par l'authentification avec votre base de données
          // Exemple d'appel à votre API d'authentification
          const response = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/authenticate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Forwarded-For': ip as string,
              'User-Agent': req?.headers?.['user-agent'] || 'unknown'
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          })

          if (response.ok) {
            const userData = await response.json()
            
            // Vérifier que l'utilisateur est actif
            if (!userData.isActive) {
              await logSecurityEvent({
                userId: userData.id,
                action: 'LOGIN_FAILED',
                resource: 'auth',
                ip: ip as string,
                userAgent: req?.headers?.['user-agent'] || 'unknown',
                success: false,
                details: { reason: 'account_disabled' }
              })
              return null
            }

            // Réinitialiser les tentatives de connexion en cas de succès
            resetLoginAttempts(ip as string)

            // Log de connexion réussie
            await logSecurityEvent({
              userId: userData.id,
              action: 'LOGIN_SUCCESS',
              resource: 'auth',
              ip: ip as string,
              userAgent: req?.headers?.['user-agent'] || 'unknown',
              success: true,
              details: { role: userData.role }
            })

            return {
              id: userData.id,
              email: userData.email,
              name: `${userData.firstName} ${userData.lastName}`,
              firstName: userData.firstName,
              lastName: userData.lastName,
              role: userData.role || UserRole.CLIENT,
              permissions: userData.permissions || [],
              isActive: userData.isActive,
            }
          } else {
            // Enregistrer la tentative échouée
            recordFailedLogin(ip as string)
            
            await logSecurityEvent({
              userId: undefined,
              action: 'LOGIN_FAILED',
              resource: 'auth',
              ip: ip as string,
              userAgent: req?.headers?.['user-agent'] || 'unknown',
              success: false,
              details: { reason: 'invalid_credentials', email: credentials.email }
            })
          }
        } catch (error) {
          console.error('Authentication error:', error)
          
          await logSecurityEvent({
            userId: undefined,
            action: 'LOGIN_ERROR',
            resource: 'auth',
            ip: ip as string,
            userAgent: req?.headers?.['user-agent'] || 'unknown',
            success: false,
            details: { error: error instanceof Error ? error.message : 'unknown_error' }
          })
        }

        return null
      }
    })
  ],
  pages: {
    signIn: '/auth/login',
    error: '/auth/login', // Error code passed in query string as ?error=
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        // Première connexion - stocker les données utilisateur
        token.id = user.id
        token.firstName = user.firstName
        token.lastName = user.lastName
        token.role = user.role
        token.permissions = user.permissions
        token.isActive = user.isActive
        token.csrfToken = generateCSRFToken()
        token.expiresAt = Date.now() + (24 * 60 * 60 * 1000) // 24 heures
      }
      
      // Vérifier l'expiration du token
      if (token.expiresAt && Date.now() > token.expiresAt) {
        throw new Error('Token expired')
      }
      
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.firstName = token.firstName as string
        session.user.lastName = token.lastName as string
        session.user.role = token.role as UserRole
        session.user.permissions = token.permissions as string[]
        session.user.isActive = token.isActive as boolean
        session.csrfToken = token.csrfToken as string
        session.expiresAt = token.expiresAt as number
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
    async signIn({ user, account, profile, credentials }) {
      // Vérifications supplémentaires de sécurité lors de la connexion
      if (!user.isActive) {
        return false
      }
      
      return true
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 heures (sécurité renforcée)
    updateAge: 60 * 60, // Mettre à jour la session toutes les heures
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 heures
    // Utiliser un algorithme de signature plus sécurisé
    secret: process.env.NEXTAUTH_SECRET,
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
        userId: token?.id || session?.user?.id,
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
          userId: session?.user?.id || token?.id,
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

// Les types sont maintenant définis dans /types/auth.ts