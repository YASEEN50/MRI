import { cn } from '@/lib/cn'

interface HomeSectionProps {
  children: React.ReactNode
  className?: string
  id?: string
  bordered?: boolean
}

export default function HomeSection({
  children,
  className,
  id,
  bordered = false,
}: HomeSectionProps) {
  return (
    <section
      id={id}
      className={cn(
        'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full animate-fade-in',
        bordered && 'border-t border-white/5',
        className,
      )}
    >
      {children}
    </section>
  )
}
