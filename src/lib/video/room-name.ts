import { createHmac } from 'crypto'

function videoRoomSecret(): string {
  return (
    process.env.JITSI_ROOM_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    'dev-jitsi-room-secret'
  )
}

/** Non-guessable Jitsi room name derived from entity id + server secret. */
export function getSecureVideoRoomName(prefix: string, entityId: string): string {
  const digest = createHmac('sha256', videoRoomSecret())
    .update(`${prefix}:${entityId}`)
    .digest('base64url')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 22)
  return `${prefix}${digest}`
}
