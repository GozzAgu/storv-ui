import { describe, expect, it, vi, beforeEach } from 'vitest'
import { ensureUserProfileLoaded, waitForUserStore } from '~/utils/wait-for-auth'

function createUserStore(overrides: Partial<{
  userData: { uid: string; hasCompletedOnboarding?: boolean } | null
  loading: boolean
  fetchUserData: ReturnType<typeof vi.fn>
}> = {}) {
  return {
    userData: overrides.userData ?? null,
    loading: overrides.loading ?? false,
    fetchUserData: overrides.fetchUserData ?? vi.fn().mockResolvedValue(undefined),
  }
}

describe('wait-for-auth profile helpers', () => {
  beforeEach(() => {
    vi.useRealTimers()
  })

  it('ensureUserProfileLoaded skips fetch when profile already loaded', async () => {
    const store = createUserStore({
      userData: { uid: 'u1', hasCompletedOnboarding: true },
    })

    await ensureUserProfileLoaded(store as any, 'u1', 100)

    expect(store.fetchUserData).not.toHaveBeenCalled()
  })

  it('ensureUserProfileLoaded fetches when profile missing', async () => {
    const store = createUserStore({
      loading: false,
      fetchUserData: vi.fn().mockResolvedValue(undefined),
    })

    await ensureUserProfileLoaded(store as any, 'u1', 100)

    expect(store.fetchUserData).toHaveBeenCalledWith('u1')
  })

  it('waitForUserStore resolves when loading finishes', async () => {
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
