'use client'

import { useMemberStats } from '@/hooks/useMemberStats'
import { useSpaces } from '@/hooks/useSpaces'
import { motion } from 'framer-motion'
import { Coffee, MapPin, Star, Users } from 'lucide-react'
import Link from 'next/link'

export default function DynamicStats() {
  const { spaces, isLoading } = useSpaces()
  const { stats: memberStats, loading: memberStatsLoading } = useMemberStats()

  // Si en cours de chargement, afficher les valeurs par défaut
  const spacesCount = isLoading ? '3' : spaces.length.toString()
  const spacesLabel = isLoading
    ? 'espaces'
    : `espace${spaces.length > 1 ? 's' : ''}`

  // Données membres dynamiques depuis la base de données
  const membersCount = memberStatsLoading
    ? '50+'
    : memberStats?.displayText || '50+'

  const stats = [
    {
      icon: Coffee,
      label: spacesCount,
      value: spacesLabel,
      link: '#espaces',
    },
    {
      icon: Users,
      label: membersCount,
      value: 'membres',
      link: '#membres',
    },
    {
      icon: MapPin,
      label: 'Strasbourg',
      value: 'centre-ville',
      link: '/location',
    },
    {
      icon: Star,
      label: '4.8/5',
      value: 'satisfaction',
      link: '#satisfaction',
    },
  ]

  return (
    <>
      {stats.map(({ icon: Icon, label, value, link }, index) => (
        <Link key={index} href={link}>
          <motion.div
            className="text-center"
            whileHover={{ scale: 1.1 }}
            transition={{ type: 'spring' as const, stiffness: 300 }}
          >
            <Icon className="text-coffee-accent mx-auto mb-2 h-8 w-8" />
            <div className="text-coffee-primary text-2xl font-bold">
              {label}
            </div>
            <div className="text-sm text-gray-600">{value}</div>
          </motion.div>
        </Link>
      ))}
    </>
  )
}
