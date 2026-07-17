// src/app/page.tsx — Authenticated home (guests see pi.html via middleware)
export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { getLocale } from 'next-intl/server'
import Navbar from '@/components/common/Navbar'
import Footer from '@/components/common/Footer'
import HomeHero from '@/components/home/HomeHero'
import HomeSection from '@/components/home/HomeSection'
import HomeServicesStrip from '@/components/home/HomeServicesStrip'
import HomeStatsGrid from '@/components/home/HomeStatsGrid'
import HomeSpecialtiesStrip from '@/components/home/HomeSpecialtiesStrip'
import HomeFeaturedDoctors from '@/components/home/HomeFeaturedDoctors'
import HomeFeaturedFacilities from '@/components/home/HomeFeaturedFacilities'
import HomePublicationsSection from '@/components/home/HomePublicationsSection'
import HomeAdsSection from '@/components/home/HomeAdsSection'
import HomeConsultBanner from '@/components/home/HomeConsultBanner'
import HomeQuickJump from '@/components/home/HomeQuickJump'
import {
  HomeAdsSkeleton,
  HomeCardRowSkeleton,
  HomePublicationsSkeleton,
  HomeSpecialtiesSkeleton,
} from '@/components/home/HomeSkeletons'
import HomeReveal from '@/components/home/HomeReveal'
import { prisma } from '@/lib/prisma'
import { ApprovalStatus, Role } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { doctorProfilePublicWhere, expireStalePremios } from '@/lib/premio/active-premio'

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('DB_TIMEOUT')), ms),
    ),
  ])
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

  let stats = { doctors: 0, facilities: 0, appointments: 0 }
  try {
    stats = await withTimeout(getStats(), 4000)
  } catch (e) {
    console.error('[HomePage] stats error:', e)
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

      <HomeReveal>
        <HomeSection bordered>
          <HomeServicesStrip role={role} />
        </HomeSection>
      </HomeReveal>

      <HomeReveal>
        <HomeSection bordered className="py-6">
          <HomeQuickJump />
        </HomeSection>
      </HomeReveal>

      <HomeReveal>
        <HomeSection bordered className="py-8">
          <HomeStatsGrid stats={statItems} />
        </HomeSection>
      </HomeReveal>

      <HomeReveal>
        <HomeSection bordered className="py-8">
          <HomeConsultBanner role={role} />
        </HomeSection>
      </HomeReveal>

      <HomeReveal>
        <HomeSection bordered id="featured-doctors" className="scroll-mt-20">
          <Suspense fallback={<HomeCardRowSkeleton count={3} />}>
            <HomeFeaturedDoctors />
          </Suspense>
        </HomeSection>
      </HomeReveal>

      <HomeReveal>
        <HomeSection bordered id="featured-facilities" className="scroll-mt-20">
          <Suspense fallback={<HomeCardRowSkeleton count={4} />}>
            <HomeFeaturedFacilities />
          </Suspense>
        </HomeSection>
      </HomeReveal>

      <HomeReveal>
        <HomeSection bordered id="specialties" className="scroll-mt-20">
          <Suspense fallback={<HomeSpecialtiesSkeleton />}>
            <HomeSpecialtiesStrip />
          </Suspense>
        </HomeSection>
      </HomeReveal>

      <HomeReveal>
        <HomeSection bordered id="publications" className="scroll-mt-20">
          <Suspense fallback={<HomePublicationsSkeleton />}>
            <HomePublicationsSection />
          </Suspense>
        </HomeSection>
      </HomeReveal>

      <HomeReveal>
        <HomeSection bordered id="ads" className="pb-14">
          <Suspense fallback={<HomeAdsSkeleton />}>
            <HomeAdsSection />
          </Suspense>
        </HomeSection>
      </HomeReveal>

      <Footer locale={locale} />
    </div>
  )
}
