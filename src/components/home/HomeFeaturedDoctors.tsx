import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import HomeSectionHeader from '@/components/home/HomeSectionHeader'
import DoctorCard from '@/components/doctors/DoctorCard'
import { listPublicDoctors } from '@/lib/premio/list-doctors'

export default async function HomeFeaturedDoctors() {
  const t = await getTranslations()

  let doctors: Awaited<ReturnType<typeof listPublicDoctors>> = []
  try {
    doctors = await listPublicDoctors({ take: 6 })
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
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1 [scrollbar-width:thin] lg:grid lg:grid-cols-3 lg:overflow-visible lg:snap-none">
          {doctors.map(d => (
            <div key={d.id} className="snap-start shrink-0 w-[min(100%,300px)] lg:w-auto">
              <DoctorCard
                id={d.id}
                fullName={`${d.firstName} ${d.lastName}`}
                specialization={d.specialization}
                city={d.city ?? undefined}
                consultationFee={d.consultationFee ? Number(d.consultationFee) : undefined}
                averageRating={Number(d.averageRating)}
                totalReviews={d.totalReviews}
                yearsOfExperience={d.yearsOfExperience}
                premioTier={d.premioTier}
                avatarUrl={d.avatarUrl ?? undefined}
              />
            </div>
          ))}
        </div>
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
