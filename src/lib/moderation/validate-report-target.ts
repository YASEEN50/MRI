import { ContentType } from '@prisma/client'
import { prisma, db } from '@/lib/prisma'

export async function validateReportTarget(
  contentType: ContentType,
  contentId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  switch (contentType) {
    case 'PUBLICATION': {
      const pub = await db.publication.findUnique({
        where: { id: contentId },
        select: { id: true },
      })
      if (!pub) return { ok: false, message: 'المنشور غير موجود' }
      return { ok: true }
    }
    case 'REVIEW': {
      const review = await prisma.review.findFirst({
        where: { id: contentId, deletedAt: null },
        select: { id: true },
      })
      if (!review) return { ok: false, message: 'التقييم غير موجود' }
      return { ok: true }
    }
    case 'CHAT_MESSAGE': {
      const msg = await db.chatMessage.findFirst({
        where: { id: contentId, deletedAt: null },
        select: { id: true },
      })
      if (!msg) return { ok: false, message: 'الرسالة غير موجودة' }
      return { ok: true }
    }
    case 'PROFILE': {
      const user = await prisma.user.findFirst({
        where: { id: contentId, deletedAt: null },
        select: { id: true },
      })
      if (user) return { ok: true }

      const doctor = await prisma.doctorProfile.findFirst({
        where: { id: contentId, deletedAt: null },
        select: { id: true },
      })
      if (doctor) return { ok: true }

      const facility = await prisma.facilityProfile.findFirst({
        where: { id: contentId, deletedAt: null },
        select: { id: true },
      })
      if (!facility) return { ok: false, message: 'الملف الشخصي غير موجود' }
      return { ok: true }
    }
    default:
      return { ok: false, message: 'نوع محتوى غير مدعوم' }
  }
}
