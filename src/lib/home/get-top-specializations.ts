import { prisma } from '@/lib/prisma'
import { doctorProfilePublicWhere } from '@/lib/premio/active-premio'

export interface TopSpecialization {
  name: string
  count: number
}

export async function getTopSpecializations(limit = 14): Promise<TopSpecialization[]> {
  const rows = await prisma.doctorProfile.groupBy({
    by: ['specialization'],
    where: doctorProfilePublicWhere(),
    _count: { specialization: true },
    orderBy: { _count: { specialization: 'desc' } },
    take: limit,
  })

  return rows
    .filter(r => r.specialization.trim().length > 0)
    .map(r => ({
      name: r.specialization.trim(),
      count: r._count.specialization,
    }))
}
