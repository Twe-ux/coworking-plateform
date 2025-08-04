import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AdminLayout } from '@/components/layout/admin-layout'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Admin - Café Coworking Platform',
  description: 'Admin panel for managing the platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <AdminLayout>
          {children}
        </AdminLayout>
      </body>
    </html>
  )
}