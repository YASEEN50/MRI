'use client'

import Link from 'next/link'

export const PI_REFUND_DISCLOSURE_AR =
  'استردادات الاستشارة الفورية (عند الرفض أو انتهاء المهلة): الجزء المدفوع من محفظة Pi يُرجَع إلى محفظتك (A2U)؛ الجزء من رصيد المنصة يُعاد إلى رصيدك الداخلي.'

export const PI_REFUND_DISCLOSURE_EN =
  'Instant consult refunds (rejection or timeout): Pi wallet payments return to your Pi wallet (A2U); platform credit returns to your in-app balance.'

interface PiPaymentConsentProps {
  checked: boolean
  onCheckedChange: (value: boolean) => void
  amount?: number
  serviceLabel?: string
  showRefundNote?: boolean
  locale?: 'ar' | 'en'
}

export default function PiPaymentConsent({
  checked,
  onCheckedChange,
  amount,
  serviceLabel,
  showRefundNote = false,
  locale = 'ar',
}: PiPaymentConsentProps) {
  const isAr = locale === 'ar'
  const amountText =
    amount != null && amount > 0 ? `${amount.toFixed(4)} π` : ''

  return (
    <div className="space-y-2 rounded-xl border border-purple-500/20 bg-purple-500/5 px-3 py-3">
      {showRefundNote && (
        <p className="text-slate-400 text-xs leading-relaxed">
          {isAr ? PI_REFUND_DISCLOSURE_AR : PI_REFUND_DISCLOSURE_EN}
        </p>
      )}
      <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-300 leading-relaxed">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onCheckedChange(e.target.checked)}
          className="mt-0.5 rounded border-white/20"
        />
        <span>
          {isAr ? (
            <>
              أوافق على الدفع{amountText ? ` بمبلغ ${amountText}` : ''}
              {serviceLabel ? ` مقابل ${serviceLabel}` : ''} عبر{' '}
              <strong className="text-purple-300">Pi Network</strong>، وأقر بأن المعاملة نهائية على
              البلوك تشين بعد التأكيد. راجع{' '}
              <Link href="/terms" className="text-emerald-400 hover:underline">
                الشروط
              </Link>{' '}
              و{' '}
              <Link href="/privacy" className="text-emerald-400 hover:underline">
                الخصوصية
              </Link>
              .
            </>
          ) : (
            <>
              I agree to pay{amountText ? ` ${amountText}` : ''}
              {serviceLabel ? ` for ${serviceLabel}` : ''} via{' '}
              <strong className="text-purple-300">Pi Network</strong>. See{' '}
              <Link href="/terms" className="text-emerald-400 hover:underline">
                Terms
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-emerald-400 hover:underline">
                Privacy
              </Link>
              .
            </>
          )}
        </span>
      </label>
    </div>
  )
}
