'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthLayout, AuthFooterLink } from '@/components/auth/AuthLayout'
import { signInWithPiNetwork } from '@/lib/pi/pi-auth-client'

type Role = 'CLIENT' | 'DOCTOR' | 'FACILITY'

const roles: { value: Role; label: string; description: string; icon: string }[] = [
  { value: 'CLIENT', label: 'مريض / عميل', description: 'حجز مواعيد واستشارات', icon: '👤' },
  { value: 'DOCTOR', label: 'طبيب', description: 'تقديم الخدمات الطبية', icon: '👨‍⚕️' },
  { value: 'FACILITY', label: 'منشأة', description: 'مركز طبي أو مختبر', icon: '🏥' },
]

export default function PiRegisterForm() {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<Role>('CLIENT')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handlePiRegister() {
    setLoading(true)
    setError('')

    const result = await signInWithPiNetwork('/', { roleOnCreate: selectedRole })
    setLoading(false)

    if (!result.ok) {
      setError(result.error ?? 'فشل إنشاء الحساب')
      return
    }

    if (!result.redirectPath) {
      router.refresh()
    }
  }

  return (
    <AuthLayout
      subtitle="انضم إلى MRI · Pi Network"
      cardTitle="إنشاء حساب"
      hint="اختر نوع حسابك ثم وافق على المصادقة في Pi Browser"
      error={error}
      footer={
        <AuthFooterLink href="/login">
          لديك حساب؟ <strong style={{ color: 'var(--pi-accent)' }}>تسجيل الدخول بـ Pi</strong>
        </AuthFooterLink>
      }
    >
      <div className="space-y-3 mb-6">
        {roles.map(role => (
          <button
            key={role.value}
            type="button"
            onClick={() => setSelectedRole(role.value)}
            className={`w-full flex items-center gap-3 p-4 rounded-xl border text-right transition-all ${
              selectedRole === role.value
                ? 'border-primary/50 bg-primary/10'
                : 'border-white/10 bg-white/[0.03] hover:border-white/20'
            }`}
          >
            <span className="text-2xl" aria-hidden>{role.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm">{role.label}</p>
              <p className="text-slate-500 text-xs">{role.description}</p>
            </div>
            {selectedRole === role.value && (
              <span className="text-accent text-sm shrink-0">✓</span>
            )}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => void handlePiRegister()}
        disabled={loading}
        className="pi-auth-btn pi-auth-btn-pi w-full"
      >
        {loading ? (
          <>
            <span className="pi-auth-spinner" /> جاري إنشاء الحساب...
          </>
        ) : (
          <>🟣 إنشاء حساب بـ Pi Network</>
        )}
      </button>

      <p className="text-slate-500 text-xs text-center mt-4 leading-relaxed">
        إذا كان حساب Pi مرتبطاً مسبقاً، سيتم تسجيل دخولك مباشرة
      </p>
    </AuthLayout>
  )
}
