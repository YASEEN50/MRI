'use client'

import { cn } from '@/lib/cn'

interface HomeScrollRowProps {
  children: React.ReactNode
  className?: string
  gridClassName?: string
}

export default function HomeScrollRow({
  children,
  className,
  gridClassName = 'lg:grid-cols-3',
}: HomeScrollRowProps) {
  return (
    <div className="relative">
      <div
        className={cn(
          'flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1 [scrollbar-width:thin]',
          'lg:grid lg:overflow-visible lg:snap-none',
          gridClassName,
          className,
        )}
      >
        {children}
      </div>
      <div
        className="pointer-events-none absolute inset-y-0 start-0 w-8 bg-gradient-to-r from-background to-transparent lg:hidden"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 end-0 w-8 bg-gradient-to-l from-background to-transparent lg:hidden"
        aria-hidden
      />
    </div>
  )
}
