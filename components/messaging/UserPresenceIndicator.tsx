'use client'

import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface UserPresenceIndicatorProps {
  status: 'online' | 'offline' | 'away' | 'busy'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  showTooltip?: boolean
  className?: string
  lastSeen?: string
}

export function UserPresenceIndicator({
  status,
  size = 'sm',
  showTooltip = true,
  className,
  lastSeen
}: UserPresenceIndicatorProps) {
  const sizeClasses = {
    xs: 'h-2 w-2',
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  const statusClasses = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    away: 'bg-yellow-500',
    busy: 'bg-red-500'
  }

  const statusLabels = {
    online: 'En ligne',
    offline: 'Hors ligne',
    away: 'Absent',
    busy: 'Occupé'
  }

  const indicator = (
    <div
      className={cn(
        'rounded-full border-2 border-white',
        sizeClasses[size],
        statusClasses[status],
        status === 'online' && 'animate-pulse',
        className
      )}
    />
  )

  if (!showTooltip) {
    return indicator
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {indicator}
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-center">
          <p className="font-medium">{statusLabels[status]}</p>
          {status === 'offline' && lastSeen && (
            <p className="text-xs text-gray-400">
              Vu pour la dernière fois: {lastSeen}
            </p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}