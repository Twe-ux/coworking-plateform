'use client'

import { usePathname } from 'next/navigation'
import Footer from './Footer'

export default function ConditionalFooter() {
  const pathname = usePathname()

  // Ne pas afficher le footer sur les pages du dashboard
  const isDashboardPage = pathname?.startsWith('/dashboard')

  if (isDashboardPage) {
    return null
  }

  return <Footer />
}
