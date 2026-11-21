import { describe, it, expect } from 'vitest'
import {
  planGateMessage,
  sanitizePlanGateErrorForStaff,
  whatsAppLimitMessage,
} from '~/utils/plan-gate-message'

describe('plan-gate-message', () => {
  it('returns owner copy for super admin', () => {
    expect(planGateMessage(false, 'Upgrade in Settings.')).toBe('Upgrade in Settings.')
  })

  it('returns neutral copy for staff', () => {
    expect(planGateMessage(true, 'Upgrade in Settings.')).toBe(
      'This feature is not enabled for your workspace.'
    )
  })

  it('sanitizes upgrade errors for staff', () => {
    expect(
      sanitizePlanGateErrorForStaff('Upgrade to Storvv Medium for unlimited sends.', true)
    ).toBe('This feature is not enabled for your workspace.')
  })

  it('uses staff-safe WhatsApp limit copy', () => {
    expect(whatsAppLimitMessage(10, 10, { forStaff: true })).toContain('messaging limit')
    expect(whatsAppLimitMessage(10, 10, { forStaff: false })).toContain('Upgrade')
    // Staff copy must survive the staff sanitizer, which hides anything mentioning upgrades.
    expect(whatsAppLimitMessage(50, 50, { forStaff: true })).not.toMatch(/upgrade/i)
  })

  it('points Medium owners to Enterprise and Micro owners to Medium', () => {
    expect(whatsAppLimitMessage(50, 50, { plan: 'storvv_medium' })).toContain('Enterprise')
    expect(whatsAppLimitMessage(50, 50, { plan: 'storvv_medium' })).not.toContain('Medium for')
    expect(whatsAppLimitMessage(10, 10, { plan: 'storvv_micro' })).toContain('Storvv Medium for 50')
  })
})
