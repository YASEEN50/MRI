import LegalPageLayout from '@/components/layout/LegalPageLayout'
import { getLocale } from 'next-intl/server'
import Link from 'next/link'

export default async function ContactPage() {
  const locale = await getLocale() as 'ar' | 'en'
  const isAr = locale === 'ar'

  return (
    <LegalPageLayout
      locale={locale}
      title={isAr ? 'اتصل بنا' : 'Contact Us'}
      subtitle={isAr ? 'نحن هنا لمساعدتك' : 'We are here to help'}
    >
      {isAr ? (
        <>
          <h2>الدعم الفني</h2>
          <p>
            الأفضل فتح تذكرة داخل المنصة للمتابعة والرد السريع:{' '}
            <Link href="/dashboard/support" className="text-accent hover:underline">مركز الدعم</Link>
          </p>
          <p className="text-slate-400 text-sm">
            أو راسلنا على البريد (احتياطي):{' '}
            <a href="mailto:support@mri.app">support@mri.app</a>
          </p>
          <h2>التحقق والاعتماد</h2>
          <p>
            لاستفسارات الأطباء والمنشآت حول التحقق، راجع{' '}
            <Link href="/dashboard/admin/pending">الطلبات المعلقة</Link> إذا كنت مشرفاً.
          </p>
          <h2>وقت الاستجابة</h2>
          <p>نسعى للرد خلال 1–3 أيام عمل.</p>
        </>
      ) : (
        <>
          <h2>Technical Support</h2>
          <p>
            Prefer in-app tickets:{' '}
            <Link href="/dashboard/support" className="text-accent hover:underline">Support center</Link>
          </p>
          <p className="text-slate-400 text-sm">
            Email (fallback):{' '}
            <a href="mailto:support@mri.app">support@mri.app</a>
          </p>
          <h2>Response Time</h2>
          <p>We aim to respond within 1–3 business days.</p>
        </>
      )}
    </LegalPageLayout>
  )
}
