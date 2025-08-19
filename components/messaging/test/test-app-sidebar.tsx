'use client'

import * as React from 'react'
import { MessageCircle, Users, Settings, Home, Hash, Phone, Video, Search, Bell } from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useSession } from 'next-auth/react'

interface TestAppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  onViewChange?: (view: 'messages' | 'contacts' | 'settings') => void
}

export function TestAppSidebar({ onViewChange, ...props }: TestAppSidebarProps) {
  const { data: session } = useSession()
  const [activeView, setActiveView] = React.useState<'messages' | 'contacts' | 'settings'>('messages')

  const handleViewChange = (view: 'messages' | 'contacts' | 'settings') => {
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
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const mainMenuItems = [
    {
      title: 'Messages',
      url: '#',
      icon: MessageCircle,
      isActive: activeView === 'messages',
      onClick: () => handleViewChange('messages'),
      badge: 3 // Exemple de badge pour messages non lus
    },
    {
      title: 'Contacts',
      url: '#',
      icon: Users,
      isActive: activeView === 'contacts',
      onClick: () => handleViewChange('contacts')
    },
    {
      title: 'Channels',
      url: '#',
      icon: Hash,
      isActive: false,
      onClick: () => handleViewChange('messages')
    }
  ]

  const secondaryItems = [
    {
      title: 'Appels',
      url: '#',
      icon: Phone,
      onClick: () => {}
    },
    {
      title: 'Vidéo',
      url: '#',
      icon: Video,
      onClick: () => {}
    },
    {
      title: 'Notifications',
      url: '#',
      icon: Bell,
      onClick: () => {},
      badge: 1
    }
  ]

  return (
    <Sidebar variant="floating" {...props}>
      {/* Header avec profil utilisateur */}
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={session?.user?.image || undefined} alt={getUserDisplayName()} />
            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">{getUserDisplayName()}</div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              En ligne
            </div>
          </div>
        </div>
        
        {/* Barre de recherche rapide */}
        <div className="mt-4">
          <Button variant="ghost" size="sm" className="w-full justify-start text-gray-500">
            <Search className="h-4 w-4 mr-2" />
            Rechercher...
          </Button>
        </div>
      </SidebarHeader>

      {/* Contenu principal */}
      <SidebarContent className="p-2">
        {/* Menu principal */}
        <SidebarMenu>
          <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Navigation
          </div>
          {mainMenuItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton 
                onClick={item.onClick}
                isActive={item.isActive}
                className="relative"
              >
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
                {item.badge && item.badge > 0 && (
                  <Badge 
                    variant="secondary" 
                    className="ml-auto h-5 w-5 p-0 flex items-center justify-center text-xs bg-blue-500 text-white"
                  >
                    {item.badge}
                  </Badge>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        {/* Menu secondaire */}
        <SidebarMenu className="mt-6">
          <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Outils
          </div>
          {secondaryItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton 
                onClick={item.onClick}
                className="relative"
              >
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
                {item.badge && item.badge > 0 && (
                  <Badge 
                    variant="secondary" 
                    className="ml-auto h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500 text-white"
                  >
                    {item.badge}
                  </Badge>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        {/* État de connexion */}
        <div className="mt-6 px-2">
          <div className="rounded-lg bg-green-50 p-3 border border-green-200">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-green-700">
                Messagerie connectée
              </span>
            </div>
            <p className="text-xs text-green-600 mt-1">
              Chat en temps réel activé
            </p>
          </div>
        </div>
      </SidebarContent>

      {/* Footer avec paramètres */}
      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={() => handleViewChange('settings')}
              isActive={activeView === 'settings'}
            >
              <Settings className="h-4 w-4" />
              <span>Paramètres</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        
        <div className="text-xs text-gray-500 text-center mt-2">
          Messagerie sécurisée
        </div>
      </SidebarFooter>
      
      <SidebarRail />
    </Sidebar>
  )
}