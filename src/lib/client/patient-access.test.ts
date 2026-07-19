import { describe, expect, it } from 'vitest'
import { Role } from '@prisma/client'
import { canActAsPatient, isAppointmentOwner } from './patient-access'

describe('patient-access', () => {
  it('allows CLIENT, OWNER, and ADMIN as patients', () => {
    expect(canActAsPatient(Role.CLIENT)).toBe(true)
    expect(canActAsPatient(Role.OWNER)).toBe(true)
    expect(canActAsPatient(Role.ADMIN)).toBe(true)
    expect(canActAsPatient(Role.DOCTOR)).toBe(false)
  })

  it('matches appointment ownership by user id', () => {
    expect(isAppointmentOwner('u1', 'u1')).toBe(true)
    expect(isAppointmentOwner('u1', 'u2')).toBe(false)
  })
})
