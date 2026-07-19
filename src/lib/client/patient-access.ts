import { Role } from '@prisma/client'
import { prisma } from '@/lib/prisma'

/** Roles that may book appointments / use patient services without changing primary role. */
export const PATIENT_CAPABLE_ROLES: Role[] = [Role.CLIENT, Role.OWNER, Role.ADMIN]

export function canActAsPatient(role: Role | string | undefined): boolean {
  return !!role && PATIENT_CAPABLE_ROLES.includes(role as Role)
}

export function isStrictClientRole(role: Role | string | undefined): boolean {
  return role === Role.CLIENT
}

/** Appointment.clientId stores User.id — same for all patient-capable roles. */
export function isAppointmentOwner(userId: string, appointmentClientId: string): boolean {
  return userId === appointmentClientId
}

export async function getClientProfileId(userId: string): Promise<string | null> {
  const profile = await prisma.clientProfile.findUnique({
    where: { userId },
    select: { id: true },
  })
  return profile?.id ?? null
}

/** Create a minimal client profile for owner/admin personal care (does not change User.role). */
export async function ensureClientProfile(userId: string): Promise<{ id: string }> {
  const existing = await prisma.clientProfile.findUnique({
    where: { userId },
    select: { id: true },
  })
  if (existing) return existing

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { piUsername: true, email: true },
  })

  const fromPi = user?.piUsername?.replace(/^@/, '')
  const fromEmail = user?.email?.split('@')[0]
  const display = fromPi || fromEmail || 'مستخدم'

  return prisma.clientProfile.create({
    data: {
      userId,
      firstName: display.slice(0, 50),
      lastName: 'MRI',
    },
    select: { id: true },
  })
}

export async function requireClientProfileId(userId: string): Promise<string> {
  const profile = await ensureClientProfile(userId)
  return profile.id
}
