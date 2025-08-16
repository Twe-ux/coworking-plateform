import type { Metadata, Viewport } from 'next'
// import { Inter } from 'next/font/google'
import ConditionalFooter from '@/components/ConditionalFooter'
import ConditionalNavigation from '@/components/ConditionalNavigation'
import { AuthProvider } from '@/components/providers/auth-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { ToastProvider } from '@/components/ui/toast'
import { CookieBanner } from '@/components/legal/CookieBanner'
import { Nunito } from 'next/font/google'
import './globals.css'

const nunito = Nunito({
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Cow or King Café - Coworking Strasbourg',
  description:
    'Votre espace de coworking au cœur de Strasbourg. Trois ambiances uniques dans un cadre exceptionnel.',
  icons: {
    icon: [
      {
        url: '/favicon.svg',
        type: 'image/svg+xml',
      },
    ],
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  manifest: '/site.webmanifest',
}

export const viewport: Viewport = {
  themeColor: '#D2691E',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={nunito.className}>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <ConditionalNavigation />
              {children}
              <ConditionalFooter />
              <CookieBanner />
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
