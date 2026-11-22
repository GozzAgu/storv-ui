import { describe, expect, it } from 'vitest'
import {
  getMinimumPlanForFeature,
  planHasFeature,
  STOCK_OUT_LOG_FREE_DAYS,
} from '~/types/subscription'

describe('plan features for returns, stock out history and transfers', () => {
  it('puts supplier returns, full stock out history and transfers on Medium and up', () => {
    for (const feature of ['supplier_returns', 'stock_out_history', 'multi_store_sync'] as const) {
      expect(planHasFeature('storvv_micro', feature)).toBe(false)
      expect(planHasFeature('storvv_medium', feature)).toBe(true)
      expect(planHasFeature('storvv_enterprise', feature)).toBe(true)
      expect(getMinimumPlanForFeature(feature)).toBe('storvv_medium')
    }
  })

  it('keeps stock loans on Enterprise only', () => {
    expect(planHasFeature('storvv_medium', 'seller_loans')).toBe(false)
    expect(getMinimumPlanForFeature('seller_loans')).toBe('storvv_enterprise')
  })

  it('shows Micro a recent window of the stock out log', () => {
    expect(STOCK_OUT_LOG_FREE_DAYS).toBe(30)
  })
})
