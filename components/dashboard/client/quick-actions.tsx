'use client'

import { Calendar, Coffee, Clock, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { motion } from 'framer-motion'

const actions = [
  {
    title: 'Nouvelle réservation',
    description: 'Réservez un espace de travail',
    icon: Calendar,
    href: '/reservation',
    color: 'bg-blue-500 hover:bg-blue-600',
    textColor: 'text-white',
  },
  {
    title: 'Mes réservations',
    description: 'Gérer vos réservations',
    icon: Clock,
    href: '/dashboard/client/bookings',
    color: 'bg-orange-500 hover:bg-orange-600',
    textColor: 'text-white',
  },
  {
    title: 'Commande café',
    description: 'Commander à emporter',
    icon: Coffee,
    href: '/dashboard/client/orders',
    color: 'bg-amber-500 hover:bg-amber-600',
    textColor: 'text-white',
  },
  {
    title: 'Explorer espaces',
    description: 'Voir tous les espaces',
    icon: MapPin,
    href: '/spaces',
    color: 'bg-green-500 hover:bg-green-600',
    textColor: 'text-white',
  },
]

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {actions.map((action, index) => (
        <motion.div
          key={action.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Link href={action.href}>
            <Button
              className={`flex h-24 w-full flex-col items-center justify-center space-y-2 ${action.color} ${action.textColor}`}
              variant="default"
            >
              <action.icon className="h-6 w-6" />
              <div className="text-center">
                <div className="text-sm font-medium">{action.title}</div>
                <div className="text-xs opacity-90">{action.description}</div>
              </div>
            </Button>
          </Link>
        </motion.div>
      ))}
    </div>
  )
}
