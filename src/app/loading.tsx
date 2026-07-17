import { SkeletonPulse, HomeCardRowSkeleton } from '@/components/home/HomeSkeletons'

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="h-16 border-b border-white/5 bg-background/80" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 space-y-10 animate-fade-in">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <SkeletonPulse className="h-6 w-48 mx-auto rounded-full" />
          <SkeletonPulse className="h-12 w-full rounded-2xl" />
          <SkeletonPulse className="h-5 w-3/4 mx-auto rounded-lg" />
          <SkeletonPulse className="h-14 w-full rounded-2xl" />
        </div>
        <HomeCardRowSkeleton count={3} />
      </div>
    </div>
  )
}
