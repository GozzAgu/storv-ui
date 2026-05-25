import {
  BiometricAuth,
  BiometryError,
  BiometryErrorType,
  BiometryType,
} from '@aparajita/capacitor-biometric-auth'
import { KeychainAccess, SecureStorage } from '@aparajita/capacitor-secure-storage'
import { Capacitor } from '@capacitor/core'
import { onMounted, readonly, ref } from 'vue'
import { isCapacitorNative } from '~/utils/capacitor-env'

const STORAGE_KEY = 'storvv_biometric_login_v1'

export interface StoredLogin {
  email: string
  password: string
}

function isNativeMobile(): boolean {
  if (!isCapacitorNative()) return false
  const platform = Capacitor.getPlatform()
  return platform === 'ios' || platform === 'android'
}

/** Parse Keychain JSON; reject partial or corrupted entries. */
export function normalizeStoredLogin(stored: unknown): StoredLogin | null {
  if (stored == null) return null

  let parsed: unknown = stored
  if (typeof stored === 'string') {
    try {
      parsed = JSON.parse(stored)
    } catch {
      return null
    }
  }

  if (!parsed || typeof parsed !== 'object') return null

  const o = parsed as Record<string, unknown>
  const email = typeof o.email === 'string' ? o.email.trim() : ''
  const password = typeof o.password === 'string' ? o.password : ''

  if (!email || !password) return null

  return { email, password }
}

async function readStoredLogin(): Promise<StoredLogin | null> {
  if (!isNativeMobile()) return null

  try {
    // Prefer raw string read — avoids edge cases in object round-trip on iOS
    const raw = await SecureStorage.getItem(STORAGE_KEY)
    if (raw) {
      return normalizeStoredLogin(raw)
    }
  } catch {
    /* fall through */
  }

  try {
    const stored = await SecureStorage.get(STORAGE_KEY)
    return normalizeStoredLogin(stored)
  } catch {
    return null
  }
}

async function writeStoredLogin(email: string, password: string): Promise<boolean> {
  if (!isNativeMobile()) return false

  const payload: StoredLogin = {
    email: email.trim(),
    password,
  }

  const json = JSON.stringify(payload)

  try {
    await SecureStorage.setDefaultKeychainAccess(KeychainAccess.whenUnlockedThisDeviceOnly)
  } catch {
    /* optional */
  }

  try {
    await SecureStorage.setItem(STORAGE_KEY, json)
    const verified = await readStoredLogin()
    if (!verified || verified.email !== payload.email || verified.password !== payload.password) {
      console.warn('[NativeBiometricLogin] Keychain verify failed after save')
      return false
    }
    return true
  } catch (error) {
    console.warn('[NativeBiometricLogin] writeStoredLogin failed:', error)
    try {
      await SecureStorage.set(STORAGE_KEY, json)
      const verified = await readStoredLogin()
      return !!(
        verified &&
        verified.email === payload.email &&
        verified.password === payload.password
      )
    } catch (fallbackError) {
      console.warn('[NativeBiometricLogin] set() fallback failed:', fallbackError)
      return false
    }
  }
}

/**
 * Face ID / Touch ID + Keychain login for Capacitor iOS/Android.
 */
export function useNativeBiometricLogin() {
  const isSupported = ref(false)
  const hasSavedLogin = ref(false)
  const biometryLabel = ref('Biometrics')
  const isChecking = ref(true)

  async function refreshAvailability(): Promise<void> {
    if (!isNativeMobile()) {
      isSupported.value = false
      hasSavedLogin.value = false
      isChecking.value = false
      return
    }

    try {
      const info = await BiometricAuth.checkBiometry()
      isSupported.value = info.isAvailable === true

      if (Capacitor.getPlatform() === 'ios') {
        if (info.biometryType === BiometryType.faceId) biometryLabel.value = 'Face ID'
        else if (info.biometryType === BiometryType.touchId) biometryLabel.value = 'Touch ID'
        else biometryLabel.value = 'Biometrics'
      } else {
        biometryLabel.value = 'Biometrics'
      }

      const login = await readStoredLogin()
      hasSavedLogin.value = login !== null
    } catch {
      isSupported.value = false
      hasSavedLogin.value = false
    } finally {
      isChecking.value = false
    }
  }

  async function saveLogin(email: string, password: string): Promise<boolean> {
    const ok = await writeStoredLogin(email, password)
    hasSavedLogin.value = ok
    return ok
  }

  async function clearSavedLogin(): Promise<void> {
    if (!isNativeMobile()) return
    try {
      await SecureStorage.remove(STORAGE_KEY)
    } catch {
      /* key may not exist */
    }
    try {
      await SecureStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
    hasSavedLogin.value = false
  }

  async function getLoginAfterBiometric(): Promise<StoredLogin | null> {
    if (!isNativeMobile() || !hasSavedLogin.value) return null

    try {
      await BiometricAuth.authenticate({
        reason: `Sign in to Storvv with ${biometryLabel.value}`,
        cancelTitle: 'Cancel',
        allowDeviceCredential: true,
        iosFallbackTitle: 'Use passcode',
        androidTitle: 'Sign in',
        androidSubtitle: 'Confirm your identity',
      })
    } catch (error) {
      if (error instanceof BiometryError && error.code === BiometryErrorType.userCancel) {
        return null
      }
      throw error
    }

    const login = await readStoredLogin()
    if (!login) {
      hasSavedLogin.value = false
    }
    return login
  }

  if (import.meta.client) {
    onMounted(() => {
      void refreshAvailability()
    })
  }

  return {
    isSupported: readonly(isSupported),
    hasSavedLogin: readonly(hasSavedLogin),
    biometryLabel: readonly(biometryLabel),
    isChecking: readonly(isChecking),
    refreshAvailability,
    saveLogin,
    clearSavedLogin,
    getLoginAfterBiometric,
    isNativeMobile,
  }
}

/** Clear Keychain login (e.g. on sign out) without composable state. */
export async function clearNativeBiometricLogin(): Promise<void> {
  if (!isNativeMobile()) return
  try {
    await SecureStorage.remove(STORAGE_KEY)
  } catch {
    /* ignore */
  }
  try {
    await SecureStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
