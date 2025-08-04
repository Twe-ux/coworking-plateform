import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { ThemeProvider } from '@/components/ThemeProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Cow or King Café - Coworking à Strasbourg',
  description: 'Espace de coworking unique au cœur de Strasbourg. Travaillez dans l\'atmosphère chaleureuse de notre café avec place, salle verrière et étage disponibles.',
  keywords: 'coworking, café, Strasbourg, espace de travail, freelance, nomade digital, salle verrière',
  authors: [{ name: 'Cow or King Café Team' }],
  openGraph: {
    title: 'Cow or King Café - Coworking à Strasbourg',
    description: 'Découvrez notre espace de coworking unique à Strasbourg. Place, salle verrière et étage disponibles.',
    type: 'website',
    locale: 'fr_FR',
    url: 'https://coworkingcafe.fr',
    images: [
      {
        url: '/logo.svg',
        width: 1200,
        height: 630,
        alt: 'Cow or King Café - Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cow or King Café - Coworking à Strasbourg',
    description: 'Espace de coworking unique au cœur de Strasbourg.',
  },
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  icons: {
    icon: '/favicon.svg',
    apple: '/logo.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="scroll-smooth">
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider>
          {/* Skip links for accessibility */}
          <a href="#main-content" className="skip-link">
            Aller au contenu principal
          </a>
          <a href="#navigation" className="skip-link">
            Aller à la navigation
          </a>
          
          <Navigation />
          <main id="main-content" className="min-h-screen" role="main">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  )
}