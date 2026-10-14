import { describe, expect, it } from 'vitest'
import { mergeStoreInfoIntoDetails } from '~/utils/store-details-merge'

const info = {
  storeName: 'New Name',
  storeEmail: 'shop@example.com',
  storePhone: '0800',
  storeAddress: '1 Allen Avenue',
  storeDescription: 'Phones',
}

describe('mergeStoreInfoIntoDetails', () => {
  it('keeps settings, experience mode and features while replacing the five business fields', () => {
    const merged = mergeStoreInfoIntoDetails(
      {
        storeName: 'Old',
        storePhone: '0700',
        experienceMode: 'solo',
        enabledCapabilities: ['staffManagement'],
        onboardingExperienceChosen: true,
        settings: {
          receipt: { prefix: 'INV-', nextNumber: 2000, autoPrint: true },
          payment: { paymentMethods: ['Cash'] },
        },
      } as never,
      info
    )
    expect(merged).toMatchObject({
      ...info,
      experienceMode: 'solo',
      enabledCapabilities: ['staffManagement'],
      onboardingExperienceChosen: true,
      settings: {
        receipt: { prefix: 'INV-', nextNumber: 2000, autoPrint: true },
        payment: { paymentMethods: ['Cash'] },
      },
    })
  })

  it('works when nothing is saved yet', () => {
    expect(mergeStoreInfoIntoDetails(undefined, info)).toEqual(info)
  })
})
