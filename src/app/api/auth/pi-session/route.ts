import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { ok, fromZodError, serverError } from '@/lib/api-response'
import { establishPiSession, PiSessionBodySchema } from '@/lib/auth/pi-session'
import { sessionCookieName, sessionCookieOptions, SESSION_MAX_AGE_SEC } from '@/lib/auth/cookie-options'
import { appendClearGuestModeCookie } from '@/lib/auth/clear-session-cookies'
import { enforceAuthRateLimit } from '@/lib/auth/enforce-auth-rate-limit'

export async function POST(req: NextRequest) {
  try {
    const limited = await enforceAuthRateLimit(req, 'pi-session')
    if (limited) return limited

    const body = await req.json()
    const parsed = PiSessionBodySchema.safeParse(body)
    if (!parsed.success) return fromZodError(parsed.error)

    const result = await establishPiSession(parsed.data.accessToken, {
      roleOnCreate: parsed.data.role,
    })
    if (!result.ok) {
      return NextResponse.json(
        { success: false, data: { error: true, code: result.code, message: result.message } },
        { status: result.status },
      )
    }

    const cookieStore = await cookies()
    cookieStore.set(
      sessionCookieName(),
      result.encodedToken,
      sessionCookieOptions(SESSION_MAX_AGE_SEC),
    )

    return appendClearGuestModeCookie(
      ok({
        userId: result.user.id,
        role: result.user.role,
        isProfileComplete: result.user.isProfileComplete,
        piUsername: result.user.piUsername,
        redirectPath: result.redirectPath,
        mfaRequired: result.mfaRequired,
      }) as NextResponse,
    )
  } catch (err) {
    console.error('[POST /api/auth/pi-session]', err)
    return serverError()
  }
}
