'use client'

import PageBackNav from '@/components/common/PageBackNav'
import { useAppLocale } from '@/hooks/useAppLocale'

/** Standalone back bar for pages without the full Navbar (e.g. onboarding). */
export default function AppBackBar() {
  const { locale, dir } = useAppLocale()

  return (
    <div dir={dir} className="sticky top-0 z-40 bg-background/90 backdrop-blur-sm border-b border-white/[0.04]">
      <PageBackNav locale={locale} />
    </div>
  )
}
