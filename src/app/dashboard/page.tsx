'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Role } from '@prisma/client'
import { useRequireAuth } from '@/hooks/useRequireAuth'

/** Client redirect — Pi Browser may not send session cookie on navigation (SSR would fail). */
export default function DashboardPage() {
  const { session, isLoading, isAuthenticated } = useRequireAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading || !isAuthenticated) return

    switch (session?.user?.role) {
      case Role.OWNER:
        router.replace('/owner')
        break
      case Role.ADMIN:
        router.replace('/dashboard/admin/verification')
        break
      case Role.DOCTOR:
        router.replace('/dashboard/doctor/schedule')
        break
      case Role.FACILITY:
        router.replace('/dashboard/facility/overview')
        break
      default:
        router.replace('/dashboard/client/appointments')
    }
  }, [isLoading, isAuthenticated, session, router])

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
    </div>
  )
}
