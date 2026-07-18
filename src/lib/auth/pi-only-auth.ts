import { ForbiddenError } from '@/core/errors'
import { fromAppError, ok } from '@/lib/api-response'

/** MRI uses Pi Network as the sole sign-in and sign-up method. */
export const PI_ONLY_AUTH = true

export const PI_ONLY_AUTH_MESSAGE =
  'التسجيل وتسجيل الدخول متاحان فقط عبر Pi Network'

export function emailAuthDisabledResponse() {
  return fromAppError(new ForbiddenError(PI_ONLY_AUTH_MESSAGE))
}

export function emailAuthDisabledOk() {
  return ok({ error: true, code: 'EMAIL_AUTH_DISABLED', message: PI_ONLY_AUTH_MESSAGE })
}
