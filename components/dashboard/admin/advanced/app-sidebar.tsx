'use client'

import * as React from 'react'

import { NavMain } from '@/components/dashboard/admin/advanced/nav-main'
import { NavUser } from '@/components/dashboard/admin/advanced/nav-user'
import { TeamSwitcher } from '@/components/dashboard/admin/advanced/team-switcher'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/dashboard/admin/advanced/ui/sidebar'

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  variant?: 'sidebar' | 'inset' | 'floating'
  data: {
    user: {
      name: string
      email: string
      avatar?: string
      image?: string
    }
    teams: {
      name: string
      logo: React.ElementType
      plan: string
    }[]
    navMain: {
      title: string
      url: string
      icon?: React.ElementType
      isActive?: boolean
      items?: {
        title: string
        url: string
      }[]
    }[]
    navSecondary?: {
      title: string
      url: string
      icon: React.ElementType
    }[]
  }
}

export function AppSidebar({
  variant = 'floating',
  data,
  ...props
}: AppSidebarProps) {
  return (
    <Sidebar
      className="border-coffee-primary"
      variant={variant}
      collapsible="icon"
      {...props}
    >
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={data.navMain as any} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
