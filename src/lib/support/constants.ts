import { SupportTicketCategory, SupportTicketStatus } from '@prisma/client'

export const SUPPORT_CATEGORY_LABELS: Record<SupportTicketCategory, string> = {
  ACCOUNT: 'حساب / تعليق',
  PAYMENT: 'دفع Pi / استرداد',
  VERIFICATION: 'تحقق طبيب / منشأة',
  APPOINTMENT: 'موعد / استشارة',
  TECHNICAL: 'مشكلة تقنية',
  OTHER: 'أخرى',
}

export const SUPPORT_STATUS_LABELS: Record<SupportTicketStatus, string> = {
  OPEN: 'جديدة',
  WAITING_USER: 'بانتظار ردك',
  WAITING_SUPPORT: 'بانتظار الدعم',
  RESOLVED: 'تم الحل',
  CLOSED: 'مغلقة',
}

export const SUPPORT_PRIORITY_LABELS: Record<string, string> = {
  LOW: 'منخفضة',
  MEDIUM: 'متوسطة',
  HIGH: 'عالية',
  URGENT: 'عاجلة',
}

export const OPEN_SUPPORT_STATUSES: SupportTicketStatus[] = [
  SupportTicketStatus.OPEN,
  SupportTicketStatus.WAITING_USER,
  SupportTicketStatus.WAITING_SUPPORT,
]
