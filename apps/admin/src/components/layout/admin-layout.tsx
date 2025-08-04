'use client'

import { cn } from '@/lib/utils'
import { Badge, Button } from '@coworking/ui'
import {
  BarChart3Icon,
  HomeIcon,
  LogOutIcon,
  MenuIcon,
  SettingsIcon,
  UsersIcon,
  XIcon,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

interface AdminLayoutProps {
  children: React.ReactNode
}

const navigation = [
  {
    name: 'Tableau de bord',
    href: '/',
    icon: HomeIcon,
  },
  {
    name: 'Utilisateurs',
    href: '/users',
    icon: UsersIcon,
    badge: 'Hot',
  },
  {
    name: 'Statistiques',
    href: '/stats',
    icon: BarChart3Icon,
  },
  {
    name: 'Paramètres',
    href: '/settings',
    icon: SettingsIcon,
  },
]

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  return (
    <div className="bg-background flex min-h-screen">
      {/* Sidebar mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-black/50" />
        </div>
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'bg-card fixed inset-y-0 left-0 z-50 w-64 transform border-r transition-transform duration-300 ease-in-out lg:static lg:inset-0 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b px-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
                <span className="text-primary-foreground text-sm font-bold">
                  CW
                </span>
              </div>
              <span className="text-lg font-semibold">Admin</span>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 px-4 py-6">
            {navigation.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href))

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                  {item.badge && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* User section */}
          <div className="border-t p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-full">
                <span className="text-xs font-medium">AD</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Admin User</p>
                <p className="text-muted-foreground text-xs">
                  admin@example.com
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full gap-2">
              <LogOutIcon className="h-4 w-4" />
              Déconnexion
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1">
        {/* Top bar mobile */}
        <div className="bg-card flex h-16 items-center justify-between border-b px-4 lg:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
          >
            <MenuIcon className="h-4 w-4" />
          </Button>
          <h1 className="font-semibold">Admin Panel</h1>
          <div className="w-10" /> {/* Spacer */}
        </div>

        {/* Page content */}
        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  )
}
