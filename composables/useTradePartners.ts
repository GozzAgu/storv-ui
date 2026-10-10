import { computed, ref } from 'vue'
import type {
  NewTradeRequestInput,
  TradeAction,
  TradeLookupResult,
  TradeOverview,
  TradeReceiptView,
  TradeReplyInput,
  TradeRequestsList,
  TradeSaleLine,
  TradeSaleView,
} from '~/types/trade'

const EMPTY: TradeOverview = {
  profile: { handle: null, displayName: '', suggestedHandle: '', bankVerified: false },
  connections: [],
  canManage: false,
  canTrade: false,
  sellBlocker: 'no_access',
}

/** Client wrapper around /api/trade. Every rule (who may connect, blocks, limits) is server-side. */
export function useTradePartners() {
  const { authFetch } = useAuthenticatedFetch()
  const overview = ref<TradeOverview>(EMPTY)
  const requests = ref<TradeRequestsList>({ incoming: [], outgoing: [] })
  const sales = ref<TradeSaleView[]>([])
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

  async function loadRequests() {
    const d = await demo()
    requests.value = d
      ? d.getDemoTradeRequests()
      : await authFetch<TradeRequestsList>(`/api/trade/requests?${await query()}`)
  }

  async function ask(input: NewTradeRequestInput) {
    const d = await demo()
    if (d) d.askDemoPartners(input)
    else
      await authFetch('/api/trade/requests', {
        method: 'POST',
        body: { ...(await scope()), ...input },
      })
    await loadRequests()
  }

  async function reply(requestId: string, input: TradeReplyInput) {
    const d = await demo()
    if (d) d.replyDemoTradeRequest(requestId, input)
    else {
      await authFetch('/api/trade/requests/reply', {
        method: 'POST',
        body: { ...(await scope()), requestId, ...input },
      })
    }
    await loadRequests()
  }

  async function closeRequest(requestId: string) {
    const d = await demo()
    if (d) d.closeDemoTradeRequest(requestId)
    else {
      await authFetch('/api/trade/requests/close', {
        method: 'POST',
        body: { ...(await scope()), requestId },
      })
    }
    await loadRequests()
  }

  async function loadSales() {
    const d = await demo()
    sales.value = d
      ? d.getDemoTradeSales()
      : (await authFetch<{ sales: TradeSaleView[] }>(`/api/trade/sales?${await query()}`)).sales
  }

  /** Bill the partner who asked, using an unpaid sale. Returns the shareable payment link. */
  async function billPartner(requestId: string, receiptId: string): Promise<{ url: string }> {
    const d = await demo()
    const res = d
      ? d.billDemoPartner(requestId, receiptId)
      : await authFetch<{ id: string; url: string }>('/api/trade/sales', {
          method: 'POST',
          body: { ...(await scope()), requestId, receiptId },
        })
    await loadSales()
    return { url: res.url }
  }

  /** Paystack checkout URL for a partner's bill. In demo mode the bill is simply marked paid. */
  async function payUrl(saleId: string): Promise<string | null> {
    const d = await demo()
    if (d) {
      d.payDemoTradeSale(saleId)
      await loadSales()
      return null
    }
    const res = await authFetch<{ authorizationUrl: string }>('/api/trade/sales/pay', {
      method: 'POST',
      body: { ...(await scope()), saleId },
    })
    return res.authorizationUrl
  }

  async function saleReceipt(saleId: string): Promise<TradeReceiptView> {
    const d = await demo()
    if (d) return d.getDemoTradeReceipt(saleId)
    const res = await authFetch<{ receipt: TradeReceiptView }>(
      `/api/trade/sales/receipt?${await query({ saleId })}`
    )
    return res.receipt
  }

  /** Claims the one-time "add to inventory"; release it if nothing could be added. */
  async function claimSaleStock(saleId: string, action: 'claim' | 'release' = 'claim') {
    const d = await demo()
    if (d) return { lines: d.claimDemoTradeStock(saleId, action) }
    return authFetch<{ lines: TradeSaleLine[] }>('/api/trade/sales/stock', {
      method: 'POST',
      body: { ...(await scope()), saleId, action },
    })
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
    requests,
    sales,
    load,
    loadRequests,
    loadSales,
    billPartner,
    payUrl,
    saleReceipt,
    claimSaleStock,
    ask,
    reply,
    closeRequest,
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
