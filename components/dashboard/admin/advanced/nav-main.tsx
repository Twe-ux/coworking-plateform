'use client'

import { ChevronRight, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/dashboard/admin/advanced/ui/collapsible'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/dashboard/admin/advanced/ui/sidebar'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/dashboard/admin/advanced/ui/tooltip'
import { cn } from '@/lib/utils'

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const pathname = usePathname()
  const { state } = useSidebar()

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Navigation</SidebarGroupLabel>
      <SidebarMenu className="flex flex-col gap-5">
        {items.map((item) => {
          const isItemActive =
            item.url === '/dashboard/admin'
              ? pathname === item.url
              : pathname === item.url || pathname.startsWith(item.url + '/')

          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={item.isActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          tooltip={
                            state === 'collapsed' ? item.title : undefined
                          }
                          isActive={isItemActive}
                          asChild
                          className={cn(
                            'hover:bg-coffee-primary/70 hover:text-coffee-accent transition-colors',
                            isItemActive &&
                              'bg-coffee-primary/20 text-coffee-primary',
                            state === 'collapsed' && 'justify-center px-0'
                          )}
                        >
                          <Link
                            href={item.url}
                            className={cn(
                              'flex w-full items-center gap-2',
                              state === 'collapsed' && 'justify-center'
                            )}
                          >
                            {item.icon && (
                              <item.icon className="shrink-0 stroke-1" />
                            )}
                            <span className="truncate font-light">
                              {item.title}
                            </span>
                            {item.items && state !== 'collapsed' && (
                              <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                    </TooltipTrigger>
                    {state === 'collapsed' && (
                      <TooltipContent
                        side="right"
                        className="ml-2"
                        sideOffset={8}
                      >
                        {item.title}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
                {item.items && (
                  <CollapsibleContent className="group-has-[[data-collapsible=icon]]/sidebar-wrapper:group-data-[state=collapsed]/sidebar:hidden">
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathname === subItem.url}
                            className={cn(
                              'hover:bg-coffee-primary/10 hover:text-coffee-primary transition-colors',
                              pathname === subItem.url &&
                                'bg-coffee-primary/20 text-coffee-primary'
                            )}
                          >
                            <Link href={subItem.url}>
                              <span className="truncate">{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                )}
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
