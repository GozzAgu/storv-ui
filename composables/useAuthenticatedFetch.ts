import { resolveApiPath } from '~/utils/api-url'

export function useAuthenticatedFetch() {
  const authStore = useAuthStore()

  async function getAuthHeaders(): Promise<Record<string, string>> {
    if (!authStore.currentUser) throw new Error('Sign in required')
    const token = await authStore.currentUser.getIdToken()
    return { Authorization: `Bearer ${token}` }
  }

  async function authFetch<T = unknown>(
    path: string,
    options: Parameters<typeof $fetch>[1] = {}
  ): Promise<T> {
    const headers = await getAuthHeaders()
    return (await $fetch(resolveApiPath(path), {
      ...options,
      headers: {
        ...(options.headers as Record<string, string> | undefined),
        ...headers,
      },
    })) as T
  }

  return { getAuthHeaders, authFetch, resolveApiPath }
}
