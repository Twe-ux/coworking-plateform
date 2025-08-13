'use client'

import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'

interface DashboardCardProps {
  title: string
  description?: string
  children?: ReactNode
  className?: string
  icon?: LucideIcon
  variant?: 'default' | 'primary' | 'outline'
}

export function DashboardCard({
  title,
  description,
  children,
  className = '',
  icon: Icon,
  variant = 'default',
}: DashboardCardProps) {
  const variants = {
    default: 'bg-white border border-gray-200',
    primary: 'bg-orange-50 border border-orange-200',
    outline: 'bg-transparent border border-gray-300',
  }

  return (
    <motion.div
      className={`rounded-lg p-6 ${variants[variant]} ${className}`}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-start space-x-3">
        {Icon && (
          <div
            className={`flex-shrink-0 rounded-lg p-2 ${
              variant === 'primary'
                ? 'bg-orange-100 text-orange-600'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {description && (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          )}
          {children && <div className="mt-4">{children}</div>}
        </div>
      </div>
    </motion.div>
  )
}
