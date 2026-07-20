// src/app/api/onboarding/client/route.ts
import { NextRequest } from 'next/server'
import { requireAuth } from '@/infrastructure/auth/providers/role-guard'
import { prisma } from '@/lib/prisma'
import { ok, fromAppError, serverError } from '@/lib/api-response'
import { Role } from '@prisma/client'
import { PATIENT_CAPABLE_ROLES } from '@/lib/client/patient-access'
import { z } from 'zod'

const Schema = z.object({
  fullName: z.string().min(2),
  phone:    z.string().min(9),
  gender:   z.enum(['MALE', 'FEMALE']),
  dateOfBirth: z.string().optional(),
  city:     z.string().optional(),
  country:  z.string().length(2).optional().default('SA'),
})

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth({ roles: PATIENT_CAPABLE_ROLES })
    if (!auth.success) return fromAppError(auth.error)

    const body   = await req.json()
    const parsed = Schema.safeParse(body)
    if (!parsed.success) return ok({ error: true, message: 'بيانات غير صحيحة' })

    const { fullName, phone, gender, dateOfBirth, city, country } = parsed.data
    const userId = auth.context.userId

    // تقسيم الاسم الكامل
    const parts     = fullName.trim().split(' ')
    const firstName = parts[0]
    const lastName  = parts.slice(1).join(' ') || ''

    // إنشاء أو تحديث الـ clientProfile
    await prisma.clientProfile.upsert({
      where: { userId },
      update: {
        firstName,
        lastName,
        phone,
        gender,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        city,
        country,
      },
      create: {
        userId,
        firstName,
        lastName,
        phone,
        gender,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        city,
        country,
        allergies: [],
        chronicDiseases: [],
      },
    })

    return ok({ message: 'تم إكمال الملف الشخصي بنجاح' })
  } catch (err) {
    console.error('[POST /api/onboarding/client]', err)
    return serverError()
  }
}
