'use client'

import { usePathname } from 'next/navigation'
import Navigation from './Navigation'

export default function ConditionalNavigation() {
  const pathname = usePathname()

  // Ne pas afficher la navigation sur les pages du dashboard
  const isDashboardPage = pathname?.startsWith('/dashboard')

  if (isDashboardPage) {
    return null
  }

  return <Navigation />
}
