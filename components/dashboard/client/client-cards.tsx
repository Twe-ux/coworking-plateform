'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'
import { cardVariants, statsVariants, quickActionVariants, badgeVariants } from '@/lib/animations'

interface ClientCardProps {
  title: string
  description?: string
  children: ReactNode
  icon?: LucideIcon
  badge?: string
  className?: string
  variant?: 'default' | 'warm' | 'accent'
}

export function ClientCard({ 
  title, 
  description, 
  children, 
  icon: Icon, 
  badge,
  className,
  variant = 'default'
}: ClientCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'warm':
        return {
          backgroundColor: 'var(--color-coffee-secondary)',
          borderColor: 'var(--color-coffee-light)',
        }
      case 'accent':
        return {
          backgroundColor: 'var(--color-cream-light)',
          borderColor: 'var(--color-coffee-accent)',
        }
      default:
        return {
          backgroundColor: 'var(--color-client-card)',
          borderColor: 'var(--color-client-border)',
        }
    }
  }

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
    >
      <Card 
        className={cn(
          'overflow-hidden',
          className
        )}
        style={getVariantStyles()}
      >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {Icon && (
              <Icon 
                className="h-5 w-5" 
                style={{ color: variant === 'accent' ? 'var(--color-coffee-accent)' : 'var(--color-coffee-primary)' }} 
              />
            )}
            <CardTitle 
              className="text-base font-semibold"
              style={{ color: 'var(--color-client-text)' }}
            >
              {title}
            </CardTitle>
          </div>
          {badge && (
            <motion.div
              variants={badgeVariants}
              initial="hidden"
              animate="visible"
            >
              <Badge 
                variant="secondary"
                style={{ 
                  backgroundColor: 'var(--color-coffee-primary)',
                  color: 'white'
                }}
              >
                {badge}
              </Badge>
            </motion.div>
          )}
        </div>
        {description && (
          <CardDescription style={{ color: 'var(--color-client-muted)' }}>
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
    </motion.div>
  )
}

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: {
    value: string
    isPositive: boolean
  }
  className?: string
}

export function StatsCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend,
  className 
}: StatsCardProps) {
  return (
    <motion.div
      variants={statsVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.05 }}
    >
      <ClientCard
        title={title}
        description={description}
        icon={Icon}
        className={className}
      >
        <div className="space-y-2">
          <motion.div 
            className="text-2xl font-bold" 
            style={{ color: 'var(--color-client-text)' }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          >
            {value}
          </motion.div>
        {trend && (
          <div className="flex items-center gap-1">
            <span 
              className={cn(
                'text-sm font-medium',
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              )}
            >
              {trend.isPositive ? '+' : ''}{trend.value}
            </span>
            <span className="text-sm" style={{ color: 'var(--color-client-muted)' }}>
              vs le mois dernier
            </span>
          </div>
        )}
      </div>
    </ClientCard>
    </motion.div>
  )
}

interface QuickActionCardProps {
  title: string
  description: string
  icon: LucideIcon
  onClick?: () => void
  href?: string
  disabled?: boolean
  className?: string
}

export function QuickActionCard({ 
  title, 
  description, 
  icon: Icon, 
  onClick, 
  href,
  disabled = false,
  className 
}: QuickActionCardProps) {
  const CardComponent = href ? 'a' : 'button'
  
  return (
    <motion.div
      variants={quickActionVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      whileTap="tap"
    >
      <CardComponent
        href={href}
        onClick={onClick}
        disabled={disabled}
        className={cn(
          'block w-full text-left p-4 rounded-lg border focus:outline-none focus:ring-2',
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
          className
        )}
        style={{
          backgroundColor: 'var(--color-client-card)',
          borderColor: 'var(--color-client-border)',
          focusRingColor: 'var(--color-coffee-primary)',
        }}
      >
      <div className="flex items-center gap-3">
        <div 
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ backgroundColor: 'var(--color-coffee-secondary)' }}
        >
          <Icon className="h-5 w-5" style={{ color: 'var(--color-coffee-primary)' }} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold" style={{ color: 'var(--color-client-text)' }}>
            {title}
          </h3>
          <p className="text-sm" style={{ color: 'var(--color-client-muted)' }}>
            {description}
          </p>
        </div>
      </div>
    </CardComponent>
    </motion.div>
  )
}