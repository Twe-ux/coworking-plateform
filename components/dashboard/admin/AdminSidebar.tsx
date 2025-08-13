'use client'

import {
  Home,
  Calendar,
  Users,
  TrendingUp,
  Settings,
  LogOut,
  Building,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

interface SidebarItem {
  icon: React.ComponentType<{ className?: string }>
  label: string
  href: string
  isActive?: boolean
}

/**
 * Sidebar de navigation pour le dashboard administrateur
 */
export default function AdminSidebar() {
  const pathname = usePathname()

  const menuItems: SidebarItem[] = [
    {
      icon: Home,
      label: 'Dashboard',
      href: '/dashboard/admin',
    },
    {
      icon: Calendar,
      label: 'Réservations',
      href: '/dashboard/admin/bookings',
    },
    {
      icon: Building,
      label: 'Espaces',
      href: '/dashboard/admin/spaces',
    },
    {
      icon: Users,
      label: 'Utilisateurs',
      href: '/dashboard/admin/users',
    },
    {
      icon: TrendingUp,
      label: 'Analytics',
      href: '/dashboard/admin/analytics',
    },
    {
      icon: Settings,
      label: 'Paramètres',
      href: '/dashboard/admin/settings',
    },
  ]

  const handleSignOut = async () => {
    await signOut({
      callbackUrl: '/auth/signin',
      redirect: true,
    })
  }

  return (
    <div className="flex w-64 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center gap-3">
          <div className="bg-coffee-primary flex h-10 w-10 items-center justify-center rounded-lg">
            <Building className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Cow or King Café</h2>
            <p className="text-sm text-gray-500">Admin Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
                isActive
                  ? 'bg-coffee-primary text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Actions du bas */}
      <div className="border-t border-gray-200 p-4">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-gray-700 transition-colors hover:bg-gray-100"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Déconnexion</span>
        </button>
      </div>
    </div>
  )
}
