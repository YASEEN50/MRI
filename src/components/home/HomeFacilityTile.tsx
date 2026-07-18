'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import Badge from '@/components/ui/Badge'

interface HomeFacilityTileProps {
  id: string
  name: string
  type: string
  city: string
  averageRating: number
  totalReviews: number
  logoUrl?: string
}

export default function HomeFacilityTile({
  id,
  name,
  type,
  city,
  averageRating,
  totalReviews,
  logoUrl,
}: HomeFacilityTileProps) {
  const t = useTranslations()
  const typeLabel = t(`facilities.types.${type}` as 'facilities.types.CLINIC')

  return (
    <article className="mpi-card-hover p-4 flex flex-col h-full snap-start shrink-0 w-[min(100%,260px)] lg:w-auto">
      <Link href={`/facilities/${id}`} className="flex items-center gap-3 mb-3 group/profile">
        <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
          {logoUrl ? (
            <Image src={logoUrl} alt={name} fill className="object-cover" unoptimized loading="lazy" />
          ) : (
            <span className="text-2xl" aria-hidden>🏥</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-white text-sm truncate group-hover/profile:text-accent transition-colors">
            {name}
          </h3>
          <Badge variant="accent" className="mt-1 text-[10px]">{typeLabel}</Badge>
          <p className="text-slate-500 text-[11px] mt-1 truncate">📍 {city}</p>
        </div>
      </Link>

      <div className="flex items-center gap-2 text-xs mb-4">
        <span className="text-warning font-semibold">⭐ {averageRating.toFixed(1)}</span>
        <span className="text-slate-500">({totalReviews})</span>
      </div>

      <Link
        href={`/facilities/${id}`}
        className="mt-auto text-center py-2.5 min-h-[44px] flex items-center justify-center text-xs bg-white/5 hover:bg-primary/15 border border-white/10 hover:border-primary/30 text-slate-200 rounded-xl transition-all mpi-btn-ripple"
      >
        {t('home.facility_view')}
      </Link>
    </article>
  )
}
