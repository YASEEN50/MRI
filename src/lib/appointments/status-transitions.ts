import { AppointmentStatus, Role } from '@prisma/client'
import { canActAsPatient } from '@/lib/client/patient-access'

const PROVIDER_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  [AppointmentStatus.PENDING]: [
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.CANCELLED,
  ],
  [AppointmentStatus.CONFIRMED]: [
    AppointmentStatus.COMPLETED,
    AppointmentStatus.NO_SHOW,
    AppointmentStatus.CANCELLED,
  ],
  [AppointmentStatus.COMPLETED]: [],
  [AppointmentStatus.CANCELLED]: [],
  [AppointmentStatus.NO_SHOW]: [],
}

const PATIENT_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  [AppointmentStatus.PENDING]: [AppointmentStatus.CANCELLED],
  [AppointmentStatus.CONFIRMED]: [AppointmentStatus.CANCELLED],
  [AppointmentStatus.COMPLETED]: [],
  [AppointmentStatus.CANCELLED]: [],
  [AppointmentStatus.NO_SHOW]: [],
}

export function canTransitionAppointmentStatus(
  current: AppointmentStatus,
  next: AppointmentStatus,
  role: Role,
): boolean {
  if (current === next) return false
  const table = canActAsPatient(role) && role !== Role.DOCTOR && role !== Role.FACILITY
    ? PATIENT_TRANSITIONS
    : PROVIDER_TRANSITIONS
  return table[current]?.includes(next) ?? false
}

export function canSetDoctorNotes(role: Role): boolean {
  return role === Role.DOCTOR || role === Role.FACILITY
}
