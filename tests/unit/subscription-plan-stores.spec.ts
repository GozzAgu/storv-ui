import { describe, it, expect } from 'vitest'
import { getEligibleStoresForPlan } from '~/types/subscription'

describe('getEligibleStoresForPlan', () => {
  const stores = [
    { id: 'a', createdAt: { toMillis: () => 100 } },
    { id: 'b', createdAt: { toMillis: () => 200 } },
    { id: 'c', createdAt: { toMillis: () => 50 } },
  ] as const

  it('returns all stores for enterprise when under its 5-store cap', () => {
    const e = getEligibleStoresForPlan([...stores], 'storvv_enterprise')
    expect(e.map((s) => s.id).sort()).toEqual(['a', 'b', 'c'].sort())
  })

  it('enterprise keeps 5 oldest, plus one per extra-store add-on', () => {
    const seven = Array.from({ length: 7 }, (_, i) => ({
      id: String(i + 1),
      createdAt: { toMillis: () => (i + 1) * 10 },
    }))
    expect(getEligibleStoresForPlan(seven, 'storvv_enterprise').map((s) => s.id)).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
    ])
    const withAddOn = getEligibleStoresForPlan(seven, 'storvv_enterprise', {
      extraStores: 1,
      extraStaffByStore: {},
    })
    expect(withAddOn).toHaveLength(6)
  })

  it('keeps oldest stores first when micro (max 1)', () => {
    const e = getEligibleStoresForPlan([...stores], 'storvv_micro')
    expect(e.map((s) => s.id)).toEqual(['c'])
  })

  it('medium (max 2) keeps two oldest when three exist', () => {
    const e = getEligibleStoresForPlan([...stores], 'storvv_medium')
    expect(e.map((s) => s.id)).toEqual(['c', 'a'])
  })

  it('medium keeps two oldest when six exist', () => {
    const six = [
      { id: '1', createdAt: { toMillis: () => 10 } },
      { id: '2', createdAt: { toMillis: () => 20 } },
      { id: '3', createdAt: { toMillis: () => 30 } },
      { id: '4', createdAt: { toMillis: () => 40 } },
      { id: '5', createdAt: { toMillis: () => 50 } },
      { id: '6', createdAt: { toMillis: () => 60 } },
    ]
    const e = getEligibleStoresForPlan([...six], 'storvv_medium')
    expect(e.map((s) => s.id)).toEqual(['1', '2'])
  })
})
