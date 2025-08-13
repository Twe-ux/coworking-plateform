'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Home,
  Calendar,
  MapPin,
  Users,
  Settings,
  BarChart3,
  Shield,
  Building,
} from 'lucide-react'

interface SidebarItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  roles: string[]
}

const sidebarItems: SidebarItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard Client',
    icon: Home,
    roles: ['client'],
  },
  {
    href: '/dashboard/staff',
    label: 'Dashboard Staff',
    icon: Building,
    roles: ['staff'],
  },
  {
    href: '/dashboard/manager',
    label: 'Dashboard Manager',
    icon: BarChart3,
    roles: ['manager'],
  },
  {
    href: '/dashboard/admin',
    label: 'Dashboard Admin',
    icon: Shield,
    roles: ['admin'],
  },
  {
    href: '/reservation',
    label: 'Réservations',
    icon: Calendar,
    roles: ['client', 'staff', 'manager', 'admin'],
  },
  {
    href: '/spaces',
    label: 'Espaces',
    icon: MapPin,
    roles: ['client', 'staff', 'manager', 'admin'],
  },
  {
    href: '/dashboard/admin/users',
    label: 'Utilisateurs',
    icon: Users,
    roles: ['admin'],
  },
  {
    href: '/settings',
    label: 'Paramètres',
    icon: Settings,
    roles: ['client', 'staff', 'manager', 'admin'],
  },
]

export function Sidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()

  if (!session?.user) {
    return null
  }

  const userRole = session.user.role
  const filteredItems = sidebarItems.filter((item) =>
    item.roles.includes(userRole)
  )

  return (
    <div className="w-64 border-r border-gray-200 bg-white">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Coworking Platform
        </h2>
        <p className="text-sm text-gray-600 capitalize">{userRole}</p>
      </div>

      <nav className="px-4 pb-4">
        <ul className="space-y-2">
          {filteredItems.map((item) => {
            const Icon = item.icon
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/')

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
