import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { Coffee } from 'lucide-react'

interface AuthLayoutProps {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 px-4 py-8 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-200/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-200/20 rounded-full blur-3xl"></div>
      </div>
      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Logo/Brand */}
        <div className="text-center">
          <Link href="/" className="inline-block group">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="p-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 group-hover:scale-105 transition-transform">
                <Coffee className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-600 bg-clip-text text-transparent">
              Cow or King Café
            </div>
            <p className="text-sm text-amber-700 mt-1">
              Coworking à Strasbourg
            </p>
          </Link>
        </div>

        {/* Main Auth Content */}
        <Card className="shadow-lg border border-amber-200/50 bg-white/90 backdrop-blur-sm">
          {children}
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-amber-700">
          <p>
            En continuant, vous acceptez nos{' '}
            <Link href="/terms" className="underline hover:text-amber-900">
              conditions d'utilisation
            </Link>{' '}
            et notre{' '}
            <Link href="/privacy" className="underline hover:text-amber-900">
              politique de confidentialité
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}