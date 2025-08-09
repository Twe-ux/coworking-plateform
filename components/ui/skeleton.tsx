import { cn } from "@/lib/utils"

function Skeleton({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "card" | "text" | "circle" | "gradient"
}) {
  const baseClasses = "rounded-md bg-gradient-to-r from-orange-100/60 via-amber-50/80 to-orange-100/60 bg-[length:200%_100%]"
  
  const variants = {
    default: "animate-pulse",
    card: "animate-pulse rounded-xl",
    text: "animate-pulse h-4 rounded-sm",
    circle: "animate-pulse rounded-full",
    gradient: "animate-pulse bg-gradient-to-r from-orange-100/40 via-white/60 to-orange-100/40"
  }

  return (
    <div
      className={cn(
        baseClasses,
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

// Skeleton components for specific dashboard elements
function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl p-6 bg-white/60 backdrop-blur-sm border border-orange-200/50", className)}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton variant="circle" className="h-12 w-12" />
          <Skeleton variant="text" className="w-16 h-6" />
        </div>
        <div className="space-y-2">
          <Skeleton variant="text" className="w-20 h-8" />
          <Skeleton variant="text" className="w-32 h-4" />
        </div>
      </div>
    </div>
  )
}

function SkeletonStats({ className }: { className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", className)}>
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

function SkeletonBooking({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-xl p-4 bg-white/60 backdrop-blur-sm border border-orange-200/50", className)}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton variant="text" className="w-20 h-5" />
          <Skeleton variant="text" className="w-16 h-4" />
        </div>
        <Skeleton variant="text" className="w-40 h-6" />
        <div className="flex items-center gap-2">
          <Skeleton variant="circle" className="w-3 h-3" />
          <Skeleton variant="text" className="w-32 h-4" />
        </div>
      </div>
    </div>
  )
}

export { Skeleton, SkeletonCard, SkeletonStats, SkeletonBooking }