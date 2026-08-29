import { describe, expect, it } from 'vitest'
import {
  shouldShowNativePaymentLinksTeaser,
  shouldShowPaymentLinksSummary,
} from '~/utils/payment-links-experience'

describe('payment-links-experience', () => {
  it('hides native teaser for solo/simple experience on iOS shell', () => {
    expect(
      shouldShowNativePaymentLinksTeaser({
        canUsePaymentLinksExperience: false,
        paymentLinksNativeComingSoon: true,
        isNativeShell: true,
      })
    ).toBe(false)
  })

  it('shows native teaser for business experience on iOS shell', () => {
    expect(
      shouldShowNativePaymentLinksTeaser({
        canUsePaymentLinksExperience: true,
        paymentLinksNativeComingSoon: true,
        isNativeShell: true,
      })
    ).toBe(true)
  })

  it('builds summary visibility from plan and native teaser', () => {
    expect(
      shouldShowPaymentLinksSummary({
        canShowPaymentLinksFeature: false,
        showNativeTeaser: true,
      })
    ).toBe(true)

    expect(
      shouldShowPaymentLinksSummary({
        canShowPaymentLinksFeature: false,
        showNativeTeaser: false,
      })
    ).toBe(false)
  })
})
