import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Role } from '@prisma/client'

interface HomeConsultBannerProps {
  role: Role
}

export default async function HomeConsultBanner({ role }: HomeConsultBannerProps) {
  if (role === Role.DOCTOR || role === Role.FACILITY) return null

  const t = await getTranslations('home')

  return (
    <div className="mpi-card relative overflow-hidden p-6 sm:p-8 border border-primary/25 bg-gradient-to-br from-primary/15 via-surface-card to-accent/10">
      <div className="absolute top-0 end-0 w-40 h-40 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
      <div className="relative flex flex-col sm:flex-row sm:items-center gap-6">
        <div className="flex-1 text-center sm:text-start">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-accent/15 text-accent border border-accent/25 mb-3">
            ⚡ {t('consult_banner_badge')}
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">{t('consult_banner_title')}</h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-lg">{t('consult_banner_subtitle')}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full sm:w-auto">
          <Link
            href="/consult-now"
            className="mpi-btn-ripple inline-flex items-center justify-center gap-2 px-6 py-3.5 min-h-[48px] rounded-2xl bg-gradient-to-r from-primary to-primary-600 hover:from-primary-400 hover:to-primary text-white font-semibold text-sm shadow-glow-primary transition-all"
          >
            ⚡ {t('services_consult')}
          </Link>
          <Link
            href="/doctors"
            className="mpi-btn-ripple inline-flex items-center justify-center gap-2 px-6 py-3.5 min-h-[48px] rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-medium text-sm transition-all"
          >
            🔍 {t('hero_cta')}
          </Link>
        </div>
      </div>
    </div>
  )
}
