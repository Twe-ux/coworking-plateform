import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { connectToDatabase } from './mongodb'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const { db } = await connectToDatabase()
          const user = await db.collection('users').findOne({
            email: credentials.email
          })

          if (!user) {
            return null
          }

          // Vérifier le mot de passe
          const isValidPassword = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isValidPassword) {
            return null
          }

          // Vérifier que l'utilisateur est actif et a les droits admin
          if (user.status !== 'active' || !['admin', 'manager'].includes(user.role)) {
            return null
          }

          // Mettre à jour la dernière connexion
          await db.collection('users').updateOne(
            { _id: user._id },
            {
              $set: { lastLoginAt: new Date() },
              $push: {
                loginHistory: {
                  timestamp: new Date(),
                  ip: '0.0.0.0', // À récupérer depuis la requête
                  userAgent: 'Admin App',
                  success: true
                }
              }
            }
          )

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            avatar: user.avatar
          }
        } catch (error) {
          console.error('Erreur d\'authentification:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60 // 24 heures
  },
  jwt: {
    maxAge: 24 * 60 * 60 // 24 heures
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.avatar = user.avatar
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.avatar = token.avatar as string
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error'
  }
}