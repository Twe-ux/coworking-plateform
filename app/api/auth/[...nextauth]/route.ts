import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'
import { authOptionsSimple } from '@/lib/auth-simple'

// Utiliser la version simplifiée temporairement pour débugger Vercel
const handler = NextAuth(
  process.env.NODE_ENV === 'production' ? authOptionsSimple : authOptions
)

export { handler as GET, handler as POST }
