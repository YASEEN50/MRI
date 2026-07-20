import { ApprovalStatus, ActivityType, Role } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { invalidateUserSessions } from '@/lib/auth/active-account'
import { applyAccountSuspendEnforcement } from '@/lib/owner/suspend-enforcement'
import { syncLegacyVerificationOnRejected } from '@/lib/verification/lifecycle'

export type SuspendAccountResult =
  | { ok: true; enforcement: Awaited<ReturnType<typeof applyAccountSuspendEnforcement>> }
  | { ok: false; message: string }

export async function suspendUserAccount(
  userId: string,
  actorId: string,
  reason: string,
): Promise<SuspendAccountResult> {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: { id: true, role: true, isActive: true, email: true, piUsername: true },
  })
  if (!user) return { ok: false, message: 'المستخدم غير موجود' }
  if (user.role === Role.OWNER) return { ok: false, message: 'لا يمكن تجميد حساب المالك' }
  if (!user.isActive) return { ok: false, message: 'الحساب مجمّد مسبقاً' }

  await prisma.user.update({
    where: { id: userId },
    data: { isActive: false, updatedAt: new Date() },
  })

  await invalidateUserSessions(userId)

  const enforcement = await applyAccountSuspendEnforcement(userId, actorId, reason)

  await prisma.activityLog.create({
    data: {
      actorId,
      action: ActivityType.BAN_USER,
      targetType: 'USER',
      targetId: userId,
      details: { reason, enforcement },
    },
  })

  await prisma.notification.create({
    data: {
      userId,
      title: '⛔ تم تجميد حسابك',
      body: reason || 'تم تعليق حسابك مؤقتاً بسبب مخالفة أو شكوى. تواصل مع الدعم للاستفسار.',
      type: 'ACCOUNT_SUSPENDED',
      data: { reason },
    },
  }).catch(() => {})

  return { ok: true, enforcement }
}

export async function unsuspendUserAccount(
  userId: string,
  actorId: string,
  notes?: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: { id: true, isActive: true },
  })
  if (!user) return { ok: false, message: 'المستخدم غير موجود' }
  if (user.isActive) return { ok: false, message: 'الحساب نشط بالفعل' }

  await prisma.user.update({
    where: { id: userId },
    data: { isActive: true, updatedAt: new Date() },
  })

  await prisma.activityLog.create({
    data: {
      actorId,
      action: ActivityType.UNBAN_USER,
      targetType: 'USER',
      targetId: userId,
      details: { notes: notes ?? null },
    },
  })

  await prisma.notification.create({
    data: {
      userId,
      title: '✅ تم إلغاء تجميد حسابك',
      body: 'يمكنك تسجيل الدخول واستخدام المنصة مجدداً.',
      type: 'ACCOUNT_RESTORED',
    },
  }).catch(() => {})

  return { ok: true }
}

export async function revokeDoctorVerification(
  doctorProfileId: string,
  actorId: string,
  reason: string,
): Promise<{ ok: true; userId: string } | { ok: false; message: string }> {
  const doctor = await prisma.doctorProfile.findUnique({
    where: { id: doctorProfileId },
    select: { id: true, userId: true, firstName: true, lastName: true, approvalStatus: true },
  })
  if (!doctor) return { ok: false, message: 'ملف الطبيب غير موجود' }
  if (doctor.approvalStatus !== ApprovalStatus.APPROVED) {
    return { ok: false, message: 'الطبيب غير موثّق حالياً' }
  }

  await prisma.doctorProfile.update({
    where: { id: doctorProfileId },
    data: {
      approvalStatus: ApprovalStatus.REJECTED,
      approvalNotes: reason,
      approvedAt: null,
      approvedBy: actorId,
      updatedAt: new Date(),
    },
  })

  await prisma.verificationSession.updateMany({
    where: { doctorId: doctorProfileId, isActive: true },
    data: {
      currentState: 'REJECTED',
      isActive: false,
      rejectionReason: reason,
      rejectedBy: actorId,
      rejectedAt: new Date(),
      completedAt: new Date(),
      updatedAt: new Date(),
    },
  })

  await syncLegacyVerificationOnRejected(doctorProfileId)

  await prisma.activityLog.create({
    data: {
      actorId,
      action: ActivityType.REJECT_DOCTOR,
      targetType: 'DOCTOR',
      targetId: doctorProfileId,
      details: { reason, revoked: true },
    },
  })

  await prisma.notification.create({
    data: {
      userId: doctor.userId,
      title: '⚠️ تم إلغاء توثيق حسابك الطبي',
      body: reason || 'تم إلغاء توثيقك كطبيب على المنصة.',
      type: 'DOCTOR_REJECTED',
      data: { reason },
    },
  }).catch(() => {})

  return { ok: true, userId: doctor.userId }
}

export async function revokeFacilityVerification(
  facilityProfileId: string,
  actorId: string,
  reason: string,
): Promise<{ ok: true; userId: string } | { ok: false; message: string }> {
  const facility = await prisma.facilityProfile.findUnique({
    where: { id: facilityProfileId },
    select: { id: true, userId: true, name: true, approvalStatus: true },
  })
  if (!facility) return { ok: false, message: 'ملف المنشأة غير موجود' }
  if (facility.approvalStatus !== ApprovalStatus.APPROVED) {
    return { ok: false, message: 'المنشأة غير موثّقة حالياً' }
  }

  await prisma.facilityProfile.update({
    where: { id: facilityProfileId },
    data: {
      approvalStatus: ApprovalStatus.REJECTED,
      approvalNotes: reason,
      approvedAt: null,
      approvedBy: actorId,
      updatedAt: new Date(),
    },
  })

  await prisma.activityLog.create({
    data: {
      actorId,
      action: ActivityType.REJECT_FACILITY,
      targetType: 'FACILITY',
      targetId: facilityProfileId,
      details: { reason, revoked: true },
    },
  })

  await prisma.notification.create({
    data: {
      userId: facility.userId,
      title: '⚠️ تم إلغاء توثيق منشأتك',
      body: reason || 'تم إلغاء توثيق منشأتك على المنصة.',
      type: 'FACILITY_REJECTED',
      data: { reason },
    },
  }).catch(() => {})

  return { ok: true, userId: facility.userId }
}

export async function revokeVerificationForUser(
  userId: string,
  actorId: string,
  reason: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: {
      id: true,
      role: true,
      doctorProfile: { select: { id: true, approvalStatus: true } },
      facilityProfile: { select: { id: true, approvalStatus: true } },
    },
  })
  if (!user) return { ok: false, message: 'المستخدم غير موجود' }

  if (user.role === Role.DOCTOR && user.doctorProfile) {
    return revokeDoctorVerification(user.doctorProfile.id, actorId, reason)
  }
  if (user.role === Role.FACILITY && user.facilityProfile) {
    return revokeFacilityVerification(user.facilityProfile.id, actorId, reason)
  }
  return { ok: false, message: 'هذا المستخدم ليس طبيباً أو منشأة موثّقة' }
}
