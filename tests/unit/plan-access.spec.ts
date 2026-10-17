import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import {
  isStoreViewOnlyOnPlan,
  pickFullAccessStaff,
  PLAN_VIEW_ONLY_ERROR,
} from '~/utils/plan-access'
import { assertPlanWritable, currentPlanViewOnlyReason } from '~/utils/plan-view-only'
import { resolveStaffPlanViewOnly } from '~/server/utils/plan-access'
import { useStoresStore } from '~/stores/stores'
import { useUserStore } from '~/stores/user'
import type { UserData } from '~/composables/useUser'
import type { Store } from '~/composables/useStores'

const stores = [
  { id: 'newest', createdAt: '2026-03-01T00:00:00Z' },
  { id: 'oldest', createdAt: '2025-01-01T00:00:00Z' },
  { id: 'middle', createdAt: '2025-06-01T00:00:00Z' },
]

describe('isStoreViewOnlyOnPlan', () => {
  it('keeps the oldest stores fully usable and makes the rest view only', () => {
    expect(isStoreViewOnlyOnPlan(stores, 'oldest', 'storvv_micro')).toBe(false)
    expect(isStoreViewOnlyOnPlan(stores, 'middle', 'storvv_micro')).toBe(true)
    expect(isStoreViewOnlyOnPlan(stores, 'newest', 'storvv_micro')).toBe(true)
    expect(isStoreViewOnlyOnPlan(stores, 'middle', 'storvv_medium')).toBe(false)
    expect(isStoreViewOnlyOnPlan(stores, 'newest', 'storvv_medium')).toBe(true)
  })

  it('is never view only for an unknown store', () => {
    expect(isStoreViewOnlyOnPlan(stores, 'missing', 'storvv_micro')).toBe(false)
  })
})

describe('pickFullAccessStaff', () => {
  const staff = [
    { id: 'c', createdAt: '2026-01-03T00:00:00Z' },
    { id: 'a', createdAt: '2026-01-01T00:00:00Z' },
    { id: 'b', createdAt: '2026-01-02T00:00:00Z' },
  ]

  it('is null when the store is within its staff count', () => {
    expect(pickFullAccessStaff(staff, 3, [])).toBeNull()
    expect(pickFullAccessStaff(staff, -1, [])).toBeNull()
  })

  it('defaults to the longest-serving staff', () => {
    expect(pickFullAccessStaff(staff, 2, undefined)).toEqual(['a', 'b'])
  })

  it("puts the owner's picks first and fills open places by age", () => {
    expect(pickFullAccessStaff(staff, 2, ['c', 'b'])).toEqual(['c', 'b'])
    expect(pickFullAccessStaff(staff, 2, ['c'])).toEqual(['c', 'a'])
  })

  it('ignores picks that left, repeats, and picks past the limit', () => {
    expect(pickFullAccessStaff(staff, 2, ['gone', 'c', 'c', 7, 'b', 'a'])).toEqual(['c', 'b'])
  })
})

describe('assertPlanWritable', () => {
  beforeEach(() => setActivePinia(createPinia()))

  function signIn(userData: Partial<UserData>, currentStoreId: string | null = null) {
    useUserStore().userData = userData as UserData
    const storesStore = useStoresStore()
    storesStore.stores = stores as unknown as Store[]
    storesStore.currentStoreId = currentStoreId
  }

  it('lets the owner write in a store the plan covers', () => {
    signIn({ role: 'superAdmin', subscription: 'storvv_micro' }, 'oldest')
    expect(currentPlanViewOnlyReason()).toBeNull()
    expect(() => assertPlanWritable()).not.toThrow()
  })

  it('stops the owner writing in a store past the plan', () => {
    signIn({ role: 'superAdmin', subscription: 'storvv_micro' }, 'newest')
    expect(currentPlanViewOnlyReason()).toBe('store')
    expect(() => assertPlanWritable()).toThrow(PLAN_VIEW_ONLY_ERROR)
  })

  it('counts a running trial as Enterprise', () => {
    const trialEndsAt = new Date(Date.now() + 86_400_000).toISOString()
    signIn({ role: 'superAdmin', subscription: 'storvv_micro', trialEndsAt }, 'newest')
    expect(currentPlanViewOnlyReason()).toBeNull()
  })

  it('follows the owner context for staff', () => {
    signIn({ role: 'staff', planViewOnly: 'staff' }, 'oldest')
    expect(currentPlanViewOnlyReason()).toBe('staff')
    signIn({ role: 'staff', planViewOnly: null }, 'oldest')
    expect(() => assertPlanWritable()).not.toThrow()
  })
})

