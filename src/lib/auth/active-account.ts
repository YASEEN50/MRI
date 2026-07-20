import { prisma } from '@/lib/prisma'

/** Returns whether the account exists and is not suspended. */
export async function isUserAccountActive(userId: string): Promise<boolean> {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: { isActive: true },
  })
  return user?.isActive ?? false
}

/** Invalidate all NextAuth database sessions for a user (JWT cookies still need isActive checks). */
export async function invalidateUserSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } }).catch(() => {})
}
