'use client'

import { RouteGuard } from '@/components/auth/route-guard'
import { AdminSidebar } from '@/components/dashboard/admin/admin-sidebar'
import { Header } from '@/components/dashboard/header'
import { Sidebar } from '@/components/dashboard/sidebar'
import { UserRole } from '@/types/auth'
import { useSession } from 'next-auth/react'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session } = useSession()
  const userRole = session?.user?.role

  return (
    <RouteGuard
      requiredRoles={[
        UserRole.CLIENT,
        UserRole.STAFF,
        UserRole.MANAGER,
        UserRole.ADMIN,
      ]}
    >
      {/* Client utilise le layout café personnalisé */}
      {userRole === 'client' ? (
        children // Le ClientLayout est géré dans chaque page client individuellement
      ) : (
        /* Layout traditionnel pour admin, staff, manager */
        <div className="flex min-h-screen">
          {userRole === 'admin' ? <AdminSidebar /> : <Sidebar />}
          <div className="flex flex-1 flex-col">
            <Header />
            <main className="flex-1 bg-gray-50 p-6">{children}</main>
          </div>
        </div>
      )}
    </RouteGuard>
  )
}
