'use client'

import { Bot, Hash, MessageCircle, Settings, Users } from 'lucide-react'
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
} from '@/components/ui/sidebar'
import { MessagingNavMain } from './messaging-nav-main'
import { MessagingNavUser } from './messaging-nav-user'

interface MessagingSidebarMainProps
  extends React.ComponentProps<typeof Sidebar> {
  onNavChange?: (activeNav: string) => void
  variant?: 'sidebar' | 'inset' | 'floating'
}

const messagingNavData = [
  {
    title: 'Messages',
    url: '#',
    icon: MessageCircle,
    isActive: true,
    items: [
      {
        title: 'Conversations actives',
        url: '#',
        badge: '3',
      },
      {
        title: 'Non lus',
        url: '#',
        badge: '7',
      },
      {
        title: 'Archivées',
        url: '#',
      },
    ],
  },
  {
    title: 'Contacts',
    url: '#',
    icon: Users,
    items: [
      {
        title: 'En ligne',
        url: '#',
        badge: '12',
      },
      {
        title: 'Équipe',
        url: '#',
      },
      {
        title: 'Favoris',
        url: '#',
      },
    ],
  },
  {
    title: 'Channels',
    url: '#',
    icon: Hash,
    items: [
      {
        title: 'Général',
        url: '#',
        badge: '2',
      },
      {
        title: 'Projet Alpha',
        url: '#',
      },
      {
        title: 'Équipe Dev',
        url: '#',
        badge: '1',
      },
    ],
  },
  {
    title: 'Assistant IA',
    url: '#',
    icon: Bot,
    items: [
      {
        title: 'Chat Assistant',
        url: '#',
      },
      {
        title: 'Résumés Auto',
        url: '#',
      },
      {
        title: 'Traductions',
        url: '#',
      },
    ],
  },
  {
    title: 'Paramètres',
    url: '#',
    icon: Settings,
    items: [
      {
        title: 'Notifications',
        url: '#',
      },
      {
        title: 'Confidentialité',
        url: '#',
      },
      {
        title: 'Apparence',
        url: '#',
      },
    ],
  },
]

const userData = {
  name: 'John Doe',
  email: 'john.doe@coworking.com',
  avatar: '/avatars/admin.png',
}

export function MessagingSidebarMain({
  variant = 'floating',
  onNavChange,
  ...props
}: MessagingSidebarMainProps) {
  return (
    <Sidebar
      className="border-coffee-primary"
      variant={variant}
      collapsible="icon"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div className="cursor-pointer">
                <div className="bg-coffee-primary flex aspect-square size-8 items-center justify-center rounded-lg text-white">
                  <MessageCircle className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">CoWork Chat</span>
                  <span className="text-muted-foreground truncate text-xs">
                    Messagerie collaborative
                  </span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <MessagingNavMain items={messagingNavData} onNavChange={onNavChange} />
      </SidebarContent>

      <SidebarFooter>
        <MessagingNavUser user={userData} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
