import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { ApprovalStatus } from '@prisma/client'
import HomeSectionHeader from '@/components/home/HomeSectionHeader'
import HomeFacilityTile from '@/components/home/HomeFacilityTile'
import HomeScrollRow from '@/components/home/HomeScrollRow'
import { prisma } from '@/lib/prisma'

export default async function HomeFeaturedFacilities() {
  const t = await getTranslations()

  let facilities: Awaited<ReturnType<typeof prisma.facilityProfile.findMany>> = []
  try {
    facilities = await prisma.facilityProfile.findMany({
      where: { approvalStatus: ApprovalStatus.APPROVED, deletedAt: null },
      orderBy: { averageRating: 'desc' },
      take: 8,
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
        <HomeScrollRow gridClassName="lg:grid-cols-4">
          {facilities.map(f => (
            <HomeFacilityTile
              key={f.id}
              id={f.id}
              name={f.name}
              type={f.type}
              city={f.city}
              averageRating={Number(f.averageRating)}
              totalReviews={f.totalReviews}
              logoUrl={f.logoUrl ?? undefined}
            />
          ))}
        </HomeScrollRow>
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
