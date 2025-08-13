'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ClientCardProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
  gradient?: string
  icon?: LucideIcon
  badge?: string
  onClick?: () => void
}

export function ClientCard({
  title,
  description,
  children,
  className,
  gradient,
  icon: Icon,
  badge,
  onClick,
}: ClientCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn('transition-all duration-200', onClick && 'cursor-pointer')}
      onClick={onClick}
    >
      <Card
        className={cn(
          'relative overflow-hidden border-orange-200/50 bg-white/70 shadow-lg backdrop-blur-sm hover:shadow-xl',
          gradient && `bg-gradient-to-br ${gradient}`,
          className
        )}
      >
        {badge && (
          <div className="absolute top-3 right-3">
            <Badge variant="secondary" className="bg-white/80 text-xs">
              {badge}
            </Badge>
          </div>
        )}

        <CardHeader className="pb-4">
          <div className="flex items-center space-x-3">
            {Icon && (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-orange-400 to-amber-400">
                <Icon className="h-5 w-5 text-white" />
              </div>
            )}
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                {title}
              </CardTitle>
              {description && (
                <CardDescription className="text-gray-600">
                  {description}
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>{children}</CardContent>

        {/* Floating decoration */}
        <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-white/10 blur-xl" />
        <div className="absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-white/20 blur-lg" />
      </Card>
    </motion.div>
  )
}

interface StatsCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon?: LucideIcon
  gradient?: string
  className?: string
}

export function StatsCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  gradient = 'from-blue-50 to-cyan-50',
  className,
}: StatsCardProps) {
  const changeColors = {
    positive: 'text-green-600 bg-green-100',
    negative: 'text-red-600 bg-red-100',
    neutral: 'text-gray-600 bg-gray-100',
  }

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.03 }}
      transition={{ duration: 0.2 }}
      className={cn(
        `relative overflow-hidden bg-gradient-to-br ${gradient} rounded-2xl border border-white/50 p-6 shadow-lg`,
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="mb-1 text-sm font-medium text-gray-600">{title}</p>
          <div className="mb-2 text-3xl font-bold text-gray-900">{value}</div>
          {change && (
            <Badge className={cn('text-xs', changeColors[changeType])}>
              {change}
            </Badge>
          )}
        </div>
        {Icon && (
          <div className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 p-3 shadow-lg">
            <Icon className="h-6 w-6 text-white" />
          </div>
        )}
      </div>

      {/* Floating Elements */}
      <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-white/10 blur-xl" />
      <div className="absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-white/20 blur-lg" />
    </motion.div>
  )
}

interface QuickActionCardProps {
  title: string
  description: string
  icon: LucideIcon
  gradient: string
  href?: string
  onClick?: () => void
  className?: string
}

export function QuickActionCard({
  title,
  description,
  icon: Icon,
  gradient,
  href,
  onClick,
  className,
}: QuickActionCardProps) {
  const CardComponent = motion.div

  return (
    <CardComponent
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className={cn(
        `relative bg-gradient-to-br ${gradient} group cursor-pointer overflow-hidden rounded-2xl p-6 text-white shadow-lg`,
        className
      )}
      onClick={onClick}
    >
      <div className="relative z-10">
        <Icon className="mb-4 h-8 w-8 transition-transform duration-300 group-hover:scale-110" />
        <h3 className="mb-1 font-semibold">{title}</h3>
        <p className="text-sm opacity-90">{description}</p>
      </div>

      {/* Hover Effect */}
      <div className="absolute inset-0 translate-y-full bg-white/10 transition-transform duration-500 group-hover:translate-y-0" />

      {/* Floating Elements */}
      <div className="absolute -top-4 -right-4 h-20 w-20 rounded-full bg-white/20 blur-xl" />
    </CardComponent>
  )
}
