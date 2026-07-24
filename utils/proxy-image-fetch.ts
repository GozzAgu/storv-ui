import { resolveApiPath } from '~/utils/api-url'

const PROXY_MAX_GET_STRING_CHARS = 1800

async function getProxyAuthHeaders(): Promise<Record<string, string>> {
  const authStore = useAuthStore()
  if (!authStore.currentUser) {
    throw new Error('Sign in required to load receipt images')
  }
  const token = await authStore.currentUser.getIdToken()
  return { Authorization: `Bearer ${token}` }
}

/** Fetch a Firebase Storage image through the authenticated server proxy. */
export async function fetchProxiedImageBlob(absoluteUrl: string): Promise<Blob> {
  const authHeaders = await getProxyAuthHeaders()
  const usePost = absoluteUrl.length > PROXY_MAX_GET_STRING_CHARS
  const path = resolveApiPath('/api/proxy-image')

  const res = usePost
    ? await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ url: absoluteUrl }),
      })
    : await fetch(`${path}?url=${encodeURIComponent(absoluteUrl)}`, { headers: authHeaders })

  if (!res.ok) {
    throw new Error(`Image proxy ${res.status}`)
  }
  return res.blob()
}

export async function fetchProxiedImageDataUrl(absoluteUrl: string): Promise<string> {
  const blob = await fetchProxiedImageBlob(absoluteUrl)
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}
