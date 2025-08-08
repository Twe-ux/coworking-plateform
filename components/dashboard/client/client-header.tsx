'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Bell, Search, Menu, ShoppingBag, Coffee, Wifi, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ThemeToggle } from '@/components/ThemeToggle'
import Link from 'next/link'

export function ClientHeader() {
  const { data: session } = useSession()
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <header 
      className="sticky top-0 z-40 border-b border-[var(--color-client-border)]"
      style={{ backgroundColor: 'var(--color-client-card)' }}
    >
      <div className="flex h-16 items-center gap-4 px-4 md:px-6">
        {/* Mobile menu button */}
        <Button variant="ghost" size="sm" className="lg:hidden">
          <Menu className="h-5 w-5" />
        </Button>

        {/* Logo mobile */}
        <div className="flex items-center gap-2 lg:hidden">
          <Coffee className="h-6 w-6" style={{ color: 'var(--color-coffee-primary)' }} />
          <span className="font-bold" style={{ color: 'var(--color-client-text)' }}>
            Cow or King
          </span>
        </div>

        {/* Search bar */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--color-client-muted)' }} />
            <Input
              placeholder="Rechercher un espace, une commande..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 border-[var(--color-client-border)]"
              style={{ backgroundColor: 'var(--color-client-bg)' }}
            />
          </div>
        </div>

        {/* Status indicators */}
        <div className="hidden md:flex items-center gap-4">
          {/* Cafe status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--color-client-border)]">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium" style={{ color: 'var(--color-client-text)' }}>
              Café ouvert
            </span>
          </div>

          {/* Current occupancy */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ backgroundColor: 'var(--color-coffee-secondary)' }}>
            <Users className="h-4 w-4" style={{ color: 'var(--color-coffee-primary)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--color-client-text)' }}>
              12/24 places
            </span>
          </div>

          {/* WiFi status */}
          <div className="flex items-center gap-1 px-2 py-1 rounded" style={{ backgroundColor: 'var(--color-coffee-light)' }}>
            <Wifi className="h-4 w-4 text-green-600" />
            <span className="text-xs font-medium text-green-700">WiFi</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <Badge 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs"
                  style={{ backgroundColor: 'var(--color-coffee-accent)' }}
                >
                  2
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Coffee className="mr-2 h-4 w-4" />
                <div>
                  <p className="text-sm font-medium">Votre café est prêt !</p>
                  <p className="text-xs text-muted-foreground">Cappuccino - Comptoir</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell className="mr-2 h-4 w-4" />
                <div>
                  <p className="text-sm font-medium">Réservation confirmée</p>
                  <p className="text-xs text-muted-foreground">Espace Focus - Demain 14h</p>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Cart/Orders */}
          <Button variant="ghost" size="sm" className="relative" asChild>
            <Link href="/dashboard/client/commandes">
              <ShoppingBag className="h-5 w-5" />
              <Badge 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs"
                style={{ backgroundColor: 'var(--color-coffee-primary)' }}
              >
                1
              </Badge>
            </Link>
          </Button>

          {/* Theme toggle */}
          <ThemeToggle />

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={session?.user?.image || undefined} alt="Avatar" />
                  <AvatarFallback style={{ backgroundColor: 'var(--color-coffee-light)' }}>
                    {session?.user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div>
                  <p className="text-sm font-medium">{session?.user?.name || 'Utilisateur'}</p>
                  <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/client/profil">Mon profil</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/client/parametres">Paramètres</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/api/auth/signout">Se déconnecter</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}