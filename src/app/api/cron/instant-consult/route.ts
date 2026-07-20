import { NextRequest, NextResponse } from 'next/server'
import { expireStaleInstantConsults, finalizeExpiredInstantSessions } from '@/lib/instant-consult/service'
import { requireEnv } from '@/lib/env'

/** Manual or external scheduler endpoint (not in vercel.json — Hobby allows daily crons only). */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const secret = requireEnv('CRON_SECRET')

  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await expireStaleInstantConsults()
    const completed = await finalizeExpiredInstantSessions()
    return NextResponse.json({ success: true, completedSessions: completed })
  } catch (err) {
    console.error('[Cron/instant-consult]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
