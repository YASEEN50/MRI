import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Role } from '@prisma/client'

interface HomeServicesStripProps {
  role?: Role
}

function appointmentsHref(role?: Role): string {
  switch (role) {
    case Role.DOCTOR:
      return '/dashboard/doctor/schedule'
    case Role.FACILITY:
      return '/dashboard/facility/appointments'
    case Role.ADMIN:
      return '/dashboard/admin/verification'
    case Role.OWNER:
      return '/owner'
    default:
      return '/dashboard/client/appointments'
  }
}

export default async function HomeServicesStrip({ role }: HomeServicesStripProps) {
  const t = await getTranslations('home')

  const services = [
    { key: 'doctors', href: '/doctors', icon: '👨‍⚕️', label: t('services_doctors') },
    { key: 'facilities', href: '/facilities', icon: '🏥', label: t('services_facilities') },
    { key: 'labs', href: '/facilities?type=LABORATORY', icon: '🧪', label: t('services_labs') },
    { key: 'pharmacies', href: '/facilities?type=PHARMACY', icon: '💊', label: t('services_pharmacies') },
    { key: 'appointments', href: appointmentsHref(role), icon: '📅', label: t('services_appointments') },
    ...(role !== Role.DOCTOR
      ? [{ key: 'consult', href: '/consult-now', icon: '⚡', label: t('services_consult') }]
      : []),
  ]

  return (
    <div>
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <span aria-hidden>⭐</span>
        {t('services_title')}
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory -mx-1 px-1 [scrollbar-width:thin]">
        {services.map(service => (
          <Link
            key={service.key}
            href={service.href}
            className="snap-start shrink-0 flex flex-col items-center gap-2 min-w-[88px] px-4 py-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:border-primary/30 hover:bg-primary/10 transition-all duration-300 active:scale-95"
          >
            <span className="text-2xl" aria-hidden>{service.icon}</span>
            <span className="text-xs font-medium text-slate-300 text-center leading-tight whitespace-nowrap">
              {service.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
