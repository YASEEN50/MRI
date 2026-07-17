'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { authenticateWithPi } from '@/lib/pi/pi-auth-client'

export default function AccountLinkingCard({
  piUsername,
  piUid,
}: {
  userEmail?: string | null
  piUsername?: string | null
  piUid?: string | null
}) {
  const { update } = useSession()
  const [linking, setLinking] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const hasPi = !!piUid

  async function handleLinkPi() {
    setLinking(true)
    setMessage(null)
    try {
      const auth = await authenticateWithPi()
      const res = await fetch('/api/auth/link-pi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ accessToken: auth.accessToken }),
      })
      const data = await res.json()
      if (!data.success || data.data?.error) {
        throw new Error(data.data?.message || 'فشل ربط حساب Pi')
      }
      await update({ refreshProfile: true })
      setMessage({ type: 'success', text: data.data?.message ?? 'تم ربط Pi بنجاح' })
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'فشل ربط حساب Pi',
      })
    } finally {
      setLinking(false)
    }
  }

  if (hasPi) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5">
        <h3 className="text-emerald-400 font-semibold mb-1">حساب Pi متصل ✓</h3>
        <p className="text-slate-400 text-sm">
          تسجيل الدخول عبر Pi Network{' '}
          <strong className="text-purple-400">@{piUsername}</strong>
        </p>
      </div>
    )
  }

  return (
    <div className="bg-purple-500/5 border border-purple-500/20 rounded-2xl p-5">
      <h3 className="text-white font-semibold mb-1">ربط Pi Network 🔗</h3>
      <p className="text-slate-400 text-sm mb-4">
        اربط حساب Pi Network لتسجيل الدخول في MRI.
      </p>

      {message && (
        <div
          className={`mb-4 px-3 py-2 rounded-xl text-xs font-medium ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      <button
        type="button"
        onClick={handleLinkPi}
        disabled={linking}
        className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-all"
      >
        {linking ? 'جاري الربط بـ Pi...' : 'π ربط حساب Pi Network'}
      </button>
    </div>
  )
}
