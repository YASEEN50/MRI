'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import OwnerSubpageLayout from '@/components/owner/OwnerSubpageLayout'

interface RefundRow {
  id: string
  amount: number
  creditRefund: number
  status: string
  piPaymentId: string | null
  toAddress: string | null
  txHash: string | null
  instantConsultId: string | null
  piUsername: string | null
  createdAt: string
  patientContact?: string
}

export default function OwnerPatientRefundsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [rows, setRows] = useState<RefundRow[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [txInputs, setTxInputs] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/patient-refunds')
      const data = await res.json()
      setRows(data.data ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
    if (status === 'authenticated' && session?.user?.role !== 'OWNER' && session?.user?.role !== 'ADMIN') {
      router.push('/unauthorized')
    }
  }, [status, session, router])

  useEffect(() => {
    if (status === 'authenticated') void load()
  }, [status, load])

  async function complete(transactionId: string) {
    const txHash = txInputs[transactionId]?.trim()
    if (!txHash) {
      setMsg('❌ أدخل txid من البلوكشين')
      return
    }
    setBusy(transactionId)
    setMsg('')
    const res = await fetch('/api/admin/patient-refunds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionId, txHash }),
    })
    const data = await res.json()
    if (!data.success || data.data?.error) {
      setMsg(`❌ ${data.data?.message ?? 'فشل'}`)
    } else {
      setMsg('✅ تم تأكيد استرداد المريض')
    }
    await load()
    setBusy(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <OwnerSubpageLayout
      title="↩️ استردادات المرضى (A2U)"
      subtitle="تحويل π المستردة من محفظة التطبيق إلى محفظة المريض"
    >
      <div className="mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-sm text-blue-100">
        <p className="font-medium mb-1">متى تظهر هنا؟</p>
        <p className="text-xs text-blue-200/90">
          عند رفض استشارة فورية أو انتهاء المهلة — الجزء المدفوع من محفظة Pi يُحوَّل A2U. في
          Sandbox يتم تلقائياً؛ في Production أرسل π من محفظة التطبيق ثم أدخل txid.
        </p>
      </div>

      {msg && (
        <p className={`mb-4 text-sm ${msg.startsWith('❌') ? 'text-red-400' : 'text-emerald-400'}`}>
          {msg}
        </p>
      )}

      <p className="text-slate-400 text-sm mb-4">{rows.length} استرداد بانتظار txid</p>

      {rows.length === 0 ? (
        <p className="text-slate-500 text-center py-12">لا توجد استردادات معلّقة</p>
      ) : (
        <div className="space-y-4">
          {rows.map((r) => (
            <div key={r.id} className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
              <div className="flex flex-wrap justify-between gap-2 mb-2">
                <div>
                  <p className="text-white font-medium">
                    @{r.piUsername ?? r.patientContact ?? 'مريض'}
                  </p>
                  <p className="text-slate-500 text-xs">{new Date(r.createdAt).toLocaleString('ar-SA')}</p>
                </div>
                <p className="text-emerald-400 font-semibold">{r.amount.toFixed(4)} π → محفظة</p>
              </div>
              {r.creditRefund > 0 && (
                <p className="text-slate-400 text-xs mb-2">
                  + {r.creditRefund.toFixed(4)} π أُضيفت لرصيد المنصة تلقائياً
                </p>
              )}
              {r.piPaymentId && (
                <p className="text-slate-500 text-xs mb-1 break-all">Pi payment: {r.piPaymentId}</p>
              )}
              {r.toAddress && (
                <p className="text-slate-500 text-xs mb-2 break-all">→ {r.toAddress}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                <input
                  type="text"
                  placeholder="txid من البلوكشين"
                  value={txInputs[r.id] ?? ''}
                  onChange={(e) => setTxInputs((s) => ({ ...s, [r.id]: e.target.value }))}
                  className="flex-1 min-w-[200px] bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
                />
                <button
                  onClick={() => complete(r.id)}
                  disabled={busy === r.id}
                  className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 rounded-xl text-sm disabled:opacity-50"
                >
                  {busy === r.id ? '...' : 'تأكيد التحويل'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </OwnerSubpageLayout>
  )
}
