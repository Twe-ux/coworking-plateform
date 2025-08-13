'use client'

import { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'

interface StatsCardProps {
  title: string
  value: string | number
  change?: {
    value: string
    type: 'increase' | 'decrease' | 'neutral'
  }
  icon: LucideIcon
  className?: string
}

export function StatsCard({
  title,
  value,
  change,
  icon: Icon,
  className = '',
}: StatsCardProps) {
  const changeColors = {
    increase: 'text-green-600 bg-green-100',
    decrease: 'text-red-600 bg-red-100',
    neutral: 'text-gray-600 bg-gray-100',
  }

  return (
    <motion.div
      className={`rounded-lg border border-gray-200 bg-white p-6 ${className}`}
      whileHover={{ y: -2, scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <div
              className={`mt-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${changeColors[change.type]}`}
            >
              {change.value}
            </div>
          )}
        </div>
        <div className="rounded-lg bg-orange-100 p-3">
          <Icon className="h-6 w-6 text-orange-600" />
        </div>
      </div>
    </motion.div>
  )
}
