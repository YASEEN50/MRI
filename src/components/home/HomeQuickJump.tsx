'use client'

import { useTranslations } from 'next-intl'

const SECTIONS = [
  { id: 'featured-doctors', key: 'jump_doctors' as const, icon: '👨‍⚕️' },
  { id: 'featured-facilities', key: 'jump_facilities' as const, icon: '🏥' },
  { id: 'specialties', key: 'jump_specialties' as const, icon: '🩺' },
  { id: 'publications', key: 'jump_publications' as const, icon: '📰' },
] as const

export default function HomeQuickJump() {
  const t = useTranslations('home')

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <nav aria-label={t('jump_nav_label')} className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:none]">
      {SECTIONS.map(section => (
        <button
          key={section.id}
          type="button"
          onClick={() => scrollTo(section.id)}
          className="snap-start shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-full text-xs font-medium bg-white/[0.04] border border-white/[0.08] text-slate-300 hover:border-primary/30 hover:text-white hover:bg-primary/10 transition-all mpi-btn-ripple whitespace-nowrap"
        >
          <span aria-hidden>{section.icon}</span>
          {t(section.key)}
        </button>
      ))}
    </nav>
  )
}
