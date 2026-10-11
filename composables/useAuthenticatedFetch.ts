import { resolveApiPath } from '~/utils/api-url'
import {
  isEmailVerificationRequiredError,
  isTwoFactorRequiredError,
} from '~/utils/security-api-errors'
import { clearTwoFactorSessionVerified } from '~/utils/two-factor-session'

export function useAuthenticatedFetch() {
  const authStore = useAuthStore()
  const router = useRouter()

  async function getAuthHeaders(): Promise<Record<string, string>> {
    if (!authStore.currentUser) throw new Error('Sign in required')
    const token = await authStore.currentUser.getIdToken()
    return { Authorization: `Bearer ${token}` }
  }

  async function handleSecurityError(error: unknown): Promise<never> {
    if (isTwoFactorRequiredError(error)) {
      const uid = authStore.currentUser?.uid
      if (uid) clearTwoFactorSessionVerified(uid)
      await router.push('/signin?verify2fa=1')
      throw error
    }
    if (isEmailVerificationRequiredError(error)) {
      await router.push('/dashboard/verify-email')
      throw error
    }
    throw error
  }

  async function authFetch<T = unknown>(
    path: string,
    options: Parameters<typeof $fetch>[1] = {}
  ): Promise<T> {
    const headers = await getAuthHeaders()
    let result: unknown
    try {
      result = await $fetch(resolveApiPath(path) as string, {
        ...options,
        headers: {
          ...(options.headers as Record<string, string> | undefined),
          ...headers,
        },
      })
    } catch (error) {
      return handleSecurityError(error)
    }
    // A host without this route serves the app shell (HTML, status 200) instead of JSON.
    if (!options.responseType && isHtmlDocument(result)) {
      throw Object.assign(new Error('Endpoint not available'), {
        statusCode: 404,
        data: {
          message: 'This feature is not available on the server yet. Please try again later.',
        },
      })
    }
    return result as T
  }

  return { getAuthHeaders, authFetch, resolveApiPath }
}

function isHtmlDocument(value: unknown): boolean {
  return typeof value === 'string' && /^\s*<(!doctype|html)/i.test(value)
}
