import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { getTopSpecializations } from '@/lib/home/get-top-specializations'
import { specialtyIcon } from '@/lib/home/specialty-icon'

export default async function HomeSpecialtiesStrip() {
  const t = await getTranslations('home')
  let specializations: Awaited<ReturnType<typeof getTopSpecializations>> = []

  try {
    specializations = await getTopSpecializations(14)
  } catch {
    specializations = []
  }

  if (specializations.length === 0) {
    return (
      <div className="mpi-card p-8 text-center">
        <div className="text-3xl mb-2">🩺</div>
        <p className="text-slate-400 text-sm">{t('specialties_empty')}</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <span aria-hidden>🩺</span>
        {t('specialties_title')}
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory -mx-1 px-1 [scrollbar-width:thin]">
        {specializations.map(item => (
          <Link
            key={item.name}
            href={`/doctors?specialization=${encodeURIComponent(item.name)}`}
            className="snap-start shrink-0 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-gradient-to-br from-primary/10 to-white/[0.03] border border-white/[0.08] hover:border-primary/30 hover:bg-primary/10 transition-all duration-300 active:scale-[0.98] min-w-[140px]"
          >
            <span className="text-xl shrink-0" aria-hidden>{specialtyIcon(item.name)}</span>
            <div className="min-w-0 text-start">
              <p className="text-sm font-medium text-white truncate max-w-[120px]">{item.name}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {t('specialty_doctors_count', { count: item.count })}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