/** Just enough of the Admin SDK for loadStorePlanAccess. */
function fakeDb(data: {
  stores: Array<{ id: string; createdAt: string; fullAccessStaffIds?: string[] }>
  staff: Record<string, Array<{ id: string; createdAt: string; status?: string }>>
}) {
  const ownerId = 'owner'
  const snap = (docs: Array<{ id: string; data: Record<string, unknown> }>) => ({
    docs: docs.map((d) => ({ id: d.id, data: () => d.data, ref: refFor(d.id) })),
  })
  const refFor = (storeId: string) => ({
    collection: (name: string) => {
      if (name !== 'staff') throw new Error(name)
      return {
        get: async () =>
          snap(
            (data.staff[storeId] ?? []).map((s) => ({
              id: s.id,
              data: { ...s, createdBy: ownerId, firstName: s.id },
            }))
          ),
      }
    },
  })
  const storeDoc = (storeId: string) => ({
    get: async () => ({
      exists: true,
      data: () => data.stores.find((s) => s.id === storeId),
    }),
    collection: () => ({
      where: () => ({ get: async () => snap([{ id: storeId, data: { createdBy: ownerId } }]) }),
    }),
  })
  const storesCollection = {
    doc: storeDoc,
    where: () => ({
      select: () => ({
        get: async () => snap(data.stores.map((s) => ({ id: s.id, data: s }))),
      }),
    }),
  }
  return {
    collection: () => ({ doc: () => ({ collection: () => storesCollection }) }),
  } as never
}

describe('resolveStaffPlanViewOnly (server)', () => {
  const db = fakeDb({
    stores: [
      { id: 'oldest', createdAt: '2025-01-01T00:00:00Z', fullAccessStaffIds: ['s3'] },
      { id: 'newer', createdAt: '2026-01-01T00:00:00Z' },
    ],
    staff: {
      oldest: [
        { id: 's1', createdAt: '2025-02-01T00:00:00Z' },
        { id: 's2', createdAt: '2025-03-01T00:00:00Z' },
        { id: 's3', createdAt: '2025-04-01T00:00:00Z' },
        { id: 'gone', createdAt: '2025-01-15T00:00:00Z', status: 'inactive' },
      ],
      newer: [{ id: 'n1', createdAt: '2026-02-01T00:00:00Z' }],
    },
  })
  const micro = { subscription: 'storvv_micro' }

  it('makes every staff member of a store past the plan view only', async () => {
    expect(await resolveStaffPlanViewOnly(db, 'owner', micro, 'newer', 'n1')).toBe('store')
  })

  it("keeps the owner's pick plus the longest-serving, the rest view only", async () => {
    expect(await resolveStaffPlanViewOnly(db, 'owner', micro, 'oldest', 's3')).toBeNull()
    expect(await resolveStaffPlanViewOnly(db, 'owner', micro, 'oldest', 's1')).toBeNull()
    expect(await resolveStaffPlanViewOnly(db, 'owner', micro, 'oldest', 's2')).toBe('staff')
  })

  it('leaves everyone with full access on Enterprise', async () => {
    const enterprise = { subscription: 'storvv_enterprise' }
    expect(await resolveStaffPlanViewOnly(db, 'owner', enterprise, 'newer', 'n1')).toBeNull()
    expect(await resolveStaffPlanViewOnly(db, 'owner', enterprise, 'oldest', 's2')).toBeNull()
  })
})
