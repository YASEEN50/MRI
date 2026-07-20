import { NextRequest } from 'next/server'
import { Role } from '@prisma/client'
import { requireOwnerAuth } from '@/infrastructure/auth/providers/role-guard'
import { ok, fromAppError, serverError } from '@/lib/api-response'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const auth = await requireOwnerAuth()
    if (!auth.success) return fromAppError(auth.error)

    const q = req.nextUrl.searchParams.get('q')?.trim()
    if (!q || q.length < 2) return ok([])

    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
        role: { not: Role.OWNER },
        OR: [
          { email: { contains: q, mode: 'insensitive' } },
          { piUsername: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q } },
          { doctorProfile: { is: { firstName: { contains: q, mode: 'insensitive' } } } },
          { doctorProfile: { is: { lastName: { contains: q, mode: 'insensitive' } } } },
          { facilityProfile: { is: { name: { contains: q, mode: 'insensitive' } } } },
        ],
      },
      select: {
        id: true,
        email: true,
        piUsername: true,
        role: true,
        isActive: true,
        doctorProfile: {
          select: { id: true, firstName: true, lastName: true, approvalStatus: true },
        },
        facilityProfile: {
          select: { id: true, name: true, approvalStatus: true },
        },
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
    })

    return ok(users)
  } catch (err) {
    console.error('[GET /api/owner/users/search]', err)
    return serverError()
  }
}
