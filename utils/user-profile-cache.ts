import type { UserData } from '~/composables/useUser'

const CACHE_KEY = 'storv_user_profile_v1'
/** Profiles older than this are still shown instantly but refreshed from Firestore. */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

interface CachedProfile {
  userId: string
  userData: UserData
  cachedAt: number
}

function canUseLocalStorage(): boolean {
  return typeof localStorage !== 'undefined'
}

export function readUserProfileCache(userId: string): UserData | null {
  if (!canUseLocalStorage() || !userId) return null

  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as CachedProfile
    if (parsed.userId !== userId) return null
    if (Date.now() - parsed.cachedAt > MAX_AGE_MS) return null
    if (!parsed.userData?.uid || parsed.userData.uid !== userId) return null

    return parsed.userData
  } catch {
    return null
  }
}

export function writeUserProfileCache(userId: string, userData: UserData): void {
  if (!canUseLocalStorage() || !userId) return

  try {
    const payload: CachedProfile = {
      userId,
      userData,
      cachedAt: Date.now(),
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload))
  } catch {
    /* quota / private mode */
  }
}

export function clearUserProfileCache(): void {
  if (!canUseLocalStorage()) return

  try {
    localStorage.removeItem(CACHE_KEY)
  } catch {
    /* ignore */
  }
}

/** Hydrate Pinia user store from local cache for instant dashboard / middleware unblock. */
export function hydrateUserStoreFromCache(
  userStore: { userData: UserData | null },
  userId: string
): boolean {
  if (userStore.userData?.uid === userId) return true

  const cached = readUserProfileCache(userId)
  if (!cached) return false

  userStore.userData = cached
  return true
}
