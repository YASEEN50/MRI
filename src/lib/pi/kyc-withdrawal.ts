import { isPiSandboxMode } from '@/lib/pi/pi-api-key'
import { PiSdkService } from '@/infrastructure/pi-network/pi-sdk.service'

/** Pi KYC must be verified before doctor A2U withdrawals (skipped in sandbox). */
export async function requirePiKycForWithdrawal(piUid: string): Promise<{ ok: true } | { ok: false; message: string }> {
  if (isPiSandboxMode()) return { ok: true }

  const kyc = await new PiSdkService().getKYCStatus(piUid)
  if (!kyc.verified) {
    return {
      ok: false,
      message: 'يجب إكمال التحقق KYC على Pi Network قبل سحب المستحقات إلى محفظتك',
    }
  }

  return { ok: true }
}
