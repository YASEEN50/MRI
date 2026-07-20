// src/app/api/moderation/reports/[id]/route.ts
import { NextRequest } from 'next/server'
import { requireAdminPermission, ADMIN_PERMISSION_KEYS } from '@/lib/admin/permissions'
import { prisma, db } from '@/lib/prisma'
import { ok, fromAppError, serverError } from '@/lib/api-response'
import { ActivityType } from '@prisma/client'
import { z } from 'zod'
import { resolveReportTargetUserId } from '@/lib/moderation/resolve-report-user'
import {
  revokeVerificationForUser,
  suspendUserAccount,
} from '@/lib/owner/account-enforcement'

const ActionSchema = z.object({
  status:      z.enum(['REVIEWED','ACTION_TAKEN','DISMISSED']),
  reviewNotes: z.string().max(1000).optional(),
  actionTaken: z.string().max(500).optional(),
  freezeUser:  z.boolean().optional(),
  revokeVerification: z.boolean().optional(),
})

// PATCH — مراجعة التقرير واتخاذ إجراء
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminPermission(ADMIN_PERMISSION_KEYS.canModerateContent)
    if (!auth.success) return fromAppError(auth.error)

    const { id } = await params
    const body   = await req.json()
    const parsed = ActionSchema.safeParse(body)
    if (!parsed.success) return ok({ error: true, message: 'بيانات غير صحيحة' })

    const report = await db.contentReport.findUnique({ where: { id } })
    if (!report) return ok({ error: true, message: 'التقرير غير موجود' })

    // إذا action_taken — نخفي المحتوى + إجراءات اختيارية على الحساب
    if (parsed.data.status === 'ACTION_TAKEN') {
      const hidden = await hideContent(report.contentType, report.contentId)
      if (!hidden) {
        return ok({ error: true, message: 'تعذّر إخفاء المحتوى المبلّغ عنه' })
      }

      const targetUserId = await resolveReportTargetUserId(report.contentType, report.contentId)
      const enforcementReason =
        parsed.data.actionTaken ||
        parsed.data.reviewNotes ||
        'إجراء تأديبي بسبب تقرير مخالفة'

      if (targetUserId && parsed.data.freezeUser) {
        await suspendUserAccount(targetUserId, auth.context.userId, enforcementReason)
      }
      if (targetUserId && parsed.data.revokeVerification) {
        await revokeVerificationForUser(targetUserId, auth.context.userId, enforcementReason)
      }
    }

    await db.contentReport.update({
      where: { id },
      data: {
        status:      parsed.data.status,
        reviewedBy:  auth.context.userId,
        reviewNotes: parsed.data.reviewNotes,
        actionTaken: parsed.data.actionTaken,
        reviewedAt:  new Date(),
      },
    })

    // تسجيل في ActivityLog
    await prisma.activityLog.create({
      data: {
        actorId:    auth.context.userId,
        action:     ActivityType.ADMIN_REVIEW_APPROVE,
        targetType: 'REPORT',
        targetId:   id,
        details:    { status: parsed.data.status, action: parsed.data.actionTaken },
      },
    })

    return ok({ message: 'تم معالجة التقرير' })
  } catch (err) {
    console.error('[PATCH /api/moderation/reports/[id]]', err)
    return serverError()
  }
}

async function hideContent(contentType: string, contentId: string): Promise<boolean> {
  try {
    switch (contentType) {
      case 'PUBLICATION':
        await db.publication.update({
          where: { id: contentId },
          data:  { status: 'DRAFT' },
        })
        break
      case 'REVIEW':
        await prisma.review.update({
          where: { id: contentId },
          data:  { deletedAt: new Date() },
        })
        break
      case 'CHAT_MESSAGE':
        await db.chatMessage.update({
          where: { id: contentId },
          data:  { deletedAt: new Date() },
        })
        break
      case 'PROFILE': {
        const user = await prisma.user.findFirst({
          where: { id: contentId, deletedAt: null },
          select: { id: true },
        })
        if (user) {
          await prisma.doctorProfile.updateMany({
            where: { userId: user.id },
            data: { bio: null, avatarUrl: null },
          })
          await prisma.facilityProfile.updateMany({
            where: { userId: user.id },
            data: { description: null },
          })
          break
        }

        const doctor = await prisma.doctorProfile.findUnique({
          where: { id: contentId },
          select: { id: true },
        })
        if (doctor) {
          await prisma.doctorProfile.update({
            where: { id: contentId },
            data: { bio: null, avatarUrl: null },
          })
          break
        }

        const facility = await prisma.facilityProfile.findUnique({
          where: { id: contentId },
          select: { id: true },
        })
        if (!facility) return false
        await prisma.facilityProfile.update({
          where: { id: contentId },
          data: { description: null },
        })
        break
      }
      default:
        return false
    }
    return true
  } catch (e) {
    console.error('hideContent error', e)
    return false
  }
}
