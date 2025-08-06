import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'

interface AuthLayoutProps {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        {/* Logo/Brand */}
        <div className="text-center">
          <Link href="/" className="inline-block">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              CaféWork
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Votre espace de coworking
            </p>
          </Link>
        </div>

        {/* Main Auth Content */}
        <Card className="shadow-lg border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          {children}
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-slate-600 dark:text-slate-400">
          <p>
            En continuant, vous acceptez nos{' '}
            <Link href="/terms" className="underline hover:text-slate-900 dark:hover:text-slate-100">
              conditions d'utilisation
            </Link>{' '}
            et notre{' '}
            <Link href="/privacy" className="underline hover:text-slate-900 dark:hover:text-slate-100">
              politique de confidentialité
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}