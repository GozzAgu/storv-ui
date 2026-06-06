import { describe, expect, it } from 'vitest'
import {
  formatBusinessNameFromEmail,
  resolveBusinessNameFromUserData,
} from '~/utils/receipt-business-name'

describe('receipt-business-name', () => {
  it('formats email local part as business name', () => {
    expect(formatBusinessNameFromEmail('rockstar.limited@rockstar.com')).toBe('Rockstar Limited')
  })

  it('prefers user.name over storeDetails.storeName', () => {
    const name = resolveBusinessNameFromUserData({
      uid: '1',
      email: 'rockstar.limited@rockstar.com',
      name: 'Rockstar Limited',
      role: 'superAdmin',
      subscription: 'storvv_enterprise',
      hasCompletedOnboarding: true,
      hasCompletedTutorial: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      storeDetails: { storeName: 'Golf Estate' },
    })
    expect(name).toBe('Rockstar Limited')
  })

  it('does not use storeDetails when it matches branch name', () => {
    const name = resolveBusinessNameFromUserData(
      {
        uid: '1',
        email: 'rockstar.limited@rockstar.com',
        name: '',
        role: 'superAdmin',
        subscription: 'storvv_enterprise',
        hasCompletedOnboarding: true,
        hasCompletedTutorial: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        storeDetails: { storeName: 'Port Harcourt' },
      },
      { branchName: 'Port Harcourt' },
    )
    expect(name).toBe('Rockstar Limited')
  })
})
