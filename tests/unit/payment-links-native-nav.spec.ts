import { describe, expect, it } from 'vitest'
import {
  resolveNativePrimaryOrder,
  NATIVE_PRIMARY_ORDER,
  NATIVE_PRIMARY_ORDER_PAYMENT_LINKS,
} from '~/utils/dashboard-native-nav'
import { shouldPromoteNativePaymentLinksTab } from '~/utils/payment-links-launch'

describe('resolveNativePrimaryOrder', () => {
  it('uses Analytics as fourth tab by default', () => {
    expect(resolveNativePrimaryOrder({ promotePaymentLinks: false })).toEqual(NATIVE_PRIMARY_ORDER)
  })

  it('promotes Payment links on native when live', () => {
    expect(resolveNativePrimaryOrder({ promotePaymentLinks: true })).toEqual(
      NATIVE_PRIMARY_ORDER_PAYMENT_LINKS
    )
  })
})

describe('shouldPromoteNativePaymentLinksTab', () => {
  it('is false so payment links stay in the More menu', () => {
    expect(shouldPromoteNativePaymentLinksTab()).toBe(false)
  })
})
