import { getTranslations } from 'next-intl/server'
import HomeHeroSearch from '@/components/home/HomeHeroSearch'
import HomeHeroActions from '@/components/home/HomeHeroActions'
import { Role } from '@prisma/client'

interface HomeHeroProps {
  locale: 'ar' | 'en'
  role: Role
}

const TRUST_CHIPS = [
  { key: 'verified', icon: '✅' },
  { key: 'secure', icon: '🔒' },
  { key: 'fast', icon: '⚡' },
] as const

export default async function HomeHero({ locale, role }: HomeHeroProps) {
  const t = await getTranslations('home')

  return (
    <section className="relative overflow-hidden mpi-grid-bg mpi-hero-glow">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[360px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 end-0 w-[320px] h-[240px] bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-16 sm:pt-16 sm:pb-[4.5rem] text-center animate-fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/25 rounded-full text-accent text-sm mb-6">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse-soft" />
          {locale === 'ar' ? 'MRI — منصة طبية موثوقة' : 'MRI — Trusted Medical Platform'}
        </div>

        <div className="flex items-center justify-center gap-3 mb-5">
          <div
            className="hidden sm:flex w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/20 border border-primary/25 items-center justify-center shrink-0"
            aria-hidden
          >
            <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold text-white leading-tight tracking-tight">
            {t('hero_title')}
          </h1>
        </div>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mb-6 leading-relaxed">
          {t('hero_subtitle')}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {TRUST_CHIPS.map(chip => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/[0.04] border border-white/[0.08] text-slate-300"
            >
              <span aria-hidden>{chip.icon}</span>
              {t(`trust_${chip.key}` as 'home.trust_verified')}
            </span>
          ))}
        </div>

        <div className="mb-7 px-2 sm:px-4 max-w-2xl mx-auto">
          <HomeHeroSearch />
        </div>

        <HomeHeroActions locale={locale} role={role} isLoggedIn />
      </div>
    </section>
  )
}
