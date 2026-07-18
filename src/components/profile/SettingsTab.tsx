'use client'
// src/components/profile/SettingsTab.tsx

import AccountLinkingCard from '@/components/profile/AccountLinkingCard'
import PrivacyDataCard from '@/components/profile/PrivacyDataCard'

export default function SettingsTab({
  userEmail,
  piUsername,
  piUid,
  hasPassword = false,
}: {
  userEmail?: string | null
  piUsername?: string | null
  piUid?: string | null
  hasPassword?: boolean
}) {
  return (
    <div className="space-y-4">
      <AccountLinkingCard userEmail={userEmail} piUsername={piUsername} piUid={piUid} />
      <PrivacyDataCard hasPassword={hasPassword || !!userEmail} />
    </div>
  )
}
