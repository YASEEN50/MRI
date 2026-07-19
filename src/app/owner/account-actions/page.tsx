'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import OwnerSubpageLayout from '@/components/owner/OwnerSubpageLayout'

type UserRow = {
  id: string
  email: string | null
  piUsername: string | null
  role: string
  isActive: boolean
  doctorProfile?: {
    id: string
    firstName: string
    lastName: string
    approvalStatus: string
  } | null
  facilityProfile?: {
    id: string
    name: string
    approvalStatus: string
  } | null
}

const roleLabel: Record<string, string> = {
  DOCTOR: '👨‍⚕️ طبيب',
  FACILITY: '🏥 منشأة',
  CLIENT: '👤 مريض',
  ADMIN: '🛡️ أدمن',
}

const approvalLabel: Record<string, string> = {
  APPROVED: '✅ موثّق',
  PENDING: '⏳ معلّق',
  DOCUMENTS_REVIEW: '📄 مراجعة وثائق',
  REJECTED: '❌ مرفوض',
}

export default function OwnerAccountActionsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserRow[]>([])
  const [selected, setSelected] = useState<UserRow | null>(null)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [acting, setActing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
    if (status === 'authenticated' && session?.user?.role !== 'OWNER') router.push('/unauthorized')
  }, [status, session, router])

  async function handleSearch() {
    if (query.trim().length < 2) return
    setLoading(true)
    setMessage(null)
    setSelected(null)
    try {
      const res = await fetch(`/api/owner/users/search?q=${encodeURIComponent(query.trim())}`)
      const data = await res.json()
      setResults(data.data ?? [])
    } finally {
      setLoading(false)
    }
  }

  async function runAction(action: 'suspend' | 'unsuspend' | 'revoke-verification') {
    if (!selected) return
    if ((action === 'suspend' || action === 'revoke-verification') && reason.trim().length < 3) {
      setMessage({ type: 'error', text: 'يرجى كتابة سبب (3 أحرف على الأقل)' })
      return
    }

    const labels = {
      suspend: 'تجميد',
      unsuspend: 'إلغاء التجميد',
      'revoke-verification': 'إلغاء التوثيق',
    }
    if (!confirm(`تأكيد ${labels[action]} للمستخدم المحدد؟`)) return

    setActing(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/owner/users/${selected.id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          action === 'unsuspend' ? { notes: reason || undefined } : { reason: reason.trim() },
        ),
      })
      const data = await res.json()
      if (data.success && !data.data?.error) {
        setMessage({ type: 'success', text: data.data?.message ?? 'تم بنجاح' })
        setReason('')
        await handleSearch()
        setSelected(prev => {
          if (!prev) return null
          const updated = results.find(u => u.id === prev.id)
          return updated ?? prev
        })
      } else {
        setMessage({ type: 'error', text: data.data?.message || 'حدث خطأ' })
      }
    } catch {
      setMessage({ type: 'error', text: 'حدث خطأ في الاتصال' })
    } finally {
      setActing(false)
    }
  }

  const displayName = (u: UserRow) =>
    u.doctorProfile
      ? `د. ${u.doctorProfile.firstName} ${u.doctorProfile.lastName}`
      : u.facilityProfile?.name
        ?? u.piUsername
          ? `@${u.piUsername}`
          : u.email
            ?? u.id.slice(0, 8)

  const verificationStatus = (u: UserRow) =>
    u.doctorProfile?.approvalStatus ?? u.facilityProfile?.approvalStatus ?? null

  const canRevoke = (u: UserRow) => verificationStatus(u) === 'APPROVED'

  return (
    <OwnerSubpageLayout
      title="إدارة الحسابات ⚖️"
      subtitle="تجميد حساب أو إلغاء توثيق طبيب/منشأة"
      maxWidth="4xl"
    >
      <Link href="/owner" className="text-slate-500 hover:text-slate-300 text-sm mb-4 inline-block">
        ← لوحة المالك
      </Link>

      {message && (
        <div
          className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 mb-6">
        <h3 className="text-white font-semibold mb-3">🔍 بحث عن مستخدم</h3>
        <p className="text-slate-400 text-xs mb-3">
          ابحث بالبريد، @piUsername، الاسم، أو اسم المنشأة
        </p>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="مثال: dr.ahmed أو @username"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/50"
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={loading || query.trim().length < 2}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white rounded-xl text-sm font-medium"
          >
            {loading ? '...' : 'بحث'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-2">
          {results.length === 0 && !loading && (
            <p className="text-slate-500 text-sm text-center py-8">لا نتائج — ابحث عن مستخدم</p>
          )}
          {results.map(u => (
            <button
              key={u.id}
              type="button"
              onClick={() => { setSelected(u); setReason('') }}
              className={`w-full text-right rounded-2xl p-4 border transition-all ${
                selected?.id === u.id
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.05]'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-white font-medium text-sm">{displayName(u)}</span>
                <span className="text-xs text-slate-400">{roleLabel[u.role] ?? u.role}</span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className={u.isActive ? 'text-emerald-400' : 'text-red-400'}>
                  {u.isActive ? '🟢 نشط' : '⛔ مجمّد'}
                </span>
                {verificationStatus(u) && (
                  <span className="text-slate-400">
                    {approvalLabel[verificationStatus(u)!] ?? verificationStatus(u)}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="sticky top-6">
          {selected ? (
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5">
              <h3 className="text-white font-semibold mb-4">إجراءات على: {displayName(selected)}</h3>

              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={3}
                placeholder="السبب (مطلوب للتجميد وإلغاء التوثيق) — مثال: حساب اختبار / شكوى مؤكدة"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm mb-4 focus:outline-none focus:border-emerald-500/50 resize-none"
              />

              <div className="space-y-2">
                {selected.isActive ? (
                  <button
                    type="button"
                    disabled={acting}
                    onClick={() => runAction('suspend')}
                    className="w-full py-3 rounded-xl text-sm font-semibold bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 disabled:opacity-50"
                  >
                    ⛔ تجميد الحساب
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={acting}
                    onClick={() => runAction('unsuspend')}
                    className="w-full py-3 rounded-xl text-sm font-semibold bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-50"
                  >
                    ✅ إلغاء التجميد
                  </button>
                )}

                {canRevoke(selected) && (
                  <button
                    type="button"
                    disabled={acting}
                    onClick={() => runAction('revoke-verification')}
                    className="w-full py-3 rounded-xl text-sm font-semibold bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:bg-amber-500/30 disabled:opacity-50"
                  >
                    🚫 إلغاء التوثيق
                  </button>
                )}
              </div>

              <p className="text-slate-500 text-xs mt-4 leading-relaxed">
                التجميد يمنع تسجيل الدخول. إلغاء التوثيق يزيل الطبيب/المنشأة من القوائم العامة
                دون حذف الحساب — مفيد بعد حسابات الاختبار.
              </p>
            </div>
          ) : (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-8 text-center">
              <p className="text-slate-400 text-sm">اختر مستخدماً من نتائج البحث</p>
            </div>
          )}
        </div>
      </div>
    </OwnerSubpageLayout>
  )
}
