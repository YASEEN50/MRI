// src/app/api/chat/route.ts
import { NextRequest } from 'next/server'
import { requireAuth, requirePatientAuth } from '@/infrastructure/auth/providers/role-guard'
import { prisma, db } from '@/lib/prisma'
import { ok, created, fromAppError, serverError, badRequest, notFound, forbidden } from '@/lib/api-response'
import { enforceChatRateLimit } from '@/lib/enforce-api-rate-limit'
import { ApprovalStatus, AppointmentStatus } from '@prisma/client'
import { z } from 'zod'
import { listChatRoomsForUser, type ChatRoomFilter } from '@/lib/chat/list-rooms'
import { ensureClientProfile } from '@/lib/client/patient-access'
import { assertPatientCanChatWithDoctor } from '@/lib/chat/access'

const CreateRoomSchema = z.object({
  doctorId:      z.string().uuid(),
  appointmentId: z.string().uuid().optional(),
})

function parseFilter(raw: string | null): ChatRoomFilter {
  return raw === 'closed' ? 'closed' : 'active'
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (!auth.success) return fromAppError(auth.error)

    const filter = parseFilter(req.nextUrl.searchParams.get('filter'))
    const result = await listChatRoomsForUser(auth.context.userId, auth.context.role, filter)
    return ok(result)
  } catch (err) {
    console.error('[GET /api/chat]', err)
    return serverError()
  }
}

export async function POST(req: NextRequest) {
  try {
    const limited = await enforceChatRateLimit(req)
    if (limited) return limited

    const auth = await requirePatientAuth()
    if (!auth.success) return fromAppError(auth.error)

    const body   = await req.json()
    const parsed = CreateRoomSchema.safeParse(body)
    if (!parsed.success) return badRequest('بيانات غير صحيحة')

    const doctor = await prisma.doctorProfile.findFirst({
      where: {
        id: parsed.data.doctorId,
        deletedAt: null,
        approvalStatus: ApprovalStatus.APPROVED,
        user: { isActive: true },
      },
      select: { id: true },
    })
    if (!doctor) return notFound('الطبيب غير متاح')

    const profile = await ensureClientProfile(auth.context.userId)

    if (parsed.data.appointmentId) {
      const appt = await prisma.appointment.findFirst({
        where: {
          id: parsed.data.appointmentId,
          clientId: auth.context.userId,
          doctorId: doctor.id,
          deletedAt: null,
          status: { in: [AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED] },
        },
        select: { id: true },
      })
      if (!appt) return badRequest('الموعد غير صالح لهذا الطبيب')
    } else {
      const allowed = await assertPatientCanChatWithDoctor(profile.id, doctor.id)
      if (!allowed) {
        return forbidden('لا يمكن فتح محادثة بدون موعد أو استشارة مع هذا الطبيب')
      }
    }

    const existing = await db.chatRoom.findFirst({
      where: {
        clientId: profile.id,
        doctorId: parsed.data.doctorId,
        status:   'ACTIVE',
      },
    })

    if (existing) return ok({ id: existing.id, existing: true })

    const room = await db.chatRoom.create({
      data: {
        clientId:      profile.id,
        doctorId:      parsed.data.doctorId,
        appointmentId: parsed.data.appointmentId,
      },
    })

    return created({ id: room.id })
  } catch (err) {
    console.error('[POST /api/chat]', err)
    return serverError()
  }
}
