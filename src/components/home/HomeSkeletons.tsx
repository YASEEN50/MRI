export function SkeletonPulse({ className }: { className?: string }) {
  return <div className={`mpi-skeleton ${className ?? ''}`} aria-hidden />
}

export function HomeCardRowSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex gap-4 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="shrink-0 w-[280px] mpi-card p-5 space-y-4">
          <div className="flex gap-4">
            <SkeletonPulse className="w-14 h-14 rounded-xl" />
            <div className="flex-1 space-y-2">
              <SkeletonPulse className="h-4 w-3/4 rounded-lg" />
              <SkeletonPulse className="h-3 w-1/2 rounded-lg" />
            </div>
          </div>
          <SkeletonPulse className="h-3 w-full rounded-lg" />
          <SkeletonPulse className="h-3 w-2/3 rounded-lg" />
        </div>
      ))}
    </div>
  )
}

export function HomePublicationsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="mpi-card overflow-hidden">
          <SkeletonPulse className="h-36 w-full rounded-none" />
          <div className="p-5 space-y-3">
            <SkeletonPulse className="h-3 w-20 rounded-full" />
            <SkeletonPulse className="h-5 w-full rounded-lg" />
            <SkeletonPulse className="h-4 w-full rounded-lg" />
            <SkeletonPulse className="h-4 w-4/5 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function HomeSpecialtiesSkeleton() {
  return (
    <div className="flex gap-3 overflow-hidden">
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonPulse key={i} className="shrink-0 h-14 w-36 rounded-2xl" />
      ))}
    </div>
  )
}

export function HomeAdsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <SkeletonPulse key={i} className="h-40 rounded-2xl" />
      ))}
    </div>
  )
}
