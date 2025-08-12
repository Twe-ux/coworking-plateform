'use client'

import { ChevronsUpDown, Shield, User, Users } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/dashboard/admin/advanced/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/dashboard/admin/advanced/ui/sidebar'
import { useTeam, type Team } from '@/contexts/team-context'
import { cn } from '@/lib/utils'

export const AVAILABLE_ROLES: Team[] = [
  {
    name: 'Cow-or-king Café',
    logo: Shield,
    plan: 'Administrateur',
    value: 'admin',
    description: 'Accès complet à tous les modules',
    route: '/dashboard/admin',
  },
  {
    name: 'Cow-or-king Café',
    logo: Users,
    plan: 'Manager',
    value: 'manager',
    description: 'Gestion des équipes et opérations',
    route: '/dashboard/manager',
  },
  {
    name: 'Cow-or-king Café',
    logo: User,
    plan: 'Staff',
    value: 'staff',
    description: 'Opérations quotidiennes',
    route: '/dashboard/staff',
  },
]

export function TeamSwitcher() {
  const { data: session } = useSession()
  const { isMobile, state } = useSidebar()
  const router = useRouter()
  const { selectedTeam, setSelectedTeam, availableTeams } = useTeam()
  const userRole = session?.user?.role

  const handleRoleSwitch = React.useCallback(
    (team: Team) => {
      if (userRole !== 'admin') return // Only admin can switch roles

      setSelectedTeam(team)
      // Navigate to the role-specific dashboard
      router.push(team.route)
    },
    [userRole, router, setSelectedTeam]
  )

  // Safety check - if no selected team, don't render
  if (!selectedTeam) {
    console.log('TeamSwitcher: No selected team')
    return null
  }

  console.log(
    'TeamSwitcher: selectedTeam',
    selectedTeam,
    'availableTeams',
    availableTeams,
    'userRole',
    userRole
  )

  // For non-admin users, show read-only version
  if (userRole !== 'admin') {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            className={cn(
              'cursor-default',
              state === 'collapsed' && 'justify-center px-0'
            )}
          >
            <div
              className={cn(
                'flex w-full items-center gap-2',
                state === 'collapsed' && 'justify-center'
              )}
            >
              <div className="bg-coffee-primary flex aspect-square size-8 items-center justify-center rounded-lg text-white">
                <selectedTeam.logo className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {selectedTeam.name}
                </span>
                <span className="text-muted-foreground truncate text-xs">
                  {selectedTeam.plan}
                </span>
              </div>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              className={cn(
                'data-[state=open]:bg-coffee-primary/10 hover:bg-coffee-primary/10',
                state === 'collapsed' && 'justify-center px-0'
              )}
            >
              <div
                className={cn(
                  'flex w-full items-center gap-2',
                  state === 'collapsed' && 'justify-center'
                )}
              >
                <div
                  className={`bg-coffee-primary flex aspect-square size-8 items-center justify-center rounded-lg text-white ${state === 'collapsed' && 'ml-[10px]'}`}
                >
                  <selectedTeam.logo className="size-6" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {selectedTeam.name}
                  </span>
                  <span className="text-muted-foreground truncate text-xs">
                    {selectedTeam.plan}
                  </span>
                </div>
                {state !== 'collapsed' && (
                  <ChevronsUpDown className="ml-auto size-4" />
                )}
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuPortal>
            <DropdownMenuContent
              className="min-w-64 rounded-lg border shadow-lg"
              align="start"
              side="right"
              style={{
                top: 80,
                left: 16,
                zIndex: 99999,
                backgroundColor: 'white',
                border: '1px solid #1f4735',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                position: 'fixed',
              }}
            >
              <DropdownMenuLabel className="text-muted-foreground text-xs">
                {userRole === 'admin' ? 'Changer de rôle' : 'Votre rôle'}
              </DropdownMenuLabel>
              {availableTeams.map((team, index) => (
                <DropdownMenuItem
                  key={team.value}
                  onClick={() => handleRoleSwitch(team)}
                  className="hover:bg-coffee-primary/10 gap-2 p-2"
                  disabled={userRole !== 'admin' && team.value !== userRole}
                >
                  <div className="bg-coffee-primary flex size-6 items-center justify-center rounded-sm border text-white">
                    <team.logo className="size-4 shrink-0" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{team.name}</span>
                    <span className="text-muted-foreground text-xs">
                      {team.plan}
                    </span>
                    {userRole === 'admin' && (
                      <span className="text-muted-foreground/70 text-xs">
                        {team.description}
                      </span>
                    )}
                  </div>
                  {team.value === selectedTeam.value && (
                    <div className="bg-coffee-primary ml-auto size-2 rounded-full" />
                  )}
                  {userRole === 'admin' && (
                    <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenuPortal>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
