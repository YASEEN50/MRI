// src/app/api/onboarding/facility/route.ts
import { NextRequest } from 'next/server'
import { requireAuth } from '@/infrastructure/auth/providers/role-guard'
import { prisma } from '@/lib/prisma'
import { ok, fromAppError, serverError } from '@/lib/api-response'
import { ApprovalStatus, FacilityType, Role } from '@prisma/client'
import { z } from 'zod'

const Schema = z.object({
  name:          z.string().min(2),
  type:          z.nativeEnum(FacilityType),
  phone:         z.string().min(9),
  licenseNumber: z.string().min(3),
  city:          z.string().min(1),
  country:       z.string().length(2).optional().default('SA'),
  address:       z.string().optional(),
  description:   z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth({ roles: [Role.FACILITY] })
    if (!auth.success) return fromAppError(auth.error)

    const body   = await req.json()
    const parsed = Schema.safeParse(body)
    if (!parsed.success) return ok({ error: true, message: 'بيانات غير صحيحة' })

    const data   = parsed.data
    const userId = auth.context.userId

    const existingProfile = await prisma.facilityProfile.findUnique({
      where: { userId },
      select: { approvalStatus: true },
    })
    if (existingProfile?.approvalStatus === ApprovalStatus.APPROVED) {
      return ok({ error: true, message: 'حساب المنشأة معتمد — لا يمكن إعادة تقديم طلب التحقق' })
    }

    // تحقق أن licenseNumber غير مستخدم
    const existingLicense = await prisma.facilityProfile.findFirst({
      where: { licenseNumber: data.licenseNumber, userId: { not: userId } },
      select: { id: true },
    })
    if (existingLicense) return ok({ error: true, message: 'رقم الترخيص مستخدم مسبقاً' })

    await prisma.facilityProfile.upsert({
      where: { userId },
      update: {
        name:          data.name,
        type:          data.type,
        phone:         data.phone,
        licenseNumber: data.licenseNumber,
        city:          data.city,
        country:       data.country,
        address:       data.address ?? '',
        description:   data.description,
      },
      create: {
        userId,
        name:           data.name,
        type:           data.type,
        phone:          data.phone,
        licenseNumber:  data.licenseNumber,
        licenseDocUrl:  '', // سيُرفع لاحقاً
        city:           data.city,
        address:        data.address ?? '',
        description:    data.description,
        approvalStatus: ApprovalStatus.PENDING,
        country:        data.country,
      },
    })

    console.log('[onboarding/facility] facility profile saved', { userId, licenseNumber: data.licenseNumber })
    return ok({ message: 'تم إرسال طلبك بنجاح، في انتظار المراجعة' })
  } catch (err) {
    console.error('[POST /api/onboarding/facility]', err)
    return serverError()
  }
}
