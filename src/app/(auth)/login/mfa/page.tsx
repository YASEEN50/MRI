'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { AuthLayout } from '@/components/auth/AuthLayout'

export default function MfaLoginPage() {
  const router = useRouter()
  const { data: session, status, update } = useSession()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login')
      return
    }
    if (status === 'authenticated' && session?.user?.mfaVerified) {
      router.replace(session.user.role === 'OWNER' ? '/owner' : '/admin')
    }
  }, [status, session, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/mfa/verify-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()
      const inner = data.data

      if (!data.success || inner?.error) {
        setError(inner?.message ?? 'رمز غير صحيح')
        return
      }

      await update({ mfaVerified: true })
      router.push(inner.redirectPath ?? '/admin')
      router.refresh()
    } catch {
      setError('حدث خطأ، حاول مرة أخرى')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <AuthLayout
      subtitle="تحقق ثنائي · Pi Network"
      cardTitle="التحقق الثنائي"
      hint="أدخل رمز Google Authenticator بعد تسجيل الدخول بـ Pi"
      error={error}
    >
      <form onSubmit={handleSubmit}>
        <label className="pi-auth-label" htmlFor="mfa-code">رمز MFA</label>
        <div className="pi-auth-input-wrap">
          <input
            id="mfa-code"
            className="pi-auth-input"
            type="text"
            inputMode="numeric"
            maxLength={16}
            value={code}
            onChange={e => setCode(e.target.value.replace(/\s/g, ''))}
            placeholder="123456"
            required
            dir="ltr"
            autoComplete="one-time-code"
          />
        </div>
        <button
          type="submit"
          className="pi-auth-btn pi-auth-btn-pi"
          disabled={loading || code.length < 6}
        >
          {loading ? (
            <>
              <span className="pi-auth-spinner" /> جاري التحقق...
            </>
          ) : (
            'تأكيد الدخول'
          )}
        </button>
      </form>
    </AuthLayout>
  )
}
