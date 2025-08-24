import type { Metadata, Viewport } from 'next'
// import { Inter } from 'next/font/google'
import ConditionalFooter from '@/components/ConditionalFooter'
import ConditionalNavigation from '@/components/ConditionalNavigation'
import { CookieBanner } from '@/components/legal/CookieBanner'
import { AuthProvider } from '@/components/providers/auth-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { ToastProvider } from '@/components/ui/toast'
import { Nunito } from 'next/font/google'
import Script from 'next/script'
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
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <body className={nunito.className}>
        <Script
          src="https://dappros-wp-scripts.s3.us-east-2.amazonaws.com/ethora_assistant.js"
          id="chat-content-assistant"
          data-bot-id="68aae2b6fac7d0b33bea4826_68aae2b7fac7d0b33bea4834-bot@xmpp.ethoradev.com"
          strategy="afterInteractive"
        />

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
