'use client'

import { RouteGuard } from '@/components/auth/route-guard'
import { AppSidebar } from '@/components/dashboard/admin/advanced/app-sidebar'
import { AVAILABLE_ROLES } from '@/components/dashboard/admin/advanced/team-switcher'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/dashboard/admin/advanced/ui/breadcrumb'
import { Separator } from '@/components/dashboard/admin/advanced/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/dashboard/admin/advanced/ui/sidebar'
import { TeamProvider, useTeam } from '@/contexts/team-context'
import { UserRole } from '@/types/auth'
import {
  BarChart3,
  Building,
  Calendar,
  FileText,
  Home,
  Settings,
  Shield,
  UserCheck,
  Users,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import * as React from 'react'

interface DashboardLayoutProps {
  children: React.ReactNode
}

function DashboardContent({ children }: DashboardLayoutProps) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const userRole = session?.user?.role
  const { selectedTeam } = useTeam()

  // Generate breadcrumb based on current path
  const generateBreadcrumb = () => {
    const segments = pathname.split('/').filter(Boolean)
    const breadcrumbs: { label: string; href: string; current?: boolean }[] = []

    if (segments.length > 1) {
      breadcrumbs.push()

      if (segments[1] === 'admin') {
        breadcrumbs.push({ label: 'Dashboard', href: '/dashboard/admin' })
        if (segments[2]) {
          const pageLabels: { [key: string]: string } = {
            bookings: 'Réservations',
            users: 'Utilisateurs',
            spaces: 'Espaces',
            analytics: 'Analytics',
            blog: 'Blog & CMS',
            settings: 'Paramètres',
            calendar: 'Calendrier',
            schedule: 'Plannification',
          }
          breadcrumbs.push({
            label: pageLabels[segments[2]] || segments[2],
            href: `/dashboard/admin/${segments[2]}`,
            current: true,
          })
        }
      } else if (segments[1] === 'manager') {
        breadcrumbs.push({ label: 'Manager', href: '/dashboard/manager' })
        if (segments[2]) {
          const pageLabels: { [key: string]: string } = {
            team: 'Équipe',
            bookings: 'Réservations',
            reports: 'Rapports',
            schedule: 'Plannification',
          }
          breadcrumbs.push({
            label: pageLabels[segments[2]] || segments[2],
            href: `/dashboard/manager/${segments[2]}`,
            current: true,
          })
        }
      } else if (segments[1] === 'staff') {
        breadcrumbs.push({ label: 'Staff', href: '/dashboard/staff' })
        if (segments[2]) {
          const pageLabels: { [key: string]: string } = {
            tasks: 'Mes Tâches',
            bookings: 'Réservations',
            schedule: 'Plannification',
          }
          breadcrumbs.push({
            label: pageLabels[segments[2]] || segments[2],
            href: `/dashboard/staff/${segments[2]}`,
            current: true,
          })
        }
      }
    } else {
      breadcrumbs.push({
        label: 'Dashboard',
        href: '/dashboard',
        current: true,
      })
    }

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumb()

  // Navigation data based on selected team
  const getNavigationForTeam = () => {
    const currentRole = selectedTeam?.value || userRole || 'admin'

    const baseNavigation = {
      user: {
        name: session?.user?.name || 'Utilisateur',
        email: session?.user?.email || 'user@example.com',
        avatar:
          (session?.user as any)?.avatar ||
          session?.user?.image ||
          '/avatars/admin.png',
        image: session?.user?.image || '/avatars/admin.png',
      },
      teams:
        userRole === 'admin' ? AVAILABLE_ROLES : [selectedTeam].filter(Boolean),
    }

    // Navigation based on current role
    switch (currentRole) {
      case 'admin':
        return {
          ...baseNavigation,
          navMain: [
            {
              title: 'Dashboard',
              url: '/dashboard/admin',
              icon: Home,
              isActive: pathname === '/dashboard/admin',
            },
            {
              title: 'Réservations',
              url: '/dashboard/admin/bookings',
              icon: Calendar,
              isActive: pathname.startsWith('/dashboard/admin/bookings'),
              items: [
                {
                  title: 'Toutes les réservations',
                  url: '/dashboard/admin/bookings',
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
              isActive: pathname.startsWith('/dashboard/admin/spaces'),
              items: [
                {
                  title: 'Gérer les espaces',
                  url: '/dashboard/admin/spaces',
                },
                {
                  title: 'Ajouter un espace',
                  url: '/dashboard/admin/spaces/create',
                },
              ],
            },
            {
              title: 'Utilisateurs',
              url: '/dashboard/admin/users',
              icon: Users,
              isActive: pathname.startsWith('/dashboard/admin/users'),
            },
            {
              title: 'Analytics',
              url: '/dashboard/admin/analytics',
              icon: BarChart3,
              isActive: pathname.startsWith('/dashboard/admin/analytics'),
            },
            {
              title: 'Blog & CMS',
              url: '/dashboard/admin/blog',
              icon: FileText,
              isActive: pathname.startsWith('/dashboard/admin/blog'),
              items: [
                {
                  title: 'Vue d\'ensemble',
                  url: '/dashboard/admin/blog',
                },
                {
                  title: 'Articles',
                  url: '/dashboard/admin/blog/articles',
                },
                {
                  title: 'Catégories',
                  url: '/dashboard/admin/blog/categories',
                },
                {
                  title: 'Commentaires',
                  url: '/dashboard/admin/blog/comments',
                },
              ],
            },
            {
              title: 'Plannification',
              url: '/dashboard/admin/schedule',
              icon: Users,
              isActive: pathname.startsWith('/dashboard/admin/schedule'),
            },
            {
              title: 'Paramètres',
              url: '/dashboard/admin/settings',
              icon: Settings,
              isActive: pathname.startsWith('/dashboard/admin/settings'),
            },
          ],
        }

      case 'manager':
        return {
          ...baseNavigation,
          navMain: [
            {
              title: 'Dashboard Manager',
              url: '/dashboard/manager',
              icon: Shield,
              isActive: pathname === '/dashboard/manager',
            },
            {
              title: 'Équipe',
              url: '/dashboard/manager/team',
              icon: Users,
              isActive: pathname.startsWith('/dashboard/manager/team'),
            },
            {
              title: 'Plannification',
              url: '/dashboard/manager/schedule',
              icon: Users,
              isActive: pathname.startsWith('/dashboard/manager/schedule'),
            },
            {
              title: 'Réservations',
              url: '/dashboard/manager/bookings',
              icon: Calendar,
              isActive: pathname.startsWith('/dashboard/manager/bookings'),
            },
            {
              title: 'Blog & CMS',
              url: '/dashboard/admin/blog',
              icon: FileText,
              isActive: pathname.startsWith('/dashboard/admin/blog'),
            },
            {
              title: 'Rapports',
              url: '/dashboard/manager/reports',
              icon: BarChart3,
              isActive: pathname.startsWith('/dashboard/manager/reports'),
            },
          ],
        }

      case 'staff':
        return {
          ...baseNavigation,
          navMain: [
            {
              title: 'Dashboard Staff',
              url: '/dashboard/staff',
              icon: UserCheck,
              isActive: pathname === '/dashboard/staff',
            },
            {
              title: 'Mes Tâches',
              url: '/dashboard/staff/tasks',
              icon: FileText,
              isActive: pathname.startsWith('/dashboard/staff/tasks'),
            },
            {
              title: 'Réservations',
              url: '/dashboard/staff/bookings',
              icon: Calendar,
              isActive: pathname.startsWith('/dashboard/staff/bookings'),
            },
            {
              title: 'Plannification',
              url: '/dashboard/staff/schedule',
              icon: Users,
              isActive: pathname.startsWith('/dashboard/staff/schedule'),
            },
          ],
        }

      default:
        return baseNavigation
    }
  }

  const data = getNavigationForTeam()

  return (
    <SidebarProvider className="min-h-screen" defaultOpen={false}>
      <AppSidebar data={data} variant="floating" collapsible="icon" />
      <SidebarInset className="min-h-screen pt-4 pl-20">
        <header className="flex h-8 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="px-é flex items-center gap-2">
            {/* <SidebarTrigger className="-ml-1" /> */}
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((breadcrumb, index) => (
                  <React.Fragment key={breadcrumb.href}>
                    <BreadcrumbItem className="hidden md:block">
                      {breadcrumb.current ? (
                        <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink href={breadcrumb.href}>
                          {breadcrumb.label}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {index < breadcrumbs.length - 1 && (
                      <BreadcrumbSeparator className="hidden md:block" />
                    )}
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-2 p-2 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session } = useSession()
  const userRole = session?.user?.role

  // Determine available teams and default team based on user role
  const availableTeams =
    userRole === 'admin'
      ? AVAILABLE_ROLES
      : AVAILABLE_ROLES.filter((role) => role.value === userRole)
  const defaultTeam =
    availableTeams.find((team) => team.value === userRole) || availableTeams[0]

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
        <TeamProvider availableTeams={availableTeams} defaultTeam={defaultTeam}>
          <DashboardContent>{children}</DashboardContent>
        </TeamProvider>
      ) : (
        children
      )}
    </RouteGuard>
  )
}
