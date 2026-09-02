import { describe, expect, it } from 'vitest'
import { filterStoresForBusinessExperience } from '~/utils/branch-experience'

const stores = [
  { id: 'a', name: 'Lagos', isActive: true },
  { id: 'b', name: 'Abuja', isActive: true },
] as const

describe('filterStoresForBusinessExperience', () => {
  it('returns all stores when multi-location is allowed', () => {
    expect(
      filterStoresForBusinessExperience([...stores], {
        canManageBranches: true,
        currentStoreId: 'a',
      })
    ).toHaveLength(2)
  })

  it('returns only the current store for solo/simple experience', () => {
    expect(
      filterStoresForBusinessExperience([...stores], {
        canManageBranches: false,
        currentStoreId: 'b',
      })
    ).toEqual([stores[1]])
  })

  it('falls back to the first store when current is missing', () => {
    expect(
      filterStoresForBusinessExperience([...stores], {
        canManageBranches: false,
        currentStoreId: null,
      })
    ).toEqual([stores[0]])
  })

  it('keeps a single store unchanged', () => {
    expect(
      filterStoresForBusinessExperience([stores[0]], {
        canManageBranches: false,
        currentStoreId: 'a',
      })
    ).toEqual([stores[0]])
  })
})
