import { Header } from '@/components/dashboard/header'
import { Sidebar } from '@/components/dashboard/sidebar'
import { RouteGuard } from '@/components/auth/route-guard'
import { UserRole } from '@/types/auth'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <RouteGuard
      requiredRoles={[
        UserRole.CLIENT,
        UserRole.STAFF,
        UserRole.MANAGER,
        UserRole.ADMIN,
      ]}
    >
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <Header />
          <main className="flex-1 bg-gray-50 p-6 dark:bg-gray-900">
            {children}
          </main>
        </div>
      </div>
    </RouteGuard>
  )
}
