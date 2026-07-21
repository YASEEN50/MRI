'use client'
// src/components/doctor/DoctorSubpageLayout.tsx

import DashboardShell from '@/components/dashboard/DashboardShell'

interface DoctorSubpageLayoutProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  maxWidth?: '2xl' | '4xl'
}

const WIDTH: Record<NonNullable<DoctorSubpageLayoutProps['maxWidth']>, string> = {
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
}

export default function DoctorSubpageLayout({
  title,
  subtitle,
  children,
  maxWidth = '2xl',
}: DoctorSubpageLayoutProps) {
  return (
    <DashboardShell>
      <div className={`${WIDTH[maxWidth]} mx-auto px-4 sm:px-6 py-8`}>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          {subtitle && <p className="text-slate-400 text-sm mt-1">{subtitle}</p>}
        </div>

        {children}
      </div>
    </DashboardShell>
  )
}
