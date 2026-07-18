'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import PremioBadge from '@/components/premio/PremioBadge'
import type { PremioTier } from '@/lib/premio/tiers'

interface HomeDoctorTileProps {
  id: string
  fullName: string
  specialization: string
  city?: string
  averageRating: number
  totalReviews: number
  avatarUrl?: string
  premioTier?: PremioTier | null
}

export default function HomeDoctorTile({
  id,
  fullName,
  specialization,
  city,
  averageRating,
  totalReviews,
  avatarUrl,
  premioTier,
}: HomeDoctorTileProps) {
  const t = useTranslations()

  return (
    <article className="mpi-card-hover p-4 flex flex-col h-full snap-start shrink-0 w-[min(100%,272px)] lg:w-auto">
      <Link href={`/doctors/${id}`} className="flex items-center gap-3 mb-3 group/profile">
        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/25 to-accent/15 border border-primary/25 flex items-center justify-center shrink-0 overflow-hidden">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={fullName}
              fill
              className="object-cover"
              unoptimized
              loading="lazy"
            />
          ) : (
            <span className="text-2xl font-bold text-accent">{fullName[0]}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-bold text-white text-sm truncate group-hover/profile:text-accent transition-colors">
              {fullName}
            </h3>
            <PremioBadge tier={premioTier} />
          </div>
          <p className="text-primary-400 text-xs mt-0.5 truncate">{specialization}</p>
          {city && <p className="text-slate-500 text-[11px] mt-0.5 truncate">📍 {city}</p>}
        </div>
      </Link>

      <div className="flex items-center gap-2 text-xs mb-4">
        <span className="text-warning font-semibold">⭐ {averageRating.toFixed(1)}</span>
        <span className="text-slate-500">({totalReviews} {t('doctors.reviews')})</span>
      </div>

      <div className="flex gap-2 mt-auto">
        <Link
          href={`/doctors/${id}`}
          className="flex-1 text-center py-2.5 min-h-[44px] flex items-center justify-center text-xs border border-white/10 hover:border-primary/40 text-slate-300 hover:text-white rounded-xl transition-all mpi-btn-ripple"
        >
          {t('doctors.view_profile')}
        </Link>
        <Link
          href={`/doctors/${id}?book=true`}
          className="flex-1 text-center py-2.5 min-h-[44px] flex items-center justify-center text-xs bg-primary hover:bg-primary-400 text-white rounded-xl transition-all font-semibold mpi-btn-ripple"
        >
          {t('doctors.book_appointment')}
        </Link>
      </div>
    </article>
  )
}
