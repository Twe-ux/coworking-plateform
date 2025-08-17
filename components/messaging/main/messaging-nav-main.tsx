'use client'

import {
  ChevronRight,
  Hash,
  MessageCircle,
  Settings,
  Users,
  Bot,
} from 'lucide-react'
import { useState } from 'react'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar'

interface MessagingNavItem {
  title: string
  url: string
  icon?: React.ElementType
  isActive?: boolean
  items?: {
    title: string
    url: string
    badge?: string | number
  }[]
}

interface MessagingNavMainProps {
  items: MessagingNavItem[]
  onNavChange?: (activeNav: string) => void
}

export function MessagingNavMain({
  items,
  onNavChange,
}: MessagingNavMainProps) {
  const [activeItem, setActiveItem] = useState(items[0]?.title || 'Messages')

  const handleNavClick = (title: string) => {
    setActiveItem(title)
    onNavChange?.(title)
  }

  return (
    <SidebarMenu>
      {items.map((item) => (
        <Collapsible
          key={item.title}
          asChild
          defaultOpen={item.isActive}
          className="group/collapsible"
        >
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton
                tooltip={item.title}
                className={`${
                  activeItem === item.title
                    ? 'bg-coffee-primary/10 text-coffee-primary border-coffee-primary/20'
                    : 'hover:bg-coffee-primary/5'
                }`}
                onClick={() => handleNavClick(item.title)}
              >
                {item.icon && <item.icon />}
                <span>{item.title}</span>
                {item.items && (
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                )}
              </SidebarMenuButton>
            </CollapsibleTrigger>
            {item.items && (
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton asChild>
                        <a href={subItem.url}>
                          <span>{subItem.title}</span>
                          {subItem.badge && (
                            <span className="bg-coffee-primary ml-auto rounded-full px-2 py-0.5 text-xs text-white">
                              {subItem.badge}
                            </span>
                          )}
                        </a>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            )}
          </SidebarMenuItem>
        </Collapsible>
      ))}
    </SidebarMenu>
  )
}
