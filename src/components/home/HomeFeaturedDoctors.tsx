import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import HomeSectionHeader from '@/components/home/HomeSectionHeader'
import HomeDoctorTile from '@/components/home/HomeDoctorTile'
import HomeScrollRow from '@/components/home/HomeScrollRow'
import { listPublicDoctors } from '@/lib/premio/list-doctors'

export default async function HomeFeaturedDoctors() {
  const t = await getTranslations()

  let doctors: Awaited<ReturnType<typeof listPublicDoctors>> = []
  try {
    doctors = await listPublicDoctors({ take: 8 })
  } catch {
    doctors = []
  }

  return (
    <>
      <HomeSectionHeader
        title={`⭐ ${t('home.featured_doctors')}`}
        href="/doctors"
        linkLabel={t('common.show_more')}
      />
      {doctors.length > 0 ? (
        <HomeScrollRow>
          {doctors.map(d => (
            <HomeDoctorTile
              key={d.id}
              id={d.id}
              fullName={`${d.firstName} ${d.lastName}`}
              specialization={d.specialization}
              city={d.city ?? undefined}
              averageRating={Number(d.averageRating)}
              totalReviews={d.totalReviews}
              premioTier={d.premioTier}
              avatarUrl={d.avatarUrl ?? undefined}
            />
          ))}
        </HomeScrollRow>
      ) : (
        <div className="mpi-card p-10 text-center">
          <div className="text-4xl mb-3">👨‍⚕️</div>
          <p className="text-slate-400 text-sm mb-4">{t('home.doctors_empty')}</p>
          <Link href="/doctors" className="text-accent text-sm hover:underline">
            {t('home.hero_cta')} →
          </Link>
        </div>
      )}
    </>
  )
}
