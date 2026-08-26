import { describe, expect, it } from 'vitest'
import {
  IOS_TYPOGRAPHY_CLASS,
  IOS_TYPOGRAPHY_ROLES,
  IOS_TYPOGRAPHY_TABULAR_CLASS,
} from '~/types/ios-typography'

describe('ios typography tokens', () => {
  it('defines a class for every role', () => {
    for (const role of IOS_TYPOGRAPHY_ROLES) {
      expect(IOS_TYPOGRAPHY_CLASS[role]).toMatch(/^text-ios-/)
    }
  })

  it('maps roles to expected utility names', () => {
    expect(IOS_TYPOGRAPHY_CLASS.display).toBe('text-ios-display')
    expect(IOS_TYPOGRAPHY_CLASS['large-title']).toBe('text-ios-large-title')
    expect(IOS_TYPOGRAPHY_CLASS['body-emphasized']).toBe('text-ios-body-emphasized')
    expect(IOS_TYPOGRAPHY_CLASS.caption2).toBe('text-ios-caption2')
  })

  it('uses a dedicated tabular numerals class', () => {
    expect(IOS_TYPOGRAPHY_TABULAR_CLASS).toBe('ios-type-tabular')
  })
})

describe('buildIosTextClass', () => {
  it('joins role and modifiers', async () => {
    const { buildIosTextClass } = await import('~/composables/useIosTypography')
    expect(buildIosTextClass('headline')).toBe('text-ios-headline')
    expect(buildIosTextClass('footnote', { tabular: true, secondary: true })).toBe(
      'text-ios-footnote ios-type-tabular ios-type-secondary'
    )
  })
})
