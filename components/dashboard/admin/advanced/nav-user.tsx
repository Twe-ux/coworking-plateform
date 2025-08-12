'use client'

import {
  CreditCard,
  MoreHorizontal,
  LogOut,
  Bell,
  User,
  Settings,
  Coffee,
  ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/dashboard/admin/advanced/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/dashboard/admin/advanced/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/dashboard/admin/advanced/ui/sidebar'

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar?: string
  }
}) {
  const { isMobile, state } = useSidebar()

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  const initials = user.name
    .split(' ')
    .map((name) => name[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-coffee-primary/10 hover:bg-coffee-primary/10"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage
                  src={user.avatar || '/avatars/admin.png'}
                  alt={user.name}
                />
                <AvatarFallback className="bg-coffee-primary rounded-lg text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight group-has-[[data-collapsible=icon]]/sidebar-wrapper:group-data-[state=collapsed]/sidebar:hidden">
                <span className="truncate font-medium">{user.name}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {user.email}
                </span>
              </div>
              <MoreHorizontal className="ml-auto size-4 group-has-[[data-collapsible=icon]]/sidebar-wrapper:group-data-[state=collapsed]/sidebar:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage
                    src={user.avatar || '/avatars/admin.png'}
                    alt={user.name}
                  />
                  <AvatarFallback className="bg-coffee-primary rounded-lg text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild className="hover:bg-coffee-primary/10">
                <Link href="/dashboard/admin/profile">
                  <User className="mr-2 h-4 w-4" />
                  Mon Profil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="hover:bg-coffee-primary/10">
                <Link href="/dashboard/admin/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Paramètres
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="hover:bg-coffee-primary/10">
                <Link href="/dashboard/admin/notifications">
                  <Bell className="mr-2 h-4 w-4" />
                  Notifications
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="hover:bg-coffee-primary/10">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour au site
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-red-600 hover:bg-red-50"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Se déconnecter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
