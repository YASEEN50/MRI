import Link from 'next/link'

interface HomeSectionHeaderProps {
  title: string
  subtitle?: string
  href?: string
  linkLabel?: string
}

export default function HomeSectionHeader({
  title,
  subtitle,
  href,
  linkLabel,
}: HomeSectionHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white">{title}</h2>
        {subtitle && <p className="text-slate-400 text-sm mt-1">{subtitle}</p>}
      </div>
      {href && linkLabel && (
        <Link
          href={href}
          className="text-sm text-accent hover:text-white transition-colors shrink-0"
        >
          {linkLabel} →
        </Link>
      )}
    </div>
  )
}
