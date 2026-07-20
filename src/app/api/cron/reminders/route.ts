// src/app/api/cron/reminders/route.ts
// vercel.json: { "crons": [{ "path": "/api/cron/reminders", "schedule": "0 8 * * *" }] }
// Hobby plan: cron may run once per day only.

import { NextRequest, NextResponse } from 'next/server'
import { processDueReminders } from '@/lib/cron/reminders.service'
import {
  expireStaleInstantConsults,
  finalizeExpiredInstantSessions,
} from '@/lib/instant-consult/service'
import { requireEnv } from '@/lib/env'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const secret     = requireEnv('CRON_SECRET')

  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await processDueReminders()
    await expireStaleInstantConsults()
    const completedSessions = await finalizeExpiredInstantSessions()
    console.log('[Cron/Reminders]', result, { completedSessions })
    return NextResponse.json({ success: true, ...result, completedSessions })
  } catch (err) {
    console.error('[Cron/Reminders] Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
