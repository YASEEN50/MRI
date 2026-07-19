import LegalPageLayout from '@/components/layout/LegalPageLayout'
import { getLocale } from 'next-intl/server'

export default async function PrivacyPage() {
  const locale = await getLocale() as 'ar' | 'en'
  const isAr = locale === 'ar'

  return (
    <LegalPageLayout
      locale={locale}
      title={isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}
      subtitle={isAr ? 'كيف نجمع ونستخدم ونحمي بياناتك' : 'How we collect, use, and protect your data'}
    >
      {isAr ? (
        <>
          <h2>البيانات التي نجمعها</h2>
          <ul>
            <li>بيانات الحساب: معرف Pi (piUid)، اسم المستخدم على Pi، الدور، وبيانات الملف.</li>
            <li>بيانات المواعيد والاستشارات والمحادثات.</li>
            <li>وثائق التحقق للأطباء والمنشآت.</li>
            <li>
              بيانات المدفوعات: معرفات دفع Pi، مبالغ المعاملات، hashes البلوك تشين (txid)، وأغراض
              الدفع (موعد، استشارة، بريميو، إعلان).
            </li>
          </ul>

          <h2>Pi Network والمدفوعات</h2>
          <p>
            المصادقة والدفع يتمان عبر Pi Network. نستخدم access token من Pi للتحقق من هويتك
            (scope: username, payments). لا نخزّن مفتاح محفظتك الخاص. معرفات الدفع والمعاملات
            تُستخدم لتأكيد الخدمات ومنع الاحتيال.
          </p>

          <h2>استخدام البيانات</h2>
          <ul>
            <li>تقديم الحجز، الاستشارات، والتواصل.</li>
            <li>التحقق من الهوية والمؤهلات الطبية.</li>
            <li>معالجة مدفوعات Pi وتسوية مستحقات الأطباء.</li>
            <li>تحسين الأمان ومراقبة المخالفات.</li>
          </ul>

          <h2>حماية البيانات</h2>
          <p>
            نستخدم تشفيراً وصلاحيات وصول محدودة. وثائق التحقق تُستخدم لأغراض المراجعة فقط.
          </p>

          <h2>حقوقك</h2>
          <p>يمكنك طلب تصحيح أو حذف بياناتك عبر صفحة «اتصل بنا» أو إعدادات الحساب.</p>
        </>
      ) : (
        <>
          <h2>Data We Collect</h2>
          <ul>
            <li>Account: Pi uid/username, role, profile data.</li>
            <li>Appointments, consults, chat.</li>
            <li>Doctor/facility verification documents.</li>
            <li>Payment data: Pi payment IDs, amounts, blockchain txids, payment purpose.</li>
          </ul>

          <h2>Pi Network &amp; Payments</h2>
          <p>
            Auth and payments use Pi Network. We verify you with Pi access tokens (username,
            payments scopes). We do not store your wallet private key. Payment records prevent
            fraud and confirm services.
          </p>

          <h2>How We Use Data</h2>
          <ul>
            <li>Booking, consults, messaging.</li>
            <li>Identity and credential verification.</li>
            <li>Pi payment processing and doctor settlements.</li>
            <li>Security and moderation.</li>
          </ul>

          <h2>Security</h2>
          <p>Encryption and limited access. Verification docs are for review only.</p>

          <h2>Your Rights</h2>
          <p>Request correction or deletion via contact or account settings.</p>
        </>
      )}
    </LegalPageLayout>
  )
}
