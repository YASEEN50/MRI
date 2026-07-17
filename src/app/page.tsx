// src/app/page.tsx — Authenticated home (guests see pi.html via middleware)
export const dynamic = 'force-dynamic'

import { getTranslations } from 'next-intl/server'
import { getLocale } from 'next-intl/server'
import Link from 'next/link'
import Navbar from '@/components/common/Navbar'
import Footer from '@/components/common/Footer'
import HomeHero from '@/components/home/HomeHero'
import HomeSection from '@/components/home/HomeSection'
import HomeSectionHeader from '@/components/home/HomeSectionHeader'
import HomeServicesStrip from '@/components/home/HomeServicesStrip'
import HomeStatsGrid from '@/components/home/HomeStatsGrid'
import HomePublicationsFeed from '@/components/home/HomePublicationsFeed'
import HomeAdsSidebar from '@/components/home/HomeAdsSidebar'
import DoctorCard from '@/components/doctors/DoctorCard'
import FacilityCard from '@/components/facilities/FacilityCard'
import { prisma } from '@/lib/prisma'
import { ApprovalStatus, Role } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { listPublicDoctors } from '@/lib/premio/list-doctors'
import { doctorProfilePublicWhere, expireStalePremios } from '@/lib/premio/active-premio'
import { getHomePublications } from '@/lib/home/get-home-publications'
import { getActiveHomeSidebarAds } from '@/lib/home/get-home-ads'

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('DB_TIMEOUT')), ms),
    ),
  ])
}

async function getFeaturedDoctors() {
  return listPublicDoctors({ take: 6 })
}

async function getFeaturedFacilities() {
  return prisma.facilityProfile.findMany({
    where: { approvalStatus: ApprovalStatus.APPROVED, deletedAt: null },
    orderBy: { averageRating: 'desc' },
    take: 6,
  })
}

async function getStats() {
  await expireStalePremios()
  const [doctors, facilities, appointments] = await Promise.all([
    prisma.doctorProfile.count({ where: doctorProfilePublicWhere() }),
    prisma.facilityProfile.count({ where: { approvalStatus: ApprovalStatus.APPROVED } }),
    prisma.appointment.count({ where: { deletedAt: null } }),
  ])
  return { doctors, facilities, appointments }
}

export default async function HomePage() {
  const t = await getTranslations()
  const locale = await getLocale() as 'ar' | 'en'
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect('/login')
  }
  const role = session.user.role as Role

  let doctors: Awaited<ReturnType<typeof getFeaturedDoctors>> = []
  let facilities: Awaited<ReturnType<typeof getFeaturedFacilities>> = []
  let publications: Awaited<ReturnType<typeof getHomePublications>> = []
  let sidebarAds: Awaited<ReturnType<typeof getActiveHomeSidebarAds>> = []
  let stats = { doctors: 0, facilities: 0, appointments: 0 }

  try {
    ;[doctors, facilities, stats] = await withTimeout(
      Promise.all([getFeaturedDoctors(), getFeaturedFacilities(), getStats()]),
      4000,
    )
  } catch (e) {
    console.error('[HomePage] core data error:', e)
  }

  try {
    publications = await withTimeout(getHomePublications(8), 4000)
  } catch (e) {
    console.error('[HomePage] publications error:', e)
  }

  try {
    sidebarAds = await withTimeout(getActiveHomeSidebarAds(4), 4000)
  } catch (e) {
    console.error('[HomePage] sidebar ads error:', e)
  }

  const statItems = [
    { value: stats.doctors, label: t('home.stats_doctors'), icon: '👨‍⚕️' },
    { value: stats.facilities, label: t('home.stats_facilities'), icon: '🏥' },
    { value: stats.appointments, label: t('home.stats_appointments'), icon: '📅' },
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar locale={locale} />

      <HomeHero locale={locale} role={role} />

      <HomeSection bordered>
        <HomeServicesStrip role={role} />
      </HomeSection>

      <HomeSection bordered className="py-8">
        <HomeStatsGrid stats={statItems} />
      </HomeSection>

      <HomeSection bordered id="featured-doctors">
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
      </HomeSection>

      <HomeSection bordered id="featured-facilities">
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
      </HomeSection>

      <HomeSection bordered id="publications">
        <HomePublicationsFeed publications={publications} locale={locale} />
      </HomeSection>

      <HomeSection bordered id="ads" className="pb-14">
        <HomeAdsSidebar ads={sidebarAds} locale={locale} variant="section" />
      </HomeSection>

      <Footer locale={locale} />
    </div>
  )
}
