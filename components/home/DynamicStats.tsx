'use client'

import { Coffee, Users, MapPin, Star } from 'lucide-react'
import { motion } from 'framer-motion'
import { useSpaces } from '@/hooks/useSpaces'

export default function DynamicStats() {
  const { spaces, isLoading } = useSpaces()

  // Si en cours de chargement, afficher les valeurs par défaut
  const spacesCount = isLoading ? '3' : spaces.length.toString()
  const spacesLabel = isLoading
    ? 'espaces'
    : `espace${spaces.length > 1 ? 's' : ''}`

  const stats = [
    {
      icon: Coffee,
      label: spacesCount,
      value: spacesLabel,
    },
    {
      icon: Users,
      label: '50+',
      value: 'membres',
    },
    {
      icon: MapPin,
      label: 'Strasbourg',
      value: 'centre-ville',
    },
    {
      icon: Star,
      label: '4.8/5',
      value: 'satisfaction',
    },
  ]

  return (
    <>
      {stats.map(({ icon: Icon, label, value }, index) => (
        <motion.div
          key={index}
          className="text-center"
          whileHover={{ scale: 1.1 }}
          transition={{ type: 'spring' as const, stiffness: 300 }}
        >
          <Icon className="text-coffee-accent mx-auto mb-2 h-8 w-8" />
          <div className="text-coffee-primary text-2xl font-bold">{label}</div>
          <div className="text-sm text-gray-600">{value}</div>
        </motion.div>
      ))}
    </>
  )
}
