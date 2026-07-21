import { NextResponse } from 'next/server'
import { AppError } from '@/core/errors'
import { ZodError } from 'zod'
import { captureMonitoringException } from '@/lib/monitoring/capture'

export interface ApiMeta {
  total?: number; page?: number; limit?: number
  [key: string]: unknown
}

export function ok<T>(data: T, meta?: ApiMeta) {
  return NextResponse.json({ success: true, data, ...(meta && { meta }) }, { status: 200 })
}

export function created<T>(data: T) {
  return NextResponse.json({ success: true, data }, { status: 201 })
}

export function fromAppError(error: AppError) {
  return NextResponse.json(
    { success: false, error: { code: error.code, message: error.message } },
    { status: error.statusCode }
  )
}

export function serverError(message = 'حدث خطأ داخلي في النظام', cause?: unknown) {
  if (cause !== undefined) {
    captureMonitoringException(cause, { apiMessage: message })
  }
  return NextResponse.json(
    { success: false, error: { code: 'INTERNAL_ERROR', message } },
    { status: 500 }
  )
}

export function parseBody<T>(
  schema: { safeParse: (data: unknown) => { success: boolean; data?: T; error?: ZodError } },
  body: unknown
): { success: true; data: T } | { success: false; response: ReturnType<typeof NextResponse.json> } {
  const result = schema.safeParse(body)
  if (!result.success || result.data === undefined) {
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'بيانات غير صحيحة' } },
        { status: 400 }
      ),
    }
  }
  return { success: true, data: result.data }
}

export function fromZodError(error: ZodError) {
  return NextResponse.json(
    { success: false, error: { code: 'VALIDATION_ERROR', message: 'بيانات غير صحيحة', fields: error.flatten().fieldErrors } },
    { status: 400 }
  )
}

/** Standard 4xx client error (replaces legacy ok({ error: true, message })). */
export function fail(
  message: string,
  options?: { code?: string; status?: number; extra?: Record<string, unknown> },
) {
  return NextResponse.json(
    {
      success: false,
      error: { code: options?.code ?? 'REQUEST_FAILED', message },
      ...(options?.extra ? { data: options.extra } : {}),
    },
    { status: options?.status ?? 400 },
  )
}

export function badRequest(message = 'بيانات غير صحيحة', code = 'VALIDATION_ERROR') {
  return fail(message, { code, status: 400 })
}

export function unauthorized(message = 'يجب تسجيل الدخول أولاً') {
  return fail(message, { code: 'UNAUTHORIZED', status: 401 })
}

export function forbidden(message = 'غير مصرح') {
  return fail(message, { code: 'FORBIDDEN', status: 403 })
}

export function notFound(message = 'غير موجود') {
  return fail(message, { code: 'NOT_FOUND', status: 404 })
}

export function conflict(message: string, extra?: Record<string, unknown>) {
  return fail(message, { code: 'CONFLICT', status: 409, extra })
}

export function serviceUnavailable(message: string) {
  return fail(message, { code: 'SERVICE_UNAVAILABLE', status: 503 })
}
