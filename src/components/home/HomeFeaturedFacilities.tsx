import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { ApprovalStatus } from '@prisma/client'
import HomeSectionHeader from '@/components/home/HomeSectionHeader'
import FacilityCard from '@/components/facilities/FacilityCard'
import { prisma } from '@/lib/prisma'

export default async function HomeFeaturedFacilities() {
  const t = await getTranslations()

  let facilities: Awaited<ReturnType<typeof prisma.facilityProfile.findMany>> = []
  try {
    facilities = await prisma.facilityProfile.findMany({
      where: { approvalStatus: ApprovalStatus.APPROVED, deletedAt: null },
      orderBy: { averageRating: 'desc' },
      take: 6,
    })
  } catch {
    facilities = []
  }

  return (
    <>
      <HomeSectionHeader
        title={`🏥 ${t('home.featured_facilities')}`}
        href="/facilities"
        linkLabel={t('common.show_more')}
      />
      {facilities.length > 0 ? (
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1 [scrollbar-width:thin] lg:grid lg:grid-cols-3 xl:grid-cols-4 lg:overflow-visible lg:snap-none">
          {facilities.map(f => (
            <div key={f.id} className="snap-start shrink-0 w-[min(100%,280px)] lg:w-auto">
              <FacilityCard
                id={f.id}
                name={f.name}
                type={f.type}
                city={f.city}
                averageRating={Number(f.averageRating)}
                totalReviews={f.totalReviews}
                phone={f.phone ?? undefined}
                logoUrl={f.logoUrl ?? undefined}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="mpi-card p-10 text-center">
          <div className="text-4xl mb-3">🏥</div>
          <p className="text-slate-400 text-sm mb-4">{t('home.facilities_empty')}</p>
          <Link href="/facilities" className="text-accent text-sm hover:underline">
            {t('nav.facilities')} →
          </Link>
        </div>
      )}
    </>
  )
}
