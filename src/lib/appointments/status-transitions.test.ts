import { describe, it, expect } from 'vitest'
import { Role, AppointmentStatus } from '@prisma/client'
import {
  canTransitionAppointmentStatus,
  canSetDoctorNotes,
} from '@/lib/appointments/status-transitions'

describe('appointment status transitions', () => {
  it('allows doctor to confirm pending appointment', () => {
    expect(
      canTransitionAppointmentStatus(
        AppointmentStatus.PENDING,
        AppointmentStatus.CONFIRMED,
        Role.DOCTOR,
      ),
    ).toBe(true)
  })

  it('blocks patient from confirming pending appointment', () => {
    expect(
      canTransitionAppointmentStatus(
        AppointmentStatus.PENDING,
        AppointmentStatus.CONFIRMED,
        Role.CLIENT,
      ),
    ).toBe(false)
  })

  it('allows patient to cancel confirmed appointment', () => {
    expect(
      canTransitionAppointmentStatus(
        AppointmentStatus.CONFIRMED,
        AppointmentStatus.CANCELLED,
        Role.CLIENT,
      ),
    ).toBe(true)
  })

  it('blocks same-status transition', () => {
    expect(
      canTransitionAppointmentStatus(
        AppointmentStatus.CONFIRMED,
        AppointmentStatus.CONFIRMED,
        Role.DOCTOR,
      ),
    ).toBe(false)
  })

  it('only doctor/facility may set doctor notes', () => {
    expect(canSetDoctorNotes(Role.DOCTOR)).toBe(true)
    expect(canSetDoctorNotes(Role.FACILITY)).toBe(true)
    expect(canSetDoctorNotes(Role.CLIENT)).toBe(false)
  })
})
