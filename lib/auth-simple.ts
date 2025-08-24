import { UserRole } from '@/types/auth'
import bcrypt from 'bcryptjs'
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { connectToDatabase } from './mongodb'

export const authOptionsSimple: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        console.log('NextAuth authorize - début (version simplifiée)')
        
        if (!credentials?.email || !credentials?.password) {
          console.log('NextAuth authorize - credentials manquants')
          return null
        }

        try {
          // Connexion à la base de données
          const { db } = await connectToDatabase()
          
          // Rechercher l'utilisateur par email
          const user = await db.collection('users').findOne({
            email: credentials.email.toLowerCase().trim()
          })

          console.log('Utilisateur trouvé:', !!user)

          if (!user) {
            console.log('Utilisateur non trouvé pour email:', credentials.email)
            return null
          }

          // Vérifier si l'utilisateur est actif
          if (user.isActive === false) {
            console.log('Utilisateur inactif:', user.email)
            return null
          }

          // Vérifier le mot de passe
          const isValidPassword = await bcrypt.compare(
            credentials.password,
            user.password
          )

          console.log('Mot de passe valide:', isValidPassword)

          if (!isValidPassword) {
            return null
          }

          // Retourner l'utilisateur
          return {
            id: user._id.toString(),
            name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
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
          return null
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 heures
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 heures
  },
  callbacks: {
    async jwt({ token, user }) {
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
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  debug: process.env.NODE_ENV === 'development',
}