'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import DashboardShell from '@/components/dashboard/DashboardShell'
import { SUPPORT_CATEGORY_LABELS, SUPPORT_STATUS_LABELS } from '@/lib/support/constants'

interface Message {
  id: string
  body: string
  isStaffReply: boolean
  createdAt: string
  sender: { piUsername?: string | null; email?: string | null; role?: string }
}

interface TicketDetail {
  id: string
  subject: string
  category: keyof typeof SUPPORT_CATEGORY_LABELS
  status: keyof typeof SUPPORT_STATUS_LABELS
  priority: string
  messages: Message[]
  user?: { piUsername?: string | null; role?: string }
}

export default function SupportTicketPage() {
  const { status, data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const isStaff = ['OWNER', 'ADMIN'].includes(session?.user?.role ?? '')

  const [ticket, setTicket] = useState<TicketDetail | null>(null)
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await fetch(`/api/support/tickets/${id}`)
      const json = await res.json()
      if (json.data?.error) {
        setErr(json.data.message)
        return
      }
      setTicket(json.data)
    } catch {
      setErr('تعذّر تحميل التذكرة')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
    if (status === 'authenticated') void load()
  }, [status, router, load])

  async function sendReply() {
    if (!reply.trim()) return
    setSaving(true)
    setErr('')
    try {
      const res = await fetch(`/api/support/tickets/${id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: reply }),
      })
      const json = await res.json()
      if (json.data?.error) {
        setErr(json.data.message)
        return
      }
      setReply('')
      void load()
    } catch {
      setErr('فشل إرسال الرد')
    } finally {
      setSaving(false)
    }
  }

  async function updateStatus(newStatus: string) {
    await fetch(`/api/support/tickets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    void load()
  }

  const closed = ticket?.status === 'CLOSED' || ticket?.status === 'RESOLVED'

  return (
    <DashboardShell>
      <div className="max-w-2xl mx-auto px-4 py-8" dir="rtl">
        <Link href="/dashboard/support" className="text-slate-500 text-sm hover:text-white">
          ← العودة للتذاكر
        </Link>

        {loading ? (
          <p className="text-slate-400 mt-6">جاري التحميل...</p>
        ) : !ticket ? (
          <p className="text-red-400 mt-6">{err || 'التذكرة غير موجودة'}</p>
        ) : (
          <>
            <div className="mt-4 mb-6">
              <h1 className="text-xl font-bold text-white">{ticket.subject}</h1>
              <p className="text-slate-400 text-sm mt-1">
                {SUPPORT_CATEGORY_LABELS[ticket.category]} · {SUPPORT_STATUS_LABELS[ticket.status]}
              </p>
              {isStaff && ticket.user && (
                <p className="text-slate-500 text-xs mt-1">@{ticket.user.piUsername ?? 'مستخدم'}</p>
              )}
            </div>

            {isStaff && (
              <div className="flex flex-wrap gap-2 mb-4">
                {['WAITING_USER', 'RESOLVED', 'CLOSED'].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void updateStatus(s)}
                    className="px-3 py-1 text-xs rounded-lg border border-slate-700 text-slate-300 hover:border-primary"
                  >
                    {SUPPORT_STATUS_LABELS[s as keyof typeof SUPPORT_STATUS_LABELS]}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-3 mb-6">
              {ticket.messages.map(m => (
                <div
                  key={m.id}
                  className={`p-4 rounded-xl border ${
                    m.isStaffReply
                      ? 'bg-primary/10 border-primary/30 ml-0 mr-4'
                      : 'bg-slate-900/80 border-slate-700 mr-0 ml-4'
                  }`}
                >
                  <p className="text-white text-sm whitespace-pre-wrap">{m.body}</p>
                  <p className="text-slate-500 text-xs mt-2">
                    {m.isStaffReply ? 'فريق الدعم' : (m.sender.piUsername ? `@${m.sender.piUsername}` : 'أنت')}
                    {' · '}
                    {new Date(m.createdAt).toLocaleString('ar-SA')}
                  </p>
                </div>
              ))}
            </div>

            {!closed && (
              <div className="mpi-card p-4 space-y-3">
                <textarea
                  className="w-full rounded-lg bg-slate-900 border border-slate-700 text-white p-3 min-h-[100px]"
                  placeholder="اكتب ردك..."
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                />
                {err && <p className="text-red-400 text-sm">{err}</p>}
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void sendReply()}
                  className="px-4 py-2 rounded-lg bg-primary text-white disabled:opacity-50"
                >
                  {saving ? 'جاري الإرسال...' : 'إرسال'}
                </button>
              </div>
            )}

            {!isStaff && !closed && (
              <button
                type="button"
                onClick={() => void updateStatus('CLOSED')}
                className="mt-4 text-slate-500 text-sm hover:text-white"
              >
                إغلاق التذكرة
              </button>
            )}
          </>
        )}
      </div>
    </DashboardShell>
  )
}
