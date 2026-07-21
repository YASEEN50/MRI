import { describe, expect, it } from 'vitest'
import { notificationActionPath } from '@/lib/notifications/routes'

describe('notificationActionPath', () => {
  it('routes instant consult request to doctor inbox', () => {
    expect(
      notificationActionPath('INSTANT_CONSULT_REQUEST', { requestId: 'abc' }, 'DOCTOR'),
    ).toBe('/dashboard/doctor/instant-consult')
  })

  it('routes chat message to doctor chat room', () => {
    expect(
      notificationActionPath('CHAT_MESSAGE', { roomId: 'room-1' }, 'DOCTOR'),
    ).toBe('/dashboard/doctor/chat?room=room-1')
  })

  it('routes appointment booked for doctor to schedule', () => {
    expect(
      notificationActionPath('APPOINTMENT_BOOKED', { appointmentId: 'apt-1' }, 'DOCTOR'),
    ).toBe('/dashboard/doctor/schedule')
  })

  it('prefers explicit actionPath in payload', () => {
    expect(
      notificationActionPath('INSTANT_CONSULT_ACCEPTED', {
        requestId: 'x',
        actionPath: '/dashboard/client/chat?room=r1',
      }),
    ).toBe('/dashboard/client/chat?room=r1')
  })

  it('routes withdrawal notifications to withdrawals page', () => {
    expect(
      notificationActionPath('WITHDRAWAL_COMPLETED', {}, 'DOCTOR'),
    ).toBe('/dashboard/doctor/withdrawals')
  })

  it('routes publication submitted for doctor', () => {
    expect(
      notificationActionPath('PUBLICATION_SUBMITTED', {}, 'DOCTOR'),
    ).toBe('/dashboard/doctor/publications')
  })

  it('routes verification submitted for doctor to profile', () => {
    expect(
      notificationActionPath('VERIFICATION_SUBMITTED', {}, 'DOCTOR'),
    ).toBe('/profile')
  })
})
