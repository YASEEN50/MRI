import { describe, expect, it } from 'vitest'
import { splitInstantConsultRefund } from './instant-consult-refund-split'

describe('splitInstantConsultRefund', () => {
  it('returns full fee as credit when paid with credit only', () => {
    expect(
      splitInstantConsultRefund({
        fee: 10,
        creditApplied: 10,
        paidWithCreditOnly: true,
      }),
    ).toEqual({ creditRefund: 10, walletRefund: 0 })
  })

  it('returns wallet portion when paid fully with Pi', () => {
    expect(
      splitInstantConsultRefund({
        fee: 10,
        creditApplied: 0,
        piTransactionTotal: 10,
      }),
    ).toEqual({ creditRefund: 0, walletRefund: 10 })
  })

  it('splits mixed credit and Pi payment', () => {
    expect(
      splitInstantConsultRefund({
        fee: 10,
        creditApplied: 3,
        piTransactionTotal: 7,
      }),
    ).toEqual({ creditRefund: 3, walletRefund: 7 })
  })

  it('derives wallet amount from fee minus credit when tx total missing', () => {
    expect(
      splitInstantConsultRefund({
        fee: 10,
        creditApplied: 4,
      }),
    ).toEqual({ creditRefund: 4, walletRefund: 6 })
  })
})
