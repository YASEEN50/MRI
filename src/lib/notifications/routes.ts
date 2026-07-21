import { getChatPath } from '@/lib/chat/paths'

function dashboardAppointmentsPath(role?: string): string {
  if (role === 'DOCTOR') return '/dashboard/doctor/schedule'
  if (role === 'FACILITY') return '/dashboard/facility/overview'
  return '/dashboard/client/appointments'
}

function adminVerificationPath(role?: string): string {
  if (role === 'OWNER') return '/owner'
  return '/dashboard/admin/verification'
}

function instantConsultIdFromData(d: Record<string, unknown>): string | null {
  if (typeof d.requestId === 'string') return d.requestId
  if (typeof d.instantConsultId === 'string') return d.instantConsultId
  return null
}

/** Deep-link targets for in-app notifications */
export function notificationActionPath(
  type: string,
  data: unknown,
  role?: string,
): string | null {
  const d = data && typeof data === 'object' ? (data as Record<string, unknown>) : null

  if (d) {
    if (typeof d.actionPath === 'string') return d.actionPath
    if (typeof d.href === 'string') return d.href
    if (typeof d.ratingPath === 'string') return d.ratingPath
    if (typeof d.videoPath === 'string') return d.videoPath
  }

  if (type === 'INSTANT_CONSULT_REQUEST') {
    return '/dashboard/doctor/instant-consult'
  }

  if (!d) return null

  const consultId = instantConsultIdFromData(d)

  if (type === 'INSTANT_CONSULT_ACCEPTED') {
    if (typeof d.chatRoomId === 'string') {
      return getChatPath(role, d.chatRoomId)
    }
    return '/consult-now'
  }

  if (
    type === 'INSTANT_CONSULT_PENDING' ||
    type === 'INSTANT_CONSULT_REJECTED' ||
    type === 'INSTANT_CONSULT_REFUNDED' ||
    type === 'INSTANT_CONSULT_CANCELLED'
  ) {
    if (role === 'DOCTOR') return '/dashboard/doctor/instant-consult'
    return '/consult-now'
  }

  if (type === 'REVIEW_REQUESTED' && typeof d.appointmentId === 'string') {
    return `/appointments/${d.appointmentId}/rating`
  }

  if (type === 'REVIEW_REQUESTED' && consultId) {
    return `/consult-now/${consultId}/rating`
  }

  if (
    type === 'APPOINTMENT_CONFIRMED' ||
    type === 'APPOINTMENT_CANCELLED' ||
    type === 'APPOINTMENT_BOOKED' ||
    type === 'APPOINTMENT_REMINDER' ||
    type === 'APPOINTMENT_REFUNDED'
  ) {
    return dashboardAppointmentsPath(role)
  }

  if (type === 'PAYMENT_COMPLETED' || type === 'DOCTOR_PAYMENT_SETTLED') {
    return role === 'DOCTOR' ? '/dashboard/doctor/transactions' : dashboardAppointmentsPath(role)
  }

  if (type === 'CHAT_MESSAGE' || type === 'CHAT_CLOSED') {
    if (typeof d.roomId === 'string') {
      return getChatPath(role, d.roomId)
    }
    return getChatPath(role)
  }

  if (type === 'REVIEW_RECEIVED') {
    return '/dashboard/doctor/schedule'
  }

  if (
    type === 'REFERRAL_RECEIVED' ||
    type === 'REFERRAL_ACCEPTED' ||
    type === 'REFERRAL_REWARD' ||
    type === 'REFERRAL_CANCELLED'
  ) {
    return '/dashboard/doctor/referrals'
  }

  if (
    type === 'SUPPORT_TICKET_NEW' ||
    type === 'SUPPORT_TICKET_REPLY' ||
    type === 'SUPPORT_TICKET_USER_REPLY'
  ) {
    if (typeof d.ticketId === 'string') return `/dashboard/support/${d.ticketId}`
    return '/dashboard/support'
  }

  if (
    type === 'DOCTOR_PENDING_REVIEW' ||
    type === 'VERIFICATION_RISK_ALERT' ||
    type === 'PUBLICATION_PENDING_REVIEW' ||
    type === 'PAID_AD_PENDING_REVIEW'
  ) {
    return adminVerificationPath(role)
  }

  if (type === 'PUBLICATION_SUBMITTED') {
    return role === 'DOCTOR' ? '/dashboard/doctor/publications' : adminVerificationPath(role)
  }

  if (type === 'VERIFICATION_SUBMITTED') {
    return role === 'DOCTOR' ? '/profile' : adminVerificationPath(role)
  }

  if (type === 'PAID_AD_SUBMITTED') {
    return '/dashboard/client/appointments'
  }

  if (type === 'DOCTOR_APPROVED' || type === 'AI_APPROVED' || type === 'VERIFIED') {
    if (role === 'FACILITY') return '/dashboard/facility/overview'
    return '/dashboard/doctor/schedule'
  }

  if (type === 'DOCTOR_REJECTED' || type === 'AI_REJECTED' || type === 'REJECTED') {
    if (role === 'FACILITY') return '/dashboard/facility/pending'
    return '/doctor/pending'
  }

  if (type === 'FACILITY_REJECTED') {
    return '/dashboard/facility/pending'
  }

  if (type === 'ACCOUNT_SUSPENDED') {
    return '/login'
  }

  if (type === 'ACCOUNT_RESTORED') {
    return dashboardAppointmentsPath(role)
  }

  if (type === 'ADMIN_ASSIGNED' || type === 'PERMISSIONS_UPDATED') {
    return role === 'OWNER' ? '/owner' : '/dashboard/admin/verification'
  }

  if (type === 'TASK_ASSIGNED') {
    return '/dashboard/admin/pending'
  }

  if (type === 'PREMIO_ACTIVATED' || type === 'PREMIO_GRANTED') {
    return role === 'DOCTOR' ? '/dashboard/doctor/premio' : '/dashboard/client/appointments'
  }

  if (type === 'WITHDRAWAL_REQUESTED' || type === 'WITHDRAWAL_COMPLETED' || type === 'WITHDRAWAL_REJECTED') {
    return '/dashboard/doctor/withdrawals'
  }

  return null
}
