import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Role } from '@prisma/client'

interface HomeHeroActionsProps {
  locale: 'ar' | 'en'
  role?: Role
  isLoggedIn: boolean
}

function dashboardCta(role: Role | undefined, locale: 'ar' | 'en'): { href: string; label: string; icon: string } | null {
  switch (role) {
    case Role.DOCTOR:
      return {
        href: '/dashboard/doctor/publications',
        label: locale === 'ar' ? 'منشوراتي' : 'My publications',
        icon: '📝',
      }
    case Role.FACILITY:
      return {
        href: '/dashboard/facility/overview',
        label: locale === 'ar' ? 'لوحة المنشأة' : 'Facility dashboard',
        icon: '🏥',
      }
    case Role.ADMIN:
      return {
        href: '/dashboard/admin/verification',
        label: locale === 'ar' ? 'لوحة التحكم' : 'Admin dashboard',
        icon: '⚙️',
      }
    case Role.OWNER:
      return {
        href: '/owner',
        label: locale === 'ar' ? 'لوحة المالك' : 'Owner dashboard',
        icon: '👑',
      }
    case Role.CLIENT:
      return {
        href: '/dashboard/client/appointments',
        label: locale === 'ar' ? 'مواعيدي' : 'My appointments',
        icon: '📅',
      }
    default:
      return null
  }
}

const secondaryBtn =
  'inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-slate-200 font-medium rounded-2xl transition-all duration-300 text-sm active:scale-[0.98]'

export default async function HomeHeroActions({ locale, role, isLoggedIn }: HomeHeroActionsProps) {
  const t = await getTranslations('home')
  const dashboard = isLoggedIn ? dashboardCta(role, locale) : null

  const primaryHref = role === Role.DOCTOR ? '/dashboard/doctor/schedule' : '/doctors'
  const primaryLabel =
    role === Role.DOCTOR
      ? (locale === 'ar' ? 'جدولي' : 'My schedule')
      : t('hero_cta')
  const primaryIcon = role === Role.DOCTOR ? '📅' : '🔍'

  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-center flex-wrap">
      <Link
        href={primaryHref}
        className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-primary to-primary-600 hover:from-primary-400 hover:to-primary text-white font-semibold rounded-2xl transition-all duration-300 shadow-glow-primary text-sm active:scale-[0.98]"
      >
        <span aria-hidden>{primaryIcon}</span>
        {primaryLabel}
      </Link>

      <Link href="/publications" className={secondaryBtn}>
        <span aria-hidden>📰</span>
        {locale === 'ar' ? 'منشورات الأطباء' : 'Doctor publications'}
      </Link>

      {dashboard ? (
        <Link href={dashboard.href} className={secondaryBtn}>
          <span aria-hidden>{dashboard.icon}</span>
          {dashboard.label}
        </Link>
      ) : (
        <Link href="/register" className={secondaryBtn}>
          <span aria-hidden>➕</span>
          {t('hero_cta_secondary')}
        </Link>
      )}
    </div>
  )
}
