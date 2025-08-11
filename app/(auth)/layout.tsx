import { Card } from '@/components/ui'
import { Coffee } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

interface AuthLayoutProps {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="from-coffee-light via-coffee-light/80 to-coffee-light/60 relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br px-4 py-8">
      {/* Background decorative elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="bg-coffee-primary/10 absolute -top-40 -right-40 h-80 w-80 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-orange-200/20 blur-3xl"></div>
      </div>
      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Logo/Brand */}
        <div className="text-center">
          <Link href="/" className="group inline-block">
            <div className="mb-2 flex items-center justify-center gap-3">
              <div className="from-coffee-primary to-coffee-accent rounded-full bg-gradient-to-r p-3 transition-transform group-hover:scale-105">
                <Image
                  src="/logo.svg"
                  alt="Logo"
                  width={40}
                  height={40}
                  className="h-20 w-20"
                />
              </div>
            </div>
            <div className="from-coffee-primary via-coffee-accent to-coffee-primary bg-gradient-to-r bg-clip-text text-3xl font-bold text-transparent">
              Cow or King Café
            </div>
            {/* <p className="text-coffee-accent mt-1 text-sm">
              Coworking à Strasbourg
            </p> */}
          </Link>
        </div>

        {/* Main Auth Content */}
        <Card className="border-coffee-primary/20 border bg-white/90 shadow-lg backdrop-blur-sm">
          {children}
        </Card>

        {/* Footer */}
        <div className="text-coffee-accent text-center text-sm">
          <p>
            En continuant, vous acceptez nos{' '}
            <Link href="/terms" className="hover:text-coffee-primary underline">
              conditions d'utilisation
            </Link>{' '}
            et notre{' '}
            <Link
              href="/privacy"
              className="hover:text-coffee-primary underline"
            >
              politique de confidentialité
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
