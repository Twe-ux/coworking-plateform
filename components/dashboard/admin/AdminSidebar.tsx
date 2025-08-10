'use client'

import { Home, Calendar, Users, TrendingUp, Settings, LogOut, Building } from 'lucide-react'
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
      redirect: true 
    })
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-coffee-primary rounded-lg flex items-center justify-center">
            <Building className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Cow or King Café</h2>
            <p className="text-sm text-gray-500">Admin Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
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
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-3 w-full text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Déconnexion</span>
        </button>
      </div>
    </div>
  )
}