'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Shield,
  Users,
  Building,
  Calendar,
  BarChart3,
  Settings,
  CreditCard,
  Bell,
  Database,
  FileText,
  Globe,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

interface AdminSidebarItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  description?: string
  subItems?: AdminSidebarItem[]
}

const adminSidebarItems: AdminSidebarItem[] = [
  {
    href: '/dashboard/admin',
    label: "Vue d'ensemble",
    icon: Shield,
    description: 'Dashboard principal admin',
  },
  {
    href: '/dashboard/admin/users',
    label: 'Utilisateurs',
    icon: Users,
    description: 'Gestion des membres',
    badge: 'Actif',
  },
  {
    href: '/dashboard/admin/spaces',
    label: 'Espaces',
    icon: Building,
    description: 'Configuration des espaces',
  },
  {
    href: '/dashboard/admin/bookings',
    label: 'Réservations',
    icon: Calendar,
    description: 'Gestion des réservations',
  },
  {
    href: '/dashboard/admin/analytics',
    label: 'Analyses',
    icon: BarChart3,
    description: 'Statistiques et rapports',
  },
  {
    href: '/dashboard/admin/payments',
    label: 'Paiements',
    icon: CreditCard,
    description: 'Transactions et facturation',
  },
  {
    href: '/dashboard/admin/notifications',
    label: 'Notifications',
    icon: Bell,
    description: 'Système de notifications',
  },
  {
    href: '/dashboard/admin/content',
    label: 'Contenu',
    icon: FileText,
    description: 'Pages et contenu du site',
  },
  {
    href: '/dashboard/admin/system',
    label: 'Système',
    icon: Database,
    description: 'Configuration système',
  },
  {
    href: '/dashboard/admin/settings',
    label: 'Paramètres',
    icon: Settings,
    description: 'Configuration générale',
  },
]

export function AdminSidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()

  if (!session?.user || session.user.role !== 'admin') {
    return null
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Logo et branding admin */}
      <div
        className="border-b p-6"
        style={{
          borderColor: 'var(--color-vert-doux)',
          backgroundColor: 'var(--color-vert-foret)',
        }}
      >
        <div className="mb-4 flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ backgroundColor: 'var(--color-vert-doux)' }}
          >
            <Shield
              className="h-6 w-6"
              style={{ color: 'var(--color-vert-foret)' }}
            />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Admin Panel</h1>
            <p className="text-sm" style={{ color: 'var(--color-vert-doux)' }}>
              Coworking Platform
            </p>
          </div>
        </div>

        {/* Profil admin */}
        <div
          className="flex items-center gap-3 rounded-lg border p-3"
          style={{
            borderColor: 'var(--color-vert-doux)',
            backgroundColor: 'rgba(161, 214, 166, 0.1)',
          }}
        >
          <Avatar className="h-9 w-9">
            <AvatarImage src={session.user.image || undefined} alt="Avatar" />
            <AvatarFallback
              style={{ backgroundColor: 'var(--color-vert-doux)' }}
            >
              {session.user.name
                ?.split(' ')
                .map((n) => n[0])
                .join('') || 'A'}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">
              {session.user.name || 'Administrateur'}
            </p>
            <p
              className="truncate text-xs"
              style={{ color: 'var(--color-vert-doux)' }}
            >
              Super Admin
            </p>
          </div>
        </div>
      </div>

      {/* Navigation admin */}
      <nav
        className="flex-1 overflow-y-auto p-4"
        style={{ backgroundColor: '#f8fffe' }}
      >
        <div className="space-y-1">
          {adminSidebarItems.map((item) => {
            const Icon = item.icon
            const isActive =
              pathname === item.href || pathname?.startsWith(item.href + '/')

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 hover:scale-[1.02]',
                  isActive ? 'border shadow-sm' : 'hover:bg-white/80'
                )}
                style={{
                  backgroundColor: isActive
                    ? 'var(--color-vert-doux)'
                    : 'transparent',
                  borderColor: isActive
                    ? 'var(--color-vert-foret)'
                    : 'transparent',
                  color: isActive ? 'var(--color-vert-foret)' : '#374151',
                }}
              >
                <Icon
                  className={cn(
                    'h-5 w-5 transition-colors',
                    isActive
                      ? 'text-[var(--color-vert-foret)]'
                      : 'text-gray-500'
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{item.label}</span>
                    {item.badge && (
                      <Badge
                        variant="secondary"
                        className="px-2 py-0 text-xs"
                        style={{
                          backgroundColor: 'var(--color-fushia)',
                          color: 'white',
                        }}
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-gray-500">
                    {item.description}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Footer admin avec stats système */}
      <div
        className="border-t p-4"
        style={{
          borderColor: 'var(--color-vert-doux)',
          backgroundColor: '#f8fffe',
        }}
      >
        <div
          className="rounded-lg p-3 text-center"
          style={{
            backgroundColor: 'var(--color-vert-doux)',
            color: 'var(--color-vert-foret)',
          }}
        >
          <Globe className="mx-auto mb-2 h-5 w-5" />
          <p className="text-xs font-medium">Système opérationnel</p>
          <p className="text-xs opacity-75">Uptime: 99.9%</p>
        </div>
      </div>
    </div>
  )
}
