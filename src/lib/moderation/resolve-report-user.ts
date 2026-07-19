import { ContentType } from '@prisma/client'
import { prisma } from '@/lib/prisma'

/** Resolve the user account tied to a content report (for freeze / revoke actions). */
export async function resolveReportTargetUserId(
  contentType: ContentType,
  contentId: string,
): Promise<string | null> {
  switch (contentType) {
    case 'PUBLICATION': {
      const pub = await prisma.publication.findUnique({
        where: { id: contentId },
        select: { doctor: { select: { userId: true } } },
      })
      return pub?.doctor?.userId ?? null
    }
    case 'REVIEW': {
      const review = await prisma.review.findUnique({
        where: { id: contentId },
        select: { clientId: true },
      })
      return review?.clientId ?? null
    }
    case 'CHAT_MESSAGE': {
      const msg = await prisma.chatMessage.findUnique({
        where: { id: contentId },
        select: { senderId: true },
      })
      return msg?.senderId ?? null
    }
    case 'PROFILE': {
      const byUser = await prisma.user.findFirst({
        where: { id: contentId, deletedAt: null },
        select: { id: true },
      })
      if (byUser) return byUser.id

      const doctor = await prisma.doctorProfile.findUnique({
        where: { id: contentId },
        select: { userId: true },
      })
      if (doctor) return doctor.userId

      const facility = await prisma.facilityProfile.findUnique({
        where: { id: contentId },
        select: { userId: true },
      })
      return facility?.userId ?? null
    }
    default:
      return null
  }
}
