import { cn } from '@/lib/utils'

function Skeleton({
  className,
  variant = 'default',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: 'default' | 'card' | 'text' | 'circle' | 'gradient'
}) {
  const baseClasses =
    'rounded-md bg-gradient-to-r from-orange-100/60 via-amber-50/80 to-orange-100/60 bg-[length:200%_100%]'

  const variants = {
    default: 'animate-pulse',
    card: 'animate-pulse rounded-xl',
    text: 'animate-pulse h-4 rounded-sm',
    circle: 'animate-pulse rounded-full',
    gradient:
      'animate-pulse bg-gradient-to-r from-orange-100/40 via-white/60 to-orange-100/40',
  }

  return (
    <div className={cn(baseClasses, variants[variant], className)} {...props} />
  )
}

// Skeleton components for specific dashboard elements
function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-orange-200/50 bg-white/60 p-6 backdrop-blur-sm',
        className
      )}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton variant="circle" className="h-12 w-12" />
          <Skeleton variant="text" className="h-6 w-16" />
        </div>
        <div className="space-y-2">
          <Skeleton variant="text" className="h-8 w-20" />
          <Skeleton variant="text" className="h-4 w-32" />
        </div>
      </div>
    </div>
  )
}

function SkeletonStats({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4',
        className
      )}
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

function SkeletonBooking({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-orange-200/50 bg-white/60 p-4 backdrop-blur-sm',
        className
      )}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton variant="text" className="h-5 w-20" />
          <Skeleton variant="text" className="h-4 w-16" />
        </div>
        <Skeleton variant="text" className="h-6 w-40" />
        <div className="flex items-center gap-2">
          <Skeleton variant="circle" className="h-3 w-3" />
          <Skeleton variant="text" className="h-4 w-32" />
        </div>
      </div>
    </div>
  )
}

export { Skeleton, SkeletonCard, SkeletonStats, SkeletonBooking }
