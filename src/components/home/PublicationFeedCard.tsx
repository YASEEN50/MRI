import Link from 'next/link'
import Image from 'next/image'
import { publicationTypeLabel, PUBLICATION_TYPE_COLORS } from '@/lib/publications/constants'
import { publicationExcerpt, hasPublicationBody } from '@/lib/publications/excerpt'
import { estimateReadTimeMinutes, formatReadTime } from '@/lib/publications/read-time'
import type { HomePublication } from '@/lib/home/get-home-publications'

interface PublicationFeedCardProps {
  pub: HomePublication
  locale: 'ar' | 'en'
  compact?: boolean
}

export default function PublicationFeedCard({ pub, locale, compact }: PublicationFeedCardProps) {
  const authorName = pub.doctor
    ? locale === 'ar'
      ? `د. ${pub.doctor.firstName} ${pub.doctor.lastName}`
      : `Dr. ${pub.doctor.firstName} ${pub.doctor.lastName}`
    : null

  const excerpt = publicationExcerpt(pub.summary, pub.content, compact ? 140 : 180)
  const showReadMore = hasPublicationBody(pub.summary, pub.content)
  const readMinutes = estimateReadTimeMinutes(pub.summary, pub.content, locale)

  return (
    <Link
      href={`/publications/${pub.id}`}
      className="mpi-card overflow-hidden hover:border-primary/30 hover:-translate-y-0.5 hover:shadow-card-hover transition-all duration-300 group flex flex-col h-full"
    >
      {pub.coverUrl && !compact ? (
        <div className="h-36 overflow-hidden relative bg-white/5">
          <Image
            src={pub.coverUrl}
            alt={pub.title}
            width={640}
            height={144}
            unoptimized
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
        </div>
      ) : (
        <div className="h-2 bg-gradient-to-r from-primary/40 via-accent/30 to-primary/20" />
      )}

      <div className="p-4 sm:p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-2.5 flex-wrap">
          <span className={`text-[11px] px-2.5 py-1 rounded-full border font-medium ${PUBLICATION_TYPE_COLORS[pub.type] ?? ''}`}>
            {publicationTypeLabel(pub.type, locale)}
          </span>
          <span className="text-[11px] text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">
            {formatReadTime(readMinutes, locale)}
          </span>
        </div>

        <h3 className="text-white font-semibold text-[15px] sm:text-base mb-2 line-clamp-2 group-hover:text-accent transition-colors leading-snug">
          {pub.title}
        </h3>

        {excerpt ? (
          <p className={`text-slate-400 line-clamp-2 leading-relaxed mb-3 ${compact ? 'text-xs' : 'text-sm'}`}>
            {excerpt}
          </p>
        ) : null}

        <div className="flex items-center gap-2 mb-3 mt-auto flex-wrap">
          {authorName && (
            <span className="text-slate-300 text-xs truncate max-w-[55%]">{authorName}</span>
          )}
          {pub.doctor?.specialization && (
            <>
              <span className="text-slate-600 text-xs">·</span>
              <span className="text-slate-500 text-xs truncate">{pub.doctor.specialization}</span>
            </>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-white/5 gap-3">
          <div className="flex items-center gap-3 text-slate-500 text-[11px]">
            <span>👁 {pub.viewCount.toLocaleString()}</span>
            {pub.publishedAt && (
              <span>
                {new Date(pub.publishedAt).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
            )}
          </div>
          {showReadMore && (
            <span className="text-accent text-xs font-semibold group-hover:underline shrink-0">
              {locale === 'ar' ? 'اقرأ المزيد ←' : 'Read more →'}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
