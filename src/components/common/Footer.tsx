'use client'
// src/components/common/Footer.tsx

import Link from 'next/link'

interface FooterProps {
  locale?: 'ar' | 'en'
}

export default function Footer({ locale = 'ar' }: FooterProps) {
  const isAr = locale === 'ar'
  const year = new Date().getFullYear()

  const quickLinks = [
    { href: '/doctors', label: isAr ? 'الأطباء' : 'Doctors' },
    { href: '/facilities', label: isAr ? 'المنشآت' : 'Facilities' },
    { href: '/publications', label: isAr ? 'المنشورات' : 'Publications' },
    { href: '/consult-now', label: isAr ? 'استشارة فورية' : 'Instant consult' },
  ]

  const supportLinks = [
    { href: '/contact', label: isAr ? 'اتصل بنا' : 'Contact us' },
    { href: '/dashboard/support', label: isAr ? 'مركز الدعم' : 'Support center' },
    { href: '/privacy', label: isAr ? 'الخصوصية' : 'Privacy' },
    { href: '/terms', label: isAr ? 'الشروط' : 'Terms' },
    { href: '/advertise', label: isAr ? 'الإعلانات' : 'Advertising' },
  ]

  const aboutLinks = [
    { href: '/about', label: isAr ? 'من نحن' : 'About us' },
    { href: '/register', label: isAr ? 'إنشاء حساب' : 'Register' },
    { href: '/login', label: isAr ? 'تسجيل الدخول' : 'Login' },
  ]

  return (
    <footer className="border-t border-white/[0.06] bg-background-deep/60 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow-primary">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div>
                <span className="font-bold text-white text-lg leading-tight block">MRI</span>
                <span className="text-[11px] text-slate-400">
                  {isAr ? 'منصة طبية موثوقة' : 'Trusted Medical Platform'}
                </span>
              </div>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed">
              {isAr
                ? 'منصة طبية متكاملة تربط المرضى بالأطباء والمنشآت الصحية المعتمدة — حجز، استشارة، ومحتوى طبي موثوق.'
                : 'Integrated medical platform connecting patients with verified doctors and facilities — booking, consults, and trusted content.'}
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4">{isAr ? 'روابط سريعة' : 'Quick links'}</h4>
            <ul className="space-y-2.5">
              {quickLinks.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-slate-500 hover:text-accent text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4">{isAr ? 'الدعم' : 'Support'}</h4>
            <ul className="space-y-2.5">
              {supportLinks.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-slate-500 hover:text-accent text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4">{isAr ? 'عن MRI' : 'About MRI'}</h4>
            <ul className="space-y-2.5 mb-5">
              {aboutLinks.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-slate-500 hover:text-accent text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <h4 className="text-white font-semibold text-sm mb-3">{isAr ? 'مدعوم من' : 'Powered by'}</h4>
            <p className="text-slate-500 text-sm">Pi Network</p>
          </div>
        </div>

        <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-600 text-xs">
          <p>© {year} MRI. {isAr ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}</p>
          <p className="text-slate-600">{isAr ? 'صُمم للرعاية الصحية الرقمية' : 'Built for digital healthcare'}</p>
        </div>
      </div>
    </footer>
  )
}
