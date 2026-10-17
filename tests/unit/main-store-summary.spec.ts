import { describe, expect, it } from 'vitest'
import {
  pickMainStore,
  summarizeStoreInventory,
  type SummaryFolder,
} from '~/utils/main-store-summary'

const folder = (overrides: Partial<SummaryFolder> & { id: string }): SummaryFolder => ({
  name: overrides.id,
  parentId: null,
  itemCount: 0,
  totalValue: 0,
  lowStockCount: 0,
  ...overrides,
})

describe('pickMainStore', () => {
  it('picks the first store the owner created', () => {
    const main = pickMainStore([
      { id: 'lekki', name: 'Lekki', createdAtMs: 2_000 },
      { id: 'ikeja', name: 'Ikeja', createdAtMs: 1_000 },
      { id: 'abuja', name: 'Abuja', createdAtMs: 3_000 },
    ])
    expect(main?.id).toBe('ikeja')
  })

  it('skips closed stores and puts stores without a creation time last', () => {
    const main = pickMainStore([
      { id: 'old', name: 'Old', status: 'inactive', createdAtMs: 500 },
      { id: 'unknown', name: 'Unknown', createdAtMs: null },
      { id: 'lekki', name: 'Lekki', createdAtMs: 2_000 },
    ])
    expect(main?.id).toBe('lekki')
  })

  it('returns null when there is no live store', () => {
    expect(pickMainStore([{ id: 'x', name: 'X', status: 'deleted', createdAtMs: 1 }])).toBeNull()
  })
})

describe('summarizeStoreInventory', () => {
  const folders = [
    folder({ id: 'phones', name: 'Phones' }),
    folder({
      id: 'iphone',
      parentId: 'phones',
      itemCount: 4,
      totalValue: 2_000_000,
      lowStockCount: 1,
    }),
    folder({ id: 'samsung', parentId: 'phones', itemCount: 6, totalValue: 900_000 }),
    folder({
      id: 'acc',
      name: 'Accessories',
      itemCount: 30,
      totalValue: 250_000,
      lowStockCount: 2,
    }),
  ]

  it('matches the owner inventory header totals', () => {
    const { totals } = summarizeStoreInventory(folders, { includeValue: true })
    expect(totals).toEqual({
      categories: 2,
      products: 40,
      lowStock: 2,
      totalValue: 3_150_000,
    })
  })

  it('rolls subcategories into their top-level category, sorted by name', () => {
    const { categories } = summarizeStoreInventory(folders, { includeValue: true })
    expect(categories).toEqual([
      { id: 'acc', name: 'Accessories', itemCount: 30, lowStockCount: 2, totalValue: 250_000 },
      { id: 'phones', name: 'Phones', itemCount: 10, lowStockCount: 1, totalValue: 2_900_000 },
    ])
  })

  it('leaves money out without the financial figures grant', () => {
    const { totals, categories } = summarizeStoreInventory(folders, { includeValue: false })
    expect(totals.totalValue).toBeUndefined()
    expect(categories.every((c) => c.totalValue === undefined)).toBe(true)
    expect(totals.products).toBe(40)
  })
})
