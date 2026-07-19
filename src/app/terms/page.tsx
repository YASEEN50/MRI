import LegalPageLayout from '@/components/layout/LegalPageLayout'
import { getLocale } from 'next-intl/server'

export default async function TermsPage() {
  const locale = await getLocale() as 'ar' | 'en'
  const isAr = locale === 'ar'

  return (
    <LegalPageLayout
      locale={locale}
      title={isAr ? 'الشروط والأحكام' : 'Terms of Service'}
      subtitle={isAr ? 'يرجى قراءة هذه الشروط قبل استخدام المنصة' : 'Please read these terms before using the platform'}
    >
      {isAr ? (
        <>
          <h2>1. قبول الشروط</h2>
          <p>
            باستخدامك لمنصة MRI، فإنك توافق على الالتزام بهذه الشروط وسياسة الخصوصية. التسجيل
            وتسجيل الدخول يتم عبر Pi Network (Pi Browser).
          </p>

          <h2>2. استخدام المنصة</h2>
          <p>
            المنصة مخصصة للأغراض الطبية والاستشارية المشروعة: حجز المواعيد، الاستشارات الفورية،
            والتواصل بين المرضى والأطباء والمنشآت. يُمنع نشر محتوى مضلل، انتحال الهوية، أو أي
            استخدام يخالف قوانين Pi Network أو القوانين المحلية.
          </p>

          <h2>3. حسابات المستخدمين</h2>
          <p>
            أنت مسؤول عن نشاط حسابك. قد يُجمّد المالك أو يُلغى توثيق الحساب عند مخالفة الشروط أو
            تأكيد شكوى.
          </p>

          <h2>4. المدفوعات عبر Pi Network</h2>
          <ul>
            <li>
              جميع المدفوعات داخل MRI (مواعيد، استشارات فورية، اشتراك البريميو للأطباء، الإعلانات)
              تتم حصرياً بعملة <strong>Pi (π)</strong> عبر Pi Browser ووفق آلية Pi App Platform
              (موافقة الخادم ثم إتمام على البلوك تشين).
            </li>
            <li>
              <strong>المواعيد والاستشارات:</strong> رسوم خدمة طبية — قد تُخصم عمولة منصة (5%) من
              مستحقات الطبيب.
            </li>
            <li>
              <strong>البريميو:</strong> اشتراك اختياري لتمييز ملف الطبيب/المنشأة — ليس علاجاً
              مباشراً.
            </li>
            <li>
              <strong>الإعلانات:</strong> رسوم نشر إعلان على المنصة — تخضع لمراجعة الإدارة قبل
              الظهور.
            </li>
            <li>
              لا تُسلَّم الخدمة المدفوعة إلا بعد تأكيد الدفع من الخادم (complete). إلغاء الدفع من
              محفظة Pi قبل الإتمام يُلغي العملية.
            </li>
          </ul>

          <h2>5. الاسترداد والرصيد الداخلي</h2>
          <p>
            استردادات الاستشارة الفورية (عند الرفض أو انتهاء المهلة): الجزء المدفوع من{' '}
            <strong>محفظة Pi</strong> يُحوَّل إلى محفظتك عبر Pi Network (App-to-User)؛ الجزء
            المدفوع من <strong>رصيد المنصة</strong> (piCreditBalance) يُعاد إلى رصيدك الداخلي.
            سحب مستحقات الأطباء إلى محفظة Pi يتم عبر طلب سحب وموافقة الإدارة (App-to-User).
          </p>

          <h2>6. سياسات الإلغاء</h2>
          <p>
            سياسات الإلغاء والدفع (مقدم، كامل، أو بعد الخدمة) تخضع لإعدادات الطبيب أو المنشأة
            المعنية ضمن ما تتيحه المنصة.
          </p>

          <h2>7. التعديلات</h2>
          <p>قد نحدّث هذه الشروط. استمرارك في الاستخدام يعني موافقتك على النسخة المحدّثة.</p>
        </>
      ) : (
        <>
          <h2>1. Acceptance</h2>
          <p>
            By using MRI you agree to these terms and our privacy policy. Sign-in and registration
            are via Pi Network (Pi Browser).
          </p>

          <h2>2. Platform Use</h2>
          <p>
            MRI is for legitimate medical and consultation purposes. Misleading content,
            impersonation, or uses that violate Pi Network policies are prohibited.
          </p>

          <h2>3. Accounts</h2>
          <p>
            You are responsible for activity on your account. The owner may suspend or revoke
            verification for violations or confirmed reports.
          </p>

          <h2>4. Pi Network Payments</h2>
          <ul>
            <li>
              All in-app payments (appointments, instant consults, Premio subscriptions, ads) use
              <strong> Pi (π)</strong> only, through Pi Browser with server approve/complete.
            </li>
            <li>Appointments and consults are medical service fees; a platform fee may apply.</li>
            <li>Premio is optional doctor/facility visibility — not direct treatment.</li>
            <li>Paid ads require admin review before publication.</li>
            <li>Paid services are delivered only after server-confirmed completion.</li>
          </ul>

          <h2>5. Refunds &amp; Internal Balance</h2>
          <p>
            Instant consult refunds (rejection or timeout): amounts paid from your{' '}
            <strong>Pi wallet</strong> are returned via App-to-User transfer; amounts paid from{' '}
            <strong>in-app balance</strong> (piCreditBalance) return to that balance. Doctor payouts
            to Pi wallets use approved App-to-User withdrawals.
          </p>

          <h2>6. Cancellation</h2>
          <p>Per-doctor or facility payment policies apply where supported.</p>

          <h2>7. Changes</h2>
          <p>We may update these terms. Continued use means acceptance.</p>
        </>
      )}
    </LegalPageLayout>
  )
}
