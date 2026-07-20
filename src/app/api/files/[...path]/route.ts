// src/app/api/files/[...path]/route.ts
// عرض الملفات المحلية (.local-storage)

import { NextRequest, NextResponse } from 'next/server'
import { Role } from '@prisma/client'
import { requireAuth } from '@/infrastructure/auth/providers/role-guard'
import { fromAppError } from '@/lib/api-response'
import { prisma } from '@/lib/prisma'
import { isServeableStorageKey } from '@/lib/storage/local-file-url'
import { readBufferByKey } from '@/lib/storage/production-storage'
import { canAccessChatFile } from '@/lib/chat/access'

const MIME: Record<string, string> = {
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png':  'image/png',
  '.webp': 'image/webp',
  '.pdf':  'application/pdf',
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path } = await params
    const storageKey = path.map(decodeURIComponent).join('/')

    if (!isServeableStorageKey(storageKey) || storageKey.includes('..')) {
      return NextResponse.json({ error: true, message: 'مسار غير صالح' }, { status: 400 })
    }

    const auth = storageKey.startsWith('chat/')
      ? await requireAuth()
      : await requireAuth({
          roles: [Role.ADMIN, Role.OWNER, Role.DOCTOR, Role.FACILITY],
        })
    if (!auth.success) return fromAppError(auth.error)

    if (storageKey.startsWith('chat/')) {
      const allowed = await canAccessChatFile(auth.context.userId, auth.context.role, storageKey)
      if (!allowed) {
        return NextResponse.json({ error: true, message: 'غير مصرح' }, { status: 403 })
      }
    } else if (auth.context.role === Role.DOCTOR) {
      const profile = await prisma.doctorProfile.findUnique({
        where:  { userId: auth.context.userId },
        select: { id: true },
      })
      const doc = profile
        ? await prisma.verificationDocument.findFirst({
            where: { storageKey, doctorId: profile.id },
            select: { id: true },
          })
        : null
      if (!doc) {
        return NextResponse.json({ error: true, message: 'غير مصرح' }, { status: 403 })
      }
    } else if (auth.context.role === Role.FACILITY) {
      const profile = await prisma.facilityProfile.findUnique({
        where: { userId: auth.context.userId },
        select: { licenseDocUrl: true, ownershipDocUrl: true },
      })
      const allowed = profile && (
        profile.licenseDocUrl?.includes(storageKey) ||
        profile.ownershipDocUrl?.includes(storageKey)
      )
      if (!allowed) {
        return NextResponse.json({ error: true, message: 'غير مصرح' }, { status: 403 })
      }
    }

    const docMeta = await prisma.verificationDocument.findFirst({
      where: { storageKey },
      select: { mimeType: true, storageBucket: true },
    })

    const ext = storageKey.slice(storageKey.lastIndexOf('.')).toLowerCase()
    const buffer = await readBufferByKey(storageKey, docMeta?.storageBucket)

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': docMeta?.mimeType ?? MIME[ext] ?? 'application/octet-stream',
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch {
    return NextResponse.json({ error: true, message: 'الملف غير موجود' }, { status: 404 })
  }
}
