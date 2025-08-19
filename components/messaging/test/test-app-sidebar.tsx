'use client'

import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Hash,
  MessageCircle,
  Search,
  Settings,
  Users,
} from 'lucide-react'
import * as React from 'react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from '@/components/messaging/test/ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useSession } from 'next-auth/react'

interface TestAppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  onViewChange?: (
    view: 'messages' | 'channels' | 'contacts' | 'settings'
  ) => void
}

export function TestAppSidebar({
  onViewChange,
  ...props
}: TestAppSidebarProps) {
  const { data: session } = useSession()
  const { state } = useSidebar()
  const [activeView, setActiveView] = React.useState<
    'messages' | 'channels' | 'contacts' | 'settings'
  >('messages')

  const isExpanded = state === 'expanded'

  const handleViewChange = (
    view: 'messages' | 'channels' | 'contacts' | 'settings'
  ) => {
    setActiveView(view)
    onViewChange?.(view)
  }

  const getUserDisplayName = () => {
    if (session?.user?.firstName && session?.user?.lastName) {
      return `${session.user.firstName} ${session.user.lastName}`
    }
    return session?.user?.name || session?.user?.email || 'Utilisateur'
  }

  const getUserInitials = () => {
    const name = getUserDisplayName()
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  }

  const mainMenuItems = [
    {
      title: 'Messages',
      url: '#',
      icon: MessageCircle,
      isActive: activeView === 'messages',
      onClick: () => handleViewChange('messages'),
      badge: 3, // Exemple de badge pour messages non lus
    },
    {
      title: 'Contacts',
      url: '#',
      icon: Users,
      isActive: activeView === 'contacts',
      onClick: () => handleViewChange('contacts'),
    },
    {
      title: 'Channels',
      url: '#',
      icon: Hash,
      isActive: activeView === 'channels',
      onClick: () => handleViewChange('channels'),
    },
  ]

  const secondaryItems = [
    // {
    //   title: 'Appels',
    //   url: '#',
    //   icon: Phone,
    //   onClick: () => {},
    // },
    // {
    //   title: 'Vidéo',
    //   url: '#',
    //   icon: Video,
    //   onClick: () => {},
    // },
    {
      title: 'Notifications',
      url: '#',
      icon: Bell,
      onClick: () => {},
      badge: 1,
    },
  ]

  return (
    <Sidebar variant="floating" {...props}>
      {/* Bouton toggle pour sidebar collapsed */}
      {!isExpanded && (
        <div className="p-2">
          <SidebarTrigger className="h-10 w-full rounded-md transition-colors hover:bg-gray-100">
            <ChevronRight className="h-4 w-4" />
          </SidebarTrigger>
        </div>
      )}

      {/* Header avec profil utilisateur */}
      <SidebarHeader
        className={cn(
          'p-4 transition-all duration-300',
          !isExpanded && 'hidden'
        )}
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={session?.user?.image || undefined}
                alt={getUserDisplayName()}
              />
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 font-semibold text-white">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">
                {getUserDisplayName()}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                En ligne
              </div>
            </div>
          </div>

          {/* Bouton de fermeture */}
          <SidebarTrigger className="h-8 w-8 shrink-0 rounded-md transition-colors hover:bg-gray-100">
            <ChevronLeft className="h-4 w-4" />
          </SidebarTrigger>
        </div>

        {/* Barre de recherche rapide */}
        <div className="mt-4">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-gray-500"
          >
            <Search className="mr-2 h-4 w-4" />
            Rechercher...
          </Button>
        </div>
      </SidebarHeader>

      {/* Contenu principal */}
      <SidebarContent className="p-2">
        {/* Menu principal */}
        <SidebarMenu className={isExpanded ? 'block' : 'flex items-center'}>
          {isExpanded && (
            <div className="px-2 py-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">
              Navigation
            </div>
          )}
          {mainMenuItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                onClick={item.onClick}
                isActive={item.isActive}
                className="relative"
                tooltip={!isExpanded ? item.title : undefined}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {isExpanded && <span>{item.title}</span>}
                {item.badge && item.badge > 0 && isExpanded && (
                  <Badge
                    variant="secondary"
                    className="ml-auto flex h-5 w-5 items-center justify-center bg-blue-500 p-0 text-xs text-white"
                  >
                    {item.badge}
                  </Badge>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        {/* Menu secondaire */}
        <SidebarMenu
          className={isExpanded ? 'mt-6 block' : 'mt-6 flex items-center'}
        >
          {isExpanded && (
            <div className="px-2 py-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">
              Outils
            </div>
          )}
          {secondaryItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                onClick={item.onClick}
                className="relative"
                tooltip={!isExpanded ? item.title : undefined}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {isExpanded && <span>{item.title}</span>}
                {item.badge && item.badge > 0 && isExpanded && (
                  <Badge
                    variant="secondary"
                    className="ml-auto flex h-5 w-5 items-center justify-center bg-red-500 p-0 text-xs text-white"
                  >
                    {item.badge}
                  </Badge>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        {/* État de connexion */}
        {isExpanded && (
          <div className="mt-6 px-2">
            <div className="rounded-lg border border-green-200 bg-green-50 p-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
                <span className="text-xs font-medium text-green-700">
                  Messagerie connectée
                </span>
              </div>
              <p className="mt-1 text-xs text-green-600">
                Chat en temps réel activé
              </p>
            </div>
          </div>
        )}
      </SidebarContent>

      {/* Footer avec paramètres */}
      <SidebarFooter className="p-2">
        <SidebarMenu className={isExpanded ? 'block' : 'flex items-center'}>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => handleViewChange('settings')}
              isActive={activeView === 'settings'}
              tooltip={!isExpanded ? 'Paramètres' : undefined}
            >
              <Settings className="h-4 w-4 shrink-0" />
              {isExpanded && <span>Paramètres</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {isExpanded && (
          <div className="mt-2 text-center text-xs text-gray-500">
            Messagerie sécurisée
          </div>
        )}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
