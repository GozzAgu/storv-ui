import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readonly, ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

const state = vi.hoisted(() => ({
  user: {
    uid: 'owner',
    email: 'owner@shop.com',
    getIdToken: async () => 'token',
  },
  fetchUserData: vi.fn(),
}))

vi.mock('firebase/auth', () => ({
  EmailAuthProvider: { credential: () => ({}) },
  reauthenticateWithCredential: async () => undefined,
}))
vi.mock('~/utils/firebase-client-auth', () => ({
  getFirebaseClientAuth: () => ({ currentUser: state.user }),
}))
vi.mock('~/stores/user', async () => {
  const { defineStore } = await import('pinia')
  return {
    useUserStore: defineStore('user-test', {
      state: () => ({ userData: null as Record<string, unknown> | null }),
      actions: { fetchUserData: state.fetchUserData },
    }),
  }
})

import { useFirebaseAuth } from '~/composables/useFirebaseAuth'
import { useUserStore } from '~/stores/user'
import {
  isTwoFactorSessionVerified,
  markTwoFactorSessionVerified,
} from '~/utils/two-factor-session'

describe('disable2FA', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('useState', (_key: string, init: () => unknown) => ref(init()))
    vi.stubGlobal('readonly', readonly)
    vi.stubGlobal(
      '$fetch',
      vi.fn(async () => ({ success: true }))
    )
    state.fetchUserData.mockResolvedValue(undefined)
    sessionStorage.clear()
  })

  it('marks the profile as 2FA-off before clearing the session flag, then refreshes it', async () => {
    const userStore = useUserStore()
    userStore.userData = { uid: 'owner', twoFactorEnabled: true } as never
    markTwoFactorSessionVerified('owner')

    await useFirebaseAuth().disable2FA('password', '123456')

    expect(userStore.userData).toMatchObject({ twoFactorEnabled: false })
    expect(isTwoFactorSessionVerified('owner')).toBe(false)
    expect(state.fetchUserData).toHaveBeenCalledWith('owner')
  })

  it('shows the server message instead of the raw status line', async () => {
    vi.stubGlobal(
      '$fetch',
      vi.fn(async () => {
        throw Object.assign(
          new Error('[POST] "/api/auth/2fa/disable": 401 Invalid verification code'),
          { data: { message: 'Invalid verification code' } }
        )
      })
    )
    const userStore = useUserStore()
    userStore.userData = { uid: 'owner', twoFactorEnabled: true } as never

    await expect(useFirebaseAuth().disable2FA('password', '000000')).rejects.toThrow(
      'Invalid verification code'
    )
    expect(userStore.userData).toMatchObject({ twoFactorEnabled: true })
  })
})
