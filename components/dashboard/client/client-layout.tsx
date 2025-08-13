'use client'

import { ReactNode } from 'react'

interface ClientLayoutProps {
  children: ReactNode
}

export function ClientLayout({ children }: ClientLayoutProps) {
  return <div className="min-h-screen bg-gray-50">{children}</div>
}
