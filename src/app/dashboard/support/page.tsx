'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import DashboardShell from '@/components/dashboard/DashboardShell'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { SUPPORT_CATEGORY_LABELS, SUPPORT_STATUS_LABELS } from '@/lib/support/constants'

const CATEGORIES = Object.keys(SUPPORT_CATEGORY_LABELS) as (keyof typeof SUPPORT_CATEGORY_LABELS)[]

const CATEGORY_ICONS: Record<keyof typeof SUPPORT_CATEGORY_LABELS, string> = {
  ACCOUNT: '👤',
  PAYMENT: 'π',
  VERIFICATION: '✅',
  APPOINTMENT: '📅',
  TECHNICAL: '🔧',
  OTHER: '💬',
}

const STATUS_COLORS: Record<keyof typeof SUPPORT_STATUS_LABELS, string> = {
  OPEN: '#6366f1',
  WAITING_USER: '#f59e0b',
  WAITING_SUPPORT: '#22d3ee',
  RESOLVED: '#10b981',
  CLOSED: '#64748b',
}

interface TicketRow {
  id: string
  category: keyof typeof SUPPORT_CATEGORY_LABELS
  subject: string
  status: keyof typeof SUPPORT_STATUS_LABELS
  createdAt: string
  user?: { piUsername?: string | null; email?: string | null; role?: string }
  lastMessage?: { body: string }
}

export default function SupportPage() {
  const { session, isLoading, isAuthenticated } = useRequireAuth()
  const router = useRouter()
  const isStaff = ['OWNER', 'ADMIN'].includes(session?.user?.role ?? '')

  const [tickets, setTickets] = useState<TicketRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ category: 'OTHER', subject: '', body: '' })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const q = filter === 'all' ? '' : `?status=${filter}`
      const res = await fetch(`/api/support/tickets${q}`)
      const json = await res.json()
      setTickets(json.data ?? [])
    } catch {
      setErr('تعذّر تحميل التذاكر')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    if (isLoading || !isAuthenticated) return
    void load()
  }, [isLoading, isAuthenticated, load])

  async function createTicket() {
    if (!form.subject.trim() || !form.body.trim()) return
    setSaving(true)
    setErr('')
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (json.data?.error) {
        setErr(json.data.message ?? 'فشل الإرسال')
        return
      }
      const id = json.data?.id
      setShowForm(false)
      setForm({ category: 'OTHER', subject: '', body: '' })
      if (id) router.push(`/dashboard/support/${id}`)
      else void load()
    } catch {
      setErr('فشل إنشاء التذكرة')
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardShell>
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <div className="max-w-5xl mx-auto px-4 py-8" dir="rtl">
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-white">🎫 الدعم الفني</h1>
            <p className="text-slate-400 text-sm mt-1">
              {isStaff ? 'إدارة تذاكر المستخدمين والرد عليها' : 'تواصل مع فريق الدعم داخل المنصة'}
            </p>
          </div>
          {!isStaff && (
            <button
              type="button"
              onClick={() => setShowForm(v => !v)}
              className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium"
            >
              + تذكرة جديدة
            </button>
          )}
        </div>

        {showForm && !isStaff && (
          <div className="mpi-card p-5 mb-6 space-y-4">
            <h2 className="text-white font-semibold">فتح تذكرة جديدة</h2>
            <select
              className="w-full rounded-lg bg-slate-900 border border-slate-700 text-white p-2"
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{SUPPORT_CATEGORY_LABELS[c]}</option>
              ))}
            </select>
            <input
              className="w-full rounded-lg bg-slate-900 border border-slate-700 text-white p-2"
              placeholder="موضوع مختصر"
              value={form.subject}
              onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
            />
            <textarea
              className="w-full rounded-lg bg-slate-900 border border-slate-700 text-white p-2 min-h-[120px]"
              placeholder="اشرح مشكلتك بالتفصيل..."
              value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
            />
            {err && <p className="text-red-400 text-sm">{err}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => void createTicket()}
                className="px-4 py-2 rounded-lg bg-primary text-white disabled:opacity-50"
              >
                {saving ? 'جاري الإرسال...' : 'إرسال'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 text-sm">
                إلغاء
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-6 flex-wrap">
          {['all', 'WAITING_SUPPORT', 'WAITING_USER', 'OPEN', 'RESOLVED', 'CLOSED'].map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                filter === s ? 'bg-primary/20 border-primary text-primary' : 'border-slate-700 text-slate-400 hover:border-slate-500'
              }`}
            >
              {s === 'all' ? 'الكل' : SUPPORT_STATUS_LABELS[s as keyof typeof SUPPORT_STATUS_LABELS]}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-slate-400 text-center py-12">جاري التحميل...</p>
        ) : tickets.length === 0 ? (
          <div className="mpi-card p-10 text-center text-slate-400">
            <p className="text-4xl mb-3">🎫</p>
            <p>{isStaff ? 'لا توجد تذاكر حالياً' : 'لا توجد تذاكر — افتح تذكرة جديدة للتواصل مع الدعم'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tickets.map(t => {
              const clr = STATUS_COLORS[t.status]
              return (
                <Link
                  key={t.id}
                  href={`/dashboard/support/${t.id}`}
                  className="block rounded-2xl p-5 transition-all hover:scale-[1.01] hover:shadow-lg"
                  style={{ background: `${clr}12`, border: `1px solid ${clr}35` }}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                      style={{ background: `${clr}20`, border: `1px solid ${clr}40` }}
                    >
                      {CATEGORY_ICONS[t.category]}
                    </div>
                    <span
                      className="text-xs px-2.5 py-1 rounded-full font-medium shrink-0"
                      style={{ background: `${clr}25`, color: clr }}
                    >
                      {SUPPORT_STATUS_LABELS[t.status]}
                    </span>
                  </div>
                  <p className="text-white font-semibold leading-snug mb-1">{t.subject}</p>
                  <p className="text-slate-500 text-xs mb-2">{SUPPORT_CATEGORY_LABELS[t.category]}</p>
                  {isStaff && t.user && (
                    <p className="text-slate-500 text-xs mb-2">
                      @{t.user.piUsername ?? t.user.email ?? 'مستخدم'} · {t.user.role}
                    </p>
                  )}
                  {t.lastMessage && (
                    <p className="text-slate-400 text-sm line-clamp-2 mb-3">{t.lastMessage.body}</p>
                  )}
                  <p className="text-slate-600 text-xs">
                    {new Date(t.createdAt).toLocaleDateString('ar-SA', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
