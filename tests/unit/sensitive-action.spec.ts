import { beforeEach, describe, expect, it, vi } from 'vitest'

const native = vi.hoisted(() => ({ value: false }))
const authenticate = vi.hoisted(() => vi.fn())
const notify = vi.hoisted(() => vi.fn())

vi.mock('~/utils/capacitor-env', () => ({ isCapacitorNative: () => native.value }))
vi.mock('@aparajita/capacitor-biometric-auth', () => ({ BiometricAuth: { authenticate } }))
vi.mock('~/composables/useHaptics', () => ({
  useHaptics: () => ({ impact: vi.fn(), selection: vi.fn(), notify }),
}))

import { useSensitiveAction } from '~/composables/useSensitiveAction'

describe('useSensitiveAction', () => {
  beforeEach(() => {
    authenticate.mockReset()
    notify.mockReset()
  })

  it('passes straight through on the web', async () => {
    native.value = false
    await expect(useSensitiveAction().confirm('refund')).resolves.toBe(true)
    expect(authenticate).not.toHaveBeenCalled()
  })

  it('asks for Face ID in the native app and allows the action once confirmed', async () => {
    native.value = true
    authenticate.mockResolvedValue(undefined)
    await expect(useSensitiveAction().confirm('refund')).resolves.toBe(true)
    expect(authenticate).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'Confirm this refund', allowDeviceCredential: true })
    )
  })

  it('blocks the action and warns when Face ID is cancelled or fails', async () => {
    native.value = true
    authenticate.mockRejectedValue(new Error('userCancel'))
    await expect(useSensitiveAction().confirm('discount')).resolves.toBe(false)
    expect(notify).toHaveBeenCalledWith('warning')
  })
})
