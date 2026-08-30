import { describe, expect, it } from 'vitest'
import {
  applyEnabledCapabilitiesToStoreDetails,
  filterEnabledCapabilitiesForPlan,
  getProgressiveUnlockOptionsForPlan,
  isProgressiveCapabilityEnabled,
  isProgressiveUnlockAvailableForPlan,
  setProgressiveCapabilityEnabled,
  SOLO_PROGRESSIVE_UNLOCK_OPTIONS,
} from '~/utils/business-experience-settings'

describe('business-experience-settings', () => {
  it('lists all solo unlock options in catalog order', () => {
    expect(SOLO_PROGRESSIVE_UNLOCK_OPTIONS.map((option) => option.capability)).toEqual([
      'staffManagement',
      'multiLocationAdmin',
      'rolesPermissionsAdmin',
      'approvalWorkflows',
      'paymentLinks',
    ])
  })

  it('filters progressive unlock options by subscription plan', () => {
    expect(
      getProgressiveUnlockOptionsForPlan('storvv_micro').map((option) => option.capability)
    ).toEqual(['staffManagement', 'rolesPermissionsAdmin', 'paymentLinks'])

    expect(
      getProgressiveUnlockOptionsForPlan('storvv_medium').map((option) => option.capability)
    ).toEqual([
      'staffManagement',
      'multiLocationAdmin',
      'rolesPermissionsAdmin',
      'paymentLinks',
    ])

    expect(
      getProgressiveUnlockOptionsForPlan('storvv_enterprise').map((option) => option.capability)
    ).toEqual([
      'staffManagement',
      'multiLocationAdmin',
      'rolesPermissionsAdmin',
      'approvalWorkflows',
      'paymentLinks',
    ])
  })

  it('maps plan requirements for each capability', () => {
    expect(isProgressiveUnlockAvailableForPlan('staffManagement', 'storvv_micro')).toBe(true)
    expect(isProgressiveUnlockAvailableForPlan('multiLocationAdmin', 'storvv_micro')).toBe(false)
    expect(isProgressiveUnlockAvailableForPlan('multiLocationAdmin', 'storvv_medium')).toBe(true)
    expect(isProgressiveUnlockAvailableForPlan('approvalWorkflows', 'storvv_medium')).toBe(false)
    expect(isProgressiveUnlockAvailableForPlan('approvalWorkflows', 'storvv_enterprise')).toBe(
      true
    )
    expect(isProgressiveUnlockAvailableForPlan('paymentLinks', 'storvv_micro')).toBe(true)
  })

  it('drops enabled capabilities that are unavailable on the plan', () => {
    expect(
      filterEnabledCapabilitiesForPlan(
        ['staffManagement', 'multiLocationAdmin', 'approvalWorkflows'],
        'storvv_micro'
      )
    ).toEqual(['staffManagement'])
  })

  it('toggles capabilities without duplicates or unknown keys', () => {
    expect(
      setProgressiveCapabilityEnabled([], 'staffManagement', true)
    ).toEqual(['staffManagement'])

    expect(
      setProgressiveCapabilityEnabled(['staffManagement'], 'staffManagement', true)
    ).toEqual(['staffManagement'])

    expect(
      setProgressiveCapabilityEnabled(['staffManagement'], 'multiLocationAdmin', true)
    ).toEqual(['staffManagement', 'multiLocationAdmin'])

    expect(
      setProgressiveCapabilityEnabled(
        ['staffManagement', 'multiLocationAdmin'],
        'staffManagement',
        false
      )
    ).toEqual(['multiLocationAdmin'])

    expect(
      setProgressiveCapabilityEnabled(['not-a-capability' as 'staffManagement'], 'staffManagement', true)
    ).toEqual(['staffManagement'])
  })

  it('checks progressive enablement from storeDetails', () => {
    expect(isProgressiveCapabilityEnabled('staffManagement', ['staffManagement'])).toBe(true)
    expect(isProgressiveCapabilityEnabled('staffManagement', [])).toBe(false)
  })

  it('merges enabledCapabilities into storeDetails without dropping fields', () => {
    const merged = applyEnabledCapabilitiesToStoreDetails(
      {
        storeName: 'Acme',
        storeEmail: 'hello@acme.test',
        experienceMode: 'solo',
      },
      ['staffManagement']
    )

    expect(merged).toEqual({
      storeName: 'Acme',
      storeEmail: 'hello@acme.test',
      experienceMode: 'solo',
      enabledCapabilities: ['staffManagement'],
    })
  })
})
