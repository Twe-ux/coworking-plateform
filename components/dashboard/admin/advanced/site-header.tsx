'use client'

import { SidebarTrigger } from '@/components/dashboard/admin/advanced/ui/sidebar'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/dashboard/admin/advanced/ui/avatar'
import { Badge } from '@/components/dashboard/admin/advanced/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/dashboard/admin/advanced/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/dashboard/admin/advanced/ui/dropdown-menu'
import { Input } from '@/components/dashboard/admin/advanced/ui/input'
import { Separator } from '@/components/dashboard/admin/advanced/ui/separator'
import {
  Bell,
  HelpCircle,
  LogOut,
  MessageSquare,
  Moon,
  Search,
  Settings,
  Sun,
  User,
} from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const generateBreadcrumbs = (pathname: string) => {
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs = []

  // Remove 'dashboard' and 'admin' from breadcrumbs display
  const filteredSegments = segments.slice(2) // Remove 'dashboard' and 'admin'

  if (filteredSegments.length === 0) {
    return [
      { label: 'Vue d&apos;ensemble', href: '/dashboard/admin', current: true },
    ]
  }

  // Add home breadcrumb
  breadcrumbs.push({
    label: 'Dashboard',
    href: '/dashboard/admin',
    current: false,
  })

  // Add each segment
  filteredSegments.forEach((segment, index) => {
    const href =
      '/dashboard/admin/' + filteredSegments.slice(0, index + 1).join('/')
    const label = segment.charAt(0).toUpperCase() + segment.slice(1)
    const current = index === filteredSegments.length - 1

    // Translate common terms
    const translations: { [key: string]: string } = {
      users: 'Utilisateurs',
      bookings: 'Réservations',
      spaces: 'Espaces',
      analytics: 'Analytics',
      settings: 'Paramètres',
      advanced: 'Avancé',
      create: 'Créer',
      edit: 'Modifier',
    }

    breadcrumbs.push({
      label: translations[segment] || label,
      href,
      current,
    })
  })

  return breadcrumbs
}

export function SiteHeader() {
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState('')
  const breadcrumbs = generateBreadcrumbs(pathname || '')

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 flex h-16 shrink-0 items-center border-b backdrop-blur">
      <div className="flex w-full items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />

        {/* Breadcrumb Navigation */}
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((breadcrumb, index) => (
              <div key={breadcrumb.href} className="flex items-center">
                {index > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {breadcrumb.current ? (
                    <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={breadcrumb.href}>
                      {breadcrumb.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </div>
            ))}
          </BreadcrumbList>
        </Breadcrumb>

        <div className="ml-auto flex items-center gap-2">
          {/* Search */}
          <div className="relative hidden md:flex">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              type="search"
              placeholder="Rechercher..."
              className="w-64 pr-4 pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MessageSquare className="h-4 w-4" />
              <span className="sr-only">Messages</span>
            </Button>

            <Button variant="ghost" size="icon" className="h-8 w-8">
              <HelpCircle className="h-4 w-4" />
              <span className="sr-only">Aide</span>
            </Button>

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-8 w-8"
                >
                  <Bell className="h-4 w-4" />
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 p-0 text-xs">
                    3
                  </Badge>
                  <span className="sr-only">Notifications</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications (3)</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="space-y-1">
                  <div className="hover:bg-muted/50 flex items-start gap-3 rounded-lg p-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        Nouvelle réservation
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Jean Dupont a réservé la Salle Verrière
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Il y a 5 minutes
                      </p>
                    </div>
                  </div>
                  <div className="hover:bg-muted/50 flex items-start gap-3 rounded-lg p-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-green-500" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">Paiement reçu</p>
                      <p className="text-muted-foreground text-xs">
                        €45 pour la réservation #1234
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Il y a 15 minutes
                      </p>
                    </div>
                  </div>
                  <div className="hover:bg-muted/50 flex items-start gap-3 rounded-lg p-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-yellow-500" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        Maintenance programmée
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Espace Co-Lab indisponible demain 9h-11h
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Il y a 1 heure
                      </p>
                    </div>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <div className="p-2">
                  <Button variant="ghost" className="w-full text-sm">
                    Voir toutes les notifications
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme Toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Sun className="h-4 w-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
                  <Moon className="absolute h-4 w-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
                  <span className="sr-only">Changer le thème</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Sun className="mr-2 h-4 w-4" />
                  Clair
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Moon className="mr-2 h-4 w-4" />
                  Sombre
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Système
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/avatars/admin.png" alt="Admin" />
                  <AvatarFallback>AD</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm leading-none font-medium">Admin</p>
                  <p className="text-muted-foreground text-xs leading-none">
                    admin@coworking.com
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Mon profil</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Paramètres</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Déconnexion</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
