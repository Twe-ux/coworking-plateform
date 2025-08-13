'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Coffee,
  Calendar,
  MapPin,
  User,
  Clock,
  History,
  ShoppingBag,
  BarChart3,
  Settings,
  CreditCard,
  Heart,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  sidebarVariants,
  navItemVariants,
  containerVariants,
} from '@/lib/animations'

interface SidebarItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  description?: string
}

const clientSidebarItems: SidebarItem[] = [
  {
    href: '/dashboard/client',
    label: 'Mon espace café',
    icon: Coffee,
    description: "Vue d'ensemble de votre activité",
  },
  {
    href: '/dashboard/client/reservations',
    label: 'Mes réservations',
    icon: Calendar,
    description: 'Gérer vos réservations',
  },
  {
    href: '/dashboard/client/espaces',
    label: 'Découvrir les espaces',
    icon: MapPin,
    description: 'Explorer nos espaces de travail',
  },
  {
    href: '/dashboard/client/historique',
    label: 'Historique',
    icon: History,
    description: 'Vos réservations passées',
  },
  {
    href: '/dashboard/client/commandes',
    label: 'Mes commandes',
    icon: ShoppingBag,
    description: 'Commandes café & snacks',
    badge: 'Nouveau',
  },
  {
    href: '/dashboard/client/stats',
    label: 'Mes statistiques',
    icon: BarChart3,
    description: 'Votre utilisation des espaces',
  },
  {
    href: '/dashboard/client/profil',
    label: 'Mon profil',
    icon: User,
    description: 'Informations personnelles',
  },
  {
    href: '/dashboard/client/paiements',
    label: 'Paiements',
    icon: CreditCard,
    description: 'Moyens de paiement',
  },
  {
    href: '/dashboard/client/favoris',
    label: 'Mes favoris',
    icon: Heart,
    description: 'Espaces favoris',
  },
  {
    href: '/dashboard/client/parametres',
    label: 'Paramètres',
    icon: Settings,
    description: 'Préférences et notifications',
  },
]

export function ClientSidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()

  if (!session?.user) {
    return null
  }

  return (
    <motion.div
      className="flex h-screen flex-col"
      variants={sidebarVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Logo et branding café */}
      <div className="border-b border-[var(--color-client-border)] p-6">
        <div className="mb-4 flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ backgroundColor: 'var(--color-coffee-primary)' }}
          >
            <Coffee className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1
              className="text-lg font-bold"
              style={{ color: 'var(--color-client-text)' }}
            >
              Cow or King
            </h1>
            <p
              className="text-sm"
              style={{ color: 'var(--color-client-muted)' }}
            >
              Café Coworking
            </p>
          </div>
        </div>

        {/* Profil utilisateur */}
        <div className="flex items-center gap-3 rounded-lg border border-[var(--color-client-border)] p-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={session.user.image || undefined} alt="Avatar" />
            <AvatarFallback
              style={{ backgroundColor: 'var(--color-coffee-light)' }}
            >
              {session.user.name
                ?.split(' ')
                .map((n) => n[0])
                .join('') || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p
              className="truncate text-sm font-medium"
              style={{ color: 'var(--color-client-text)' }}
            >
              {session.user.name || 'Utilisateur'}
            </p>
            <p
              className="truncate text-xs"
              style={{ color: 'var(--color-client-muted)' }}
            >
              Membre café
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <motion.div
          className="space-y-1"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {clientSidebarItems.map((item, index) => {
            const Icon = item.icon
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/')

            return (
              <motion.div
                key={item.href}
                variants={navItemVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  href={item.href}
                  className={cn(
                    'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm',
                    isActive
                      ? 'border border-[var(--color-coffee-primary)]/20 shadow-sm'
                      : 'hover:bg-[var(--color-client-card)]/80'
                  )}
                  style={{
                    backgroundColor: isActive
                      ? 'var(--color-coffee-secondary)'
                      : 'transparent',
                    color: isActive
                      ? 'var(--color-coffee-primary)'
                      : 'var(--color-client-text)',
                  }}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5 transition-colors',
                      isActive
                        ? 'text-[var(--color-coffee-primary)]'
                        : 'text-[var(--color-client-muted)]'
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{item.label}</span>
                      {item.badge && (
                        <Badge
                          variant="secondary"
                          className="px-2 py-0 text-xs"
                          style={{
                            backgroundColor: 'var(--color-coffee-accent)',
                            color: 'white',
                          }}
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                    <p
                      className="mt-0.5 truncate text-xs"
                      style={{ color: 'var(--color-client-muted)' }}
                    >
                      {item.description}
                    </p>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </motion.div>
      </nav>

      {/* Footer avec info café */}
      <div className="border-t border-[var(--color-client-border)] p-4">
        <div
          className="rounded-lg p-3 text-center"
          style={{ backgroundColor: 'var(--color-coffee-secondary)' }}
        >
          <Clock
            className="mx-auto mb-2 h-5 w-5"
            style={{ color: 'var(--color-coffee-primary)' }}
          />
          <p
            className="text-xs font-medium"
            style={{ color: 'var(--color-client-text)' }}
          >
            Ouvert aujourd&apos;hui
          </p>
          <p className="text-xs" style={{ color: 'var(--color-client-muted)' }}>
            08h00 - 20h00
          </p>
        </div>
      </div>
    </motion.div>
  )
}
