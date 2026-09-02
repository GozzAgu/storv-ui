import { describe, expect, it } from 'vitest'
import {
  canAccessDashboardPathByBusinessExperience,
  experienceUnavailablePath,
  getRequiredBusinessCapabilityForPath,
  isBusinessExperienceExemptPath,
} from '~/utils/business-experience-routes'

describe('business-experience-routes', () => {
  it('maps department routes to staffManagement', () => {
    expect(getRequiredBusinessCapabilityForPath('/dashboard/departments')).toBe('staffManagement')
    expect(getRequiredBusinessCapabilityForPath('/dashboard/departments/dept-1')).toBe(
      'staffManagement'
    )
    expect(
      getRequiredBusinessCapabilityForPath('/dashboard/stores/store-1/departments')
    ).toBe('staffManagement')
    expect(
      getRequiredBusinessCapabilityForPath('/demo/dashboard/stores/store-1/departments')
    ).toBe('staffManagement')
  })

  it('maps multi-store sync to multiLocationAdmin', () => {
    expect(getRequiredBusinessCapabilityForPath('/dashboard/multi-store-sync')).toBe(
      'multiLocationAdmin'
    )
  })

  it('maps payment links to paymentLinks', () => {
    expect(getRequiredBusinessCapabilityForPath('/dashboard/payment-links')).toBe('paymentLinks')
  })

  it('leaves commerce routes unguarded', () => {
    expect(getRequiredBusinessCapabilityForPath('/dashboard/buybacks')).toBeNull()
    expect(getRequiredBusinessCapabilityForPath('/dashboard/leads')).toBeNull()
    expect(getRequiredBusinessCapabilityForPath('/dashboard/activity')).toBeNull()
  })

  it('exempts settings and the unavailable page', () => {
    expect(isBusinessExperienceExemptPath('/dashboard/settings')).toBe(true)
    expect(isBusinessExperienceExemptPath('/dashboard/experience-unavailable')).toBe(true)
  })

  it('allows business mode and progressive solo unlock', () => {
    expect(
      canAccessDashboardPathByBusinessExperience('/dashboard/departments', {
        experienceMode: 'business',
      })
    ).toBe(true)

    expect(
      canAccessDashboardPathByBusinessExperience('/dashboard/departments', {
        experienceMode: 'solo',
      })
    ).toBe(false)

    expect(
      canAccessDashboardPathByBusinessExperience('/dashboard/departments', {
        experienceMode: 'solo',
        enabledCapabilities: ['staffManagement'],
      })
    ).toBe(true)

    expect(
      canAccessDashboardPathByBusinessExperience('/dashboard/payment-links', {
        experienceMode: 'solo',
      })
    ).toBe(false)

    expect(
      canAccessDashboardPathByBusinessExperience('/dashboard/payment-links', {
        experienceMode: 'solo',
        enabledCapabilities: ['paymentLinks'],
      })
    ).toBe(true)
  })

  it('builds experience-unavailable URLs', () => {
    expect(experienceUnavailablePath('staffManagement')).toBe(
      '/dashboard/experience-unavailable?capability=staffManagement'
    )
  })
})
