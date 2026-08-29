import { describe, expect, it } from 'vitest'
import { getSubscriptionBillingBanner } from '~/utils/subscription-billing-ui'
import { getUpgradeUnlockHighlights } from '~/utils/subscription-upgrade-unlocks'

describe('subscription billing ui', () => {
  it('returns past due banner for super admin', () => {
    const banner = getSubscriptionBillingBanner(
      {
        uid: 'u1',
        email: 'a@b.com',
        name: 'A',
        role: 'superAdmin',
        subscription: 'storvv_medium',
        subscriptionStatus: 'past_due',
        hasCompletedOnboarding: true,
        hasCompletedTutorial: true,
        createdAt: null,
        updatedAt: null,
      },
      true
    )
    expect(banner?.variant).toBe('past_due')
  })

  it('lists unlock highlights when upgrading from micro to medium', () => {
    const highlights = getUpgradeUnlockHighlights('storvv_micro', 'storvv_medium')
    expect(highlights).toContain('Analytics & PDF/Excel exports')
    expect(highlights.some((line) => line.includes('2 stores'))).toBe(true)
  })
})
