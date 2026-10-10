import { describe, expect, it } from 'vitest'
import {
  isValidTradeHandle,
  normalizeTradeHandle,
  suggestTradeHandle,
  tradeHandleProblem,
  tradeInvitePath,
} from '~/utils/trade-handle'

describe('trade handles', () => {
  it('normalizes what people type', () => {
    expect(normalizeTradeHandle('@Ikeja Phone Hub')).toBe('ikeja-phone-hub')
    expect(normalizeTradeHandle('  Café--Lagos!! ')).toBe('cafe-lagos')
    expect(normalizeTradeHandle(undefined)).toBe('')
    expect(normalizeTradeHandle('a'.repeat(40))).toHaveLength(30)
    expect(normalizeTradeHandle(`${'a'.repeat(29)}-b`)).toBe('a'.repeat(29))
  })

  it('rejects short, malformed and reserved handles', () => {
    expect(tradeHandleProblem('ab')).toMatch(/at least 3/)
    expect(tradeHandleProblem('bad_handle')).toMatch(/letters, numbers/)
    expect(tradeHandleProblem('storvv')).toMatch(/reserved/)
    expect(tradeHandleProblem('storvv-support')).toMatch(/reserved/)
    expect(tradeHandleProblem('paystack')).toMatch(/reserved/)
    expect(isValidTradeHandle('kano-wholesale')).toBe(true)
  })

  it('suggests the storefront slug first, then the business name', () => {
    expect(suggestTradeHandle('lagos-gadgets', 'Something Else')).toBe('lagos-gadgets')
    expect(suggestTradeHandle('', 'Mama Nkechi Provisions')).toBe('mama-nkechi-provisions')
    expect(suggestTradeHandle(null, 'X')).toBe('')
    expect(suggestTradeHandle('storvv', 'Storvv')).toBe('')
  })

  it('builds the invite link path', () => {
    expect(tradeInvitePath('kano-wholesale')).toBe('/dashboard/partners?connect=kano-wholesale')
  })
})
