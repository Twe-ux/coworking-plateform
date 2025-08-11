'use client'

import { RouteGuard } from '@/components/auth/route-guard'
import { AppSidebar } from '@/components/dashboard/admin/advanced/app-sidebar'
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/dashboard/admin/advanced/ui/sidebar'
import { Header } from '@/components/dashboard/header'
import { Sidebar } from '@/components/dashboard/sidebar'
import { UserRole } from '@/types/auth'
import {
  BarChart3,
  Bell,
  Building,
  Calendar,
  CreditCard,
  FileText,
  Headphones,
  Home,
  Settings,
  Shield,
  Users,
} from 'lucide-react'
import { useSession } from 'next-auth/react'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session } = useSession()
  const userRole = session?.user?.role

  const data =
    userRole === 'admin'
      ? {
          user: {
            name: 'Administrateur',
            email: 'admin@example.com',
            avatar: '/avatars/default.jpg',
          },
          navMain: [
            {
              title: 'Dashboard',
              url: '/dashboard/admin',
              icon: Home,
            },
            {
              title: 'Réservations',
              url: '/dashboard/admin/bookings',
              icon: Calendar,
              items: [
                {
                  title: 'Toutes les réservations',
                  url: '/dashboard/admin/bookings',
                },
                {
                  title: 'Créer une réservation',
                  url: '/dashboard/admin/bookings/create',
                },
                {
                  title: 'Calendrier',
                  url: '/dashboard/admin/calendar',
                },
              ],
            },
            {
              title: 'Espaces',
              url: '/dashboard/admin/spaces',
              icon: Building,
              items: [
                {
                  title: 'Gérer les espaces',
                  url: '/dashboard/admin/spaces',
                },
                {
                  title: 'Gestion avancée',
                  url: '/dashboard/admin/spaces/manage',
                },
                {
                  title: 'Ajouter un espace',
                  url: '/dashboard/admin/spaces/create',
                },
                {
                  title: 'Configuration',
                  url: '/dashboard/admin/spaces/settings',
                },
              ],
            },
            {
              title: 'Utilisateurs',
              url: '/dashboard/admin/users',
              icon: Users,
              items: [
                {
                  title: 'Tous les utilisateurs',
                  url: '/dashboard/admin/users',
                },
                {
                  title: 'Rôles et permissions',
                  url: '/dashboard/admin/users/roles',
                },
                {
                  title: 'Invitations',
                  url: '/dashboard/admin/users/invitations',
                },
              ],
            },
            {
              title: 'Analytics',
              url: '/dashboard/admin/analytics',
              icon: BarChart3,
            },
          ],
          navSecondary: [
            {
              title: 'Paiements',
              url: '/dashboard/admin/payments',
              icon: CreditCard,
            },
            {
              title: 'Notifications',
              url: '/dashboard/admin/notifications',
              icon: Bell,
            },
            {
              title: 'Support',
              url: '/dashboard/admin/support',
              icon: Headphones,
            },
            {
              title: 'Sécurité',
              url: '/dashboard/admin/security',
              icon: Shield,
            },
            {
              title: 'Rapports',
              url: '/dashboard/admin/reports',
              icon: FileText,
            },
            {
              title: 'Paramètres',
              url: '/dashboard/admin/settings',
              icon: Settings,
            },
          ],
        } // Si l'utilisateur n'est pas admin, on ne charge pas les données
      : {
          navMain: [
            {
              title: 'Dashboard',
              url: '/dashboard/admin',
              icon: Home,
            },
            {
              title: 'Réservations',
              url: '/dashboard/admin/bookings',
              icon: Calendar,
              items: [
                {
                  title: 'Toutes les réservations',
                  url: '/dashboard/admin/bookings',
                },
                {
                  title: 'Créer une réservation',
                  url: '/dashboard/admin/bookings/create',
                },
                {
                  title: 'Calendrier',
                  url: '/dashboard/admin/calendar',
                },
              ],
            },
            {
              title: 'Espaces',
              url: '/dashboard/admin/spaces',
              icon: Building,
              items: [
                {
                  title: 'Gérer les espaces',
                  url: '/dashboard/admin/spaces',
                },
                {
                  title: 'Gestion avancée',
                  url: '/dashboard/admin/spaces/manage',
                },
                {
                  title: 'Ajouter un espace',
                  url: '/dashboard/admin/spaces/create',
                },
                {
                  title: 'Configuration',
                  url: '/dashboard/admin/spaces/settings',
                },
              ],
            },
            {
              title: 'Utilisateurs',
              url: '/dashboard/admin/users',
              icon: Users,
              items: [
                {
                  title: 'Tous les utilisateurs',
                  url: '/dashboard/admin/users',
                },
                {
                  title: 'Rôles et permissions',
                  url: '/dashboard/admin/users/roles',
                },
                {
                  title: 'Invitations',
                  url: '/dashboard/admin/users/invitations',
                },
              ],
            },
            {
              title: 'Analytics',
              url: '/dashboard/admin/analytics',
              icon: BarChart3,
            },
          ],
          navSecondary: [
            {
              title: 'Paiements',
              url: '/dashboard/admin/payments',
              icon: CreditCard,
            },
            {
              title: 'Notifications',
              url: '/dashboard/admin/notifications',
              icon: Bell,
            },
            {
              title: 'Support',
              url: '/dashboard/admin/support',
              icon: Headphones,
            },
            {
              title: 'Sécurité',
              url: '/dashboard/admin/security',
              icon: Shield,
            },
            {
              title: 'Rapports',
              url: '/dashboard/admin/reports',
              icon: FileText,
            },
            {
              title: 'Paramètres',
              url: '/dashboard/admin/settings',
              icon: Settings,
            },
          ],
        }

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
      ) : /* Layout traditionnel pour admin, staff, manager */
      userRole === 'admin' || userRole === 'staff' || userRole === 'manager' ? (
        <SidebarProvider>
          <AppSidebar data={data} collapsible="icon" />
          <SidebarInset>
            <div className="flex flex-1 flex-col">
              <main className="flex-1 bg-gray-50">{children}</main>
            </div>
          </SidebarInset>
        </SidebarProvider>
      ) : (
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex flex-1 flex-col">
            <Header />
            <main className="flex-1 bg-gray-50 p-6">{children}</main>
          </div>
        </div>
      )}
    </RouteGuard>
  )
}
