import { describe, it, expect } from 'vitest'
import {
  normalizeExperienceMode,
  resolveExperienceMode,
  getDefaultCapabilitiesForMode,
  canUseBusinessCapability,
  normalizeEnabledCapabilities,
  buildBusinessCapabilityContext,
  DEFAULT_EXPERIENCE_MODE,
} from '~/types/business-experience'

describe('business experience (Phase 1)', () => {
  describe('normalizeExperienceMode', () => {
    it('defaults missing and invalid values to business', () => {
      expect(normalizeExperienceMode(undefined)).toBe('business')
      expect(normalizeExperienceMode(null)).toBe('business')
      expect(normalizeExperienceMode('')).toBe('business')
      expect(normalizeExperienceMode('team')).toBe('business')
      expect(normalizeExperienceMode('enterprise')).toBe('business')
    })

    it('accepts solo and business explicitly', () => {
      expect(normalizeExperienceMode('solo')).toBe('solo')
      expect(normalizeExperienceMode('business')).toBe('business')
    })
  })

  describe('resolveExperienceMode', () => {
    it('uses business when storeDetails is absent (existing accounts)', () => {
      expect(resolveExperienceMode(undefined)).toBe(DEFAULT_EXPERIENCE_MODE)
      expect(resolveExperienceMode(null)).toBe(DEFAULT_EXPERIENCE_MODE)
      expect(resolveExperienceMode({})).toBe(DEFAULT_EXPERIENCE_MODE)
      expect(resolveExperienceMode({ experienceMode: undefined })).toBe('business')
    })

    it('respects explicit solo when set', () => {
      expect(resolveExperienceMode({ experienceMode: 'solo' })).toBe('solo')
    })
  })

  describe('getDefaultCapabilitiesForMode', () => {
    it('enables all admin capabilities in business mode', () => {
      const caps = getDefaultCapabilitiesForMode('business')
      expect(caps.staffManagement).toBe(true)
      expect(caps.multiLocationAdmin).toBe(true)
      expect(caps.rolesPermissionsAdmin).toBe(true)
      expect(caps.approvalWorkflows).toBe(true)
      expect(caps.paymentLinks).toBe(true)
    })

    it('disables admin complexity and payment links in solo mode', () => {
      const caps = getDefaultCapabilitiesForMode('solo')
      expect(caps.staffManagement).toBe(false)
      expect(caps.multiLocationAdmin).toBe(false)
      expect(caps.rolesPermissionsAdmin).toBe(false)
      expect(caps.approvalWorkflows).toBe(false)
      expect(caps.paymentLinks).toBe(false)
    })
  })

  describe('canUseBusinessCapability', () => {
    it('allows everything in business mode without progressive unlock', () => {
      expect(
        canUseBusinessCapability('staffManagement', { experienceMode: 'business' })
      ).toBe(true)
    })

    it('blocks admin capabilities in solo until progressively enabled', () => {
      expect(
        canUseBusinessCapability('staffManagement', { experienceMode: 'solo' })
      ).toBe(false)
      expect(
        canUseBusinessCapability('staffManagement', {
          experienceMode: 'solo',
          enabledCapabilities: ['staffManagement'],
        })
      ).toBe(true)
    })

    it('ignores unknown strings in enabledCapabilities', () => {
      expect(
        normalizeEnabledCapabilities(['staffManagement', 'not-a-capability', 42 as unknown as string])
      ).toEqual(['staffManagement'])
    })
  })

  describe('buildBusinessCapabilityContext', () => {
    it('builds a safe default context for legacy users', () => {
      expect(buildBusinessCapabilityContext()).toEqual({
        experienceMode: 'business',
        enabledCapabilities: [],
      })
    })
  })
})
