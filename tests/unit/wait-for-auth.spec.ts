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

  it('ensureUserProfileLoaded never blocks longer than maxMs, even when the fetch hangs', async () => {
    const { ensureUserProfileLoaded } = await import('~/utils/wait-for-auth')
    let resolveFetch: () => void = () => {}
    const hangingFetch = new Promise<void>((resolve) => {
      resolveFetch = resolve
    })
    const store = {
      userData: null as { uid: string } | null,
      loading: true,
      fetchUserData: vi.fn().mockReturnValue(hangingFetch),
    }

    const start = Date.now()
    await ensureUserProfileLoaded(store as any, 'u1', 100)
    const elapsed = Date.now() - start

    expect(elapsed).toBeLessThan(300)
    expect(store.fetchUserData).toHaveBeenCalledWith('u1')
    expect(store.loading).toBe(false)

    // Cleanup: let the still-in-flight fetch resolve so it doesn't leak into other tests.
    resolveFetch()
  })

  it('ensureUserProfileLoaded uses stale (but present) cache instantly instead of blocking', async () => {
    const { ensureUserProfileLoaded } = await import('~/utils/wait-for-auth')
    const almostAYearAgo = Date.now() - 100 * 24 * 60 * 60 * 1000
    localStorage.setItem(
      'storv_user_profile_v1',
      JSON.stringify({ userId: 'u1', userData: sampleUser('u1'), cachedAt: almostAYearAgo })
    )
    // A 100-day-old entry is past the outer bound, so this should still miss and fall
    // back to a capped live fetch - confirms the outer bound is actually enforced.
    const missStore = {
      userData: null as { uid: string } | null,
      loading: false,
      fetchUserData: vi.fn().mockResolvedValue(undefined),
    }
    await ensureUserProfileLoaded(missStore as any, 'u1', 100)
    expect(missStore.userData).toBeNull()
    expect(missStore.fetchUserData).toHaveBeenCalledWith('u1')

    // A 30-day-old entry is within the outer bound - should hydrate instantly and
    // refresh in the background rather than blocking.
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
    localStorage.setItem(
      'storv_user_profile_v1',
      JSON.stringify({ userId: 'u1', userData: sampleUser('u1'), cachedAt: thirtyDaysAgo })
    )
    const hitStore = {
      userData: null as { uid: string } | null,
      loading: false,
      fetchUserData: vi.fn().mockResolvedValue(undefined),
    }
    await ensureUserProfileLoaded(hitStore as any, 'u1', 100)
    expect(hitStore.userData?.uid).toBe('u1')
    expect(hitStore.fetchUserData).toHaveBeenCalledWith('u1')
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
