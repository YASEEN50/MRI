'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

interface StatItem {
  value: number
  label: string
  icon: string
}

interface HomeStatsGridProps {
  stats: StatItem[]
}

function useCountUp(target: number, duration = 1100): number {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (target <= 0) {
      setValue(0)
      return
    }

    let frame = 0
    const start = performance.now()

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - (1 - progress) ** 3
      setValue(Math.floor(eased * target))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])

  return value
}

function StatCard({ stat, index }: { stat: StatItem; index: number }) {
  const t = useTranslations('home')
  const animated = useCountUp(stat.value)

  return (
    <div
      className="mpi-card relative overflow-hidden p-5 text-center animate-slide-up bg-gradient-to-br from-primary/10 via-surface-card to-accent/5 hover:border-primary/25 transition-all duration-300"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
      <div className="relative">
        <div className="text-3xl mb-2">{stat.icon}</div>
        {stat.value > 0 ? (
          <p className="text-3xl sm:text-4xl font-bold text-white tabular-nums">
            {animated.toLocaleString()}+
          </p>
        ) : (
          <p className="text-sm font-medium text-slate-400 leading-relaxed px-1">
            {t('stats_empty')}
          </p>
        )}
        <p className="text-[11px] sm:text-xs text-slate-500 mt-2">{stat.label}</p>
      </div>
    </div>
  )
}

export default function HomeStatsGrid({ stats }: HomeStatsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
      {stats.map((stat, i) => (
        <StatCard key={stat.label} stat={stat} index={i} />
      ))}
    </div>
  )
}
