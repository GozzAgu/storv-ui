import { computed, ref } from 'vue'
import type { TradeAction, TradeLookupResult, TradeOverview } from '~/types/trade'

const EMPTY: TradeOverview = {
  profile: { handle: null, displayName: '', suggestedHandle: '', bankVerified: false },
  connections: [],
  canManage: false,
}

/** Client wrapper around /api/trade. Every rule (who may connect, blocks, limits) is server-side. */
export function useTradePartners() {
  const { authFetch } = useAuthenticatedFetch()
  const overview = ref<TradeOverview>(EMPTY)
  const loading = ref(false)
  const loaded = ref(false)

  async function demo() {
    const { isDemoModeActive } = await import('~/utils/demo-mode')
    return isDemoModeActive() ? import('~/utils/demo-trade') : null
  }

  async function scope() {
    const ownerUserId = await getQueryUserId()
    const storeId = await getCurrentStoreId()
    if (!ownerUserId || !storeId) throw new Error('No store selected')
    return { ownerUserId, storeId }
  }

  async function query(extra: Record<string, string> = {}) {
    return new URLSearchParams({ ...(await scope()), ...extra }).toString()
  }

  async function load() {
    loading.value = true
    try {
      const d = await demo()
      overview.value = d
        ? d.getDemoTradeOverview()
        : await authFetch<TradeOverview>(`/api/trade/overview?${await query()}`)
      loaded.value = true
    } finally {
      loading.value = false
    }
  }

  async function saveProfile(handle: string, displayName: string) {
    const d = await demo()
    if (d) {
      overview.value = d.saveDemoTradeProfile(handle, displayName)
      return
    }
    await authFetch('/api/trade/profile', {
      method: 'POST',
      body: { ...(await scope()), handle, displayName },
    })
    await load()
  }

  async function lookup(handle: string): Promise<TradeLookupResult> {
    const d = await demo()
    if (d) return d.lookupDemoTradeHandle(handle)
    return authFetch<TradeLookupResult>(`/api/trade/lookup?${await query({ handle })}`)
  }

  async function invite(handle: string) {
    const d = await demo()
    if (d) {
      overview.value = d.inviteDemoTradePartner(handle)
      return
    }
    await authFetch('/api/trade/invite', { method: 'POST', body: { ...(await scope()), handle } })
    await load()
  }

  async function respond(connectionId: string, action: TradeAction) {
    const d = await demo()
    if (d) {
      overview.value = d.respondDemoTrade(connectionId, action)
      return
    }
    await authFetch('/api/trade/respond', {
      method: 'POST',
      body: { ...(await scope()), connectionId, action },
    })
    await load()
  }

  const incoming = computed(() => overview.value.connections.filter((c) => c.state === 'incoming'))
  const outgoing = computed(() => overview.value.connections.filter((c) => c.state === 'outgoing'))
  const partners = computed(() => overview.value.connections.filter((c) => c.state === 'active'))
  const blocked = computed(() => overview.value.connections.filter((c) => c.state === 'blocked'))

  return {
    overview,
    loading,
    loaded,
    incoming,
    outgoing,
    partners,
    blocked,
    load,
    saveProfile,
    lookup,
    invite,
    respond,
  }
}

/** Message from a failed call: the server's own wording when it sent one. */
export function tradeErrorMessage(e: unknown, fallback: string): string {
  const message = (e as { data?: { message?: string } })?.data?.message
  if (message) return message
  // Demo-mode errors are plain Errors; network/fetch errors carry `data` and get the fallback.
  return e instanceof Error && !('data' in e) ? e.message : fallback
}
