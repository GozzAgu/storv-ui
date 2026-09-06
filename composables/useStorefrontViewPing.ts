/**
 * Records a single aggregate storefront view (fire-and-forget).
 */
export function useStorefrontViewPing() {
  const keyed = new Set<string>()

  function ping(slug: string, listingId?: string) {
    if (!import.meta.client) return
    const s = String(slug || '')
      .trim()
      .toLowerCase()
    if (!s) return
    const key = `${s}:${listingId || 'store'}`
    if (keyed.has(key)) return
    keyed.add(key)
    void $fetch(`/api/storefront/${encodeURIComponent(s)}/view`, {
      method: 'POST',
      body: listingId ? { listingId } : {},
    }).catch(() => undefined)
  }

  return { ping }
}
