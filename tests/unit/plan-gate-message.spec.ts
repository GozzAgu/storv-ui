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
  })
})
