'use client'

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/dashboard/admin/advanced/ui/avatar'
import { Button } from '@/components/dashboard/admin/advanced/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/dashboard/admin/advanced/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/dashboard/admin/advanced/ui/dropdown-menu'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '@/components/dashboard/admin/advanced/ui/sidebar'
import { cn } from '@/lib/utils'
import {
  BarChart3,
  Bell,
  Building,
  Calendar,
  ChevronRight,
  CreditCard,
  FileText,
  Headphones,
  Home,
  Plus,
  Settings,
  Shield,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const data = {
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

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  variant?: 'sidebar' | 'inset'
}

export function AppSidebar({ variant = 'sidebar', ...props }: AppSidebarProps) {
  const pathname = usePathname()

  return (
    <Sidebar
      collapsible="icon"
      variant={variant}
      className={cn('!bg-sidebar', variant === 'inset' && 'border-0')}
      {...props}
    >
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="bg-coffee-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
            <Building className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">Café Coworking</span>
            <span className="truncate text-xs">Administration</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation Principale</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.navMain.map((item) => {
                const isActive =
                  pathname === item.url || pathname.startsWith(item.url + '/')

                return (
                  <Collapsible
                    key={item.title}
                    asChild
                    defaultOpen={isActive}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          tooltip={item.title}
                          className={cn(
                            'hover:bg-coffee-primary/10 hover:text-coffee-primary',
                            isActive &&
                              'bg-coffee-primary/20 text-coffee-primary font-medium'
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                          <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items?.map((subItem) => {
                            const isSubActive = pathname === subItem.url

                            return (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton
                                  asChild
                                  className={cn(
                                    'hover:bg-coffee-primary/10 hover:text-coffee-primary',
                                    isSubActive &&
                                      'bg-coffee-primary/20 text-coffee-primary font-medium'
                                  )}
                                >
                                  <Link href={subItem.url}>
                                    <span>{subItem.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            )
                          })}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Outils</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.navSecondary.map((item) => {
                const isActive = pathname === item.url

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      className={cn(
                        'hover:bg-coffee-primary/10 hover:text-coffee-primary',
                        isActive &&
                          'bg-coffee-primary/20 text-coffee-primary font-medium'
                      )}
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Actions Rapides</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="space-y-2 px-2">
              <Button
                className="bg-coffee-primary hover:bg-coffee-primary/90 w-full justify-start"
                size="sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle réservation
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                size="sm"
              >
                <Building className="mr-2 h-4 w-4" />
                Ajouter un espace
              </Button>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  // size="lg"
                  className="hover:bg-coffee-primary/10"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src="/avatars/admin.png" alt="Admin" />
                    <AvatarFallback className="bg-coffee-primary rounded-lg text-white">
                      AD
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Admin</span>
                    <span className="truncate text-xs">
                      admin@coworking.com
                    </span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem className="hover:bg-coffee-primary/10">
                  <Settings className="mr-2 h-4 w-4" />
                  Mon profil
                </DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-coffee-primary/10">
                  <Bell className="mr-2 h-4 w-4" />
                  Notifications
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600 hover:bg-red-50">
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
