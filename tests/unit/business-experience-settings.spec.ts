import { describe, expect, it } from 'vitest'
import {
  applyEnabledCapabilitiesToStoreDetails,
  isProgressiveCapabilityEnabled,
  setProgressiveCapabilityEnabled,
  SOLO_PROGRESSIVE_UNLOCK_OPTIONS,
} from '~/utils/business-experience-settings'

describe('business-experience-settings', () => {
  it('lists all solo unlock options including payment links', () => {
    expect(SOLO_PROGRESSIVE_UNLOCK_OPTIONS.map((option) => option.capability)).toEqual([
      'staffManagement',
      'multiLocationAdmin',
      'rolesPermissionsAdmin',
      'approvalWorkflows',
      'paymentLinks',
    ])
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
