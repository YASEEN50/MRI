'use client'

import { usePathname, useRouter } from 'next/navigation'

const BACK_TARGETS: Record<string, string> = {
  '/register': '/login',
  '/forgot-password': '/login',
  '/reset-password': '/login',
}

export default function AuthPageBackNav() {
  const pathname = usePathname()
  const router = useRouter()
  const backHref = BACK_TARGETS[pathname]
  if (!backHref) return null

  function handleBack() {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
      return
    }
    router.push(backHref)
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-4">
      <button
        type="button"
        onClick={handleBack}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition-all"
      >
        <span aria-hidden>←</span>
        رجوع
      </button>
    </div>
  )
}
