import { describe, expect, it, beforeEach, vi } from 'vitest'
import {
  clearUserProfileCache,
  hydrateUserStoreFromCache,
  readUserProfileCache,
  writeUserProfileCache,
} from '~/utils/user-profile-cache'
import type { UserData } from '~/composables/useUser'

const sampleUser = (uid: string): UserData => ({
  uid,
  email: 'owner@example.com',
  name: 'Owner',
  role: 'superAdmin',
  subscription: 'storvv_micro',
  hasCompletedOnboarding: true,
  hasCompletedTutorial: true,
  createdAt: null,
  updatedAt: null,
})

describe('user-profile-cache', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('writes and reads profile for the same user', () => {
    const data = sampleUser('u1')
    writeUserProfileCache('u1', data)

    expect(readUserProfileCache('u1')).toEqual(data)
    expect(readUserProfileCache('u2')).toBeNull()
  })

  it('hydrates user store when cache matches', () => {
    writeUserProfileCache('u1', sampleUser('u1'))
    const store = { userData: null as UserData | null }

    expect(hydrateUserStoreFromCache(store, 'u1')).toBe(true)
    expect(store.userData?.uid).toBe('u1')
  })

  it('clears cached profile', () => {
    writeUserProfileCache('u1', sampleUser('u1'))
    clearUserProfileCache()
    expect(readUserProfileCache('u1')).toBeNull()
  })
})

describe('wait-for-auth profile helpers', () => {
  beforeEach(() => {
    vi.useRealTimers()
    localStorage.clear()
  })

  it('ensureUserProfileLoaded skips fetch when profile already loaded', async () => {
    const { ensureUserProfileLoaded } = await import('~/utils/wait-for-auth')
    const store = {
      userData: { uid: 'u1', hasCompletedOnboarding: true },
      loading: false,
      fetchUserData: vi.fn().mockResolvedValue(undefined),
    }

    await ensureUserProfileLoaded(store as any, 'u1', 100)

    expect(store.fetchUserData).not.toHaveBeenCalled()
  })

  it('ensureUserProfileLoaded hydrates from cache without blocking on fetch', async () => {
    const { ensureUserProfileLoaded } = await import('~/utils/wait-for-auth')
    writeUserProfileCache('u1', sampleUser('u1'))

    const store = {
      userData: null as UserData | null,
      loading: false,
      fetchUserData: vi.fn().mockResolvedValue(undefined),
    }

    await ensureUserProfileLoaded(store as any, 'u1', 100)

    expect(store.userData?.uid).toBe('u1')
    expect(store.fetchUserData).toHaveBeenCalledWith('u1')
  })

  it('ensureUserProfileLoaded fetches when profile missing and no cache', async () => {
    const { ensureUserProfileLoaded } = await import('~/utils/wait-for-auth')
    const store = {
      userData: null,
      loading: false,
      fetchUserData: vi.fn().mockResolvedValue(undefined),
    }

    await ensureUserProfileLoaded(store as any, 'u1', 100)

    expect(store.fetchUserData).toHaveBeenCalledWith('u1')
  })

  it('waitForUserStore resolves when loading finishes', async () => {
    const { waitForUserStore } = await import('~/utils/wait-for-auth')
    let loading = true
    const store = {
      get loading() {
        return loading
      },
    }

    setTimeout(() => {
      loading = false
    }, 20)

    await waitForUserStore(store as any, 500)
    expect(loading).toBe(false)
  })
})
