'use client'

import { ReactNode } from 'react'
import { ClientSidebar } from './client-sidebar'
import { ClientHeaderSimple as ClientHeader } from './client-header-simple'
import { cn } from '@/lib/utils'

interface ClientLayoutProps {
  children: ReactNode
  className?: string
}

export function ClientLayout({ children, className }: ClientLayoutProps) {
  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'var(--color-client-bg)' }}
    >
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden w-72 border-r border-[var(--color-client-border)] bg-[var(--color-client-card)] lg:block">
          <ClientSidebar />
        </aside>

        {/* Main content */}
        <div className="flex-1">
          {/* Header */}
          <ClientHeader />

          {/* Page content */}
          <main className={cn('p-4 md:p-6 lg:p-8', className)}>
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  )
}
