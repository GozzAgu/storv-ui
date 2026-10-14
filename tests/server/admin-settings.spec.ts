// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { branchDetailsUpdate, sharedSettingsUpdate } from '~/server/utils/admin-settings'

function statusOf(fn: () => unknown): number | undefined {
  try {
    fn()
    return undefined
  } catch (e) {
    return (e as { statusCode?: number }).statusCode
  }
}

describe('sharedSettingsUpdate', () => {
  it('writes each section by field path only', () => {
    expect(
      Object.keys(
        sharedSettingsUpdate('business', { storeName: 'Ada Stores', storeEmail: 'a@b.co' })
      ).sort()
    ).toEqual([
      'storeDetails.storeAddress',
      'storeDetails.storeDescription',
      'storeDetails.storeEmail',
      'storeDetails.storeName',
      'storeDetails.storePhone',
    ])
    expect(
      sharedSettingsUpdate('inventory', {
        lowStockThreshold: '7',
        autoReorder: false,
        defaultCategory: 'food',
      })
    ).toEqual({
      'storeDetails.settings.inventory': {
        lowStockThreshold: 7,
        autoReorder: false,
        defaultCategory: 'food',
      },
    })
    expect(
      sharedSettingsUpdate('payment', { paymentMethods: [' Cash ', 'cash', 'OPay'] })
    ).toEqual({ 'storeDetails.settings.payment': { paymentMethods: ['Cash', 'OPay'] } })
  })

  it('rejects unknown sections and bad values', () => {
    expect(statusOf(() => sharedSettingsUpdate('subscription', { plan: 'x' }))).toBe(400)
    expect(statusOf(() => sharedSettingsUpdate('business', {}))).toBe(400)
    expect(statusOf(() => sharedSettingsUpdate('business', { storeName: 'x'.repeat(121) }))).toBe(400)
    expect(
      statusOf(() =>
        sharedSettingsUpdate('inventory', {
          lowStockThreshold: 0,
          autoReorder: false,
          defaultCategory: 'general',
        })
      )
    ).toBe(400)
    expect(
      statusOf(() =>
        sharedSettingsUpdate('inventory', {
          lowStockThreshold: 5,
          autoReorder: false,
          defaultCategory: 'weapons',
        })
      )
    ).toBe(400)
    expect(
      statusOf(() => sharedSettingsUpdate('receipt', { prefix: 'R', nextNumber: 1.5, autoPrint: true }))
    ).toBe(400)
    expect(
      statusOf(() => sharedSettingsUpdate('receipt', { prefix: 'R', nextNumber: 5, autoPrint: 'yes' }))
    ).toBe(400)
    expect(
      statusOf(() => sharedSettingsUpdate('payment', { paymentMethods: Array(31).fill('Cash') }))
    ).toBe(400)
    expect(statusOf(() => sharedSettingsUpdate('payment', { paymentMethods: [{}] }))).toBe(400)
    expect(statusOf(() => sharedSettingsUpdate('receipt', null))).toBe(400)
  })
})

describe('branchDetailsUpdate', () => {
  it('keeps only the detail fields; never whether the branch is active or who owns it', () => {
    const details = branchDetailsUpdate({
      name: 'ikeja',
      address: '1 Allen Avenue',
      isActive: false,
      ownerId: 'someone-else',
    })
    expect(Object.keys(details).sort()).toEqual([
      'address',
      'description',
      'email',
      'name',
      'phone',
      'sellScreenNote',
    ])
    expect(details.name).toBe('Ikeja')
  })

  it('requires a name', () => {
    expect(statusOf(() => branchDetailsUpdate({ name: '  ' }))).toBe(400)
    expect(statusOf(() => branchDetailsUpdate(undefined))).toBe(400)
  })
})
