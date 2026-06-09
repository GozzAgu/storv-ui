import { ref } from 'vue'

export interface PaymentLinkListItem {
  token: string
  invoiceNumber: string
  customerName: string
  customerPhone: string
  itemsCount: number
  total: number
  status: 'unpaid' | 'paid' | 'failed' | 'expired'
  url: string
  createdAtMs: number
  paidAtMs: number
}

export interface PaymentLinkStats {
  collected: number
  paid: number
  unpaid: number
  failed: number
}

export interface PayoutStatus {
  connected: boolean
  bankName?: string
  accountName?: string
  accountNumberLast4?: string
  percentageCharge?: number
}

export interface SettlementItem {
  id: number
  status: string
  amount: number
  dateMs: number
}

export interface CreateLinkItemInput {
  itemId: string
  folderId: string
  quantity: number
}

/** Client wrapper around the server payment-link endpoints. All money/stock logic is server-side. */
export function usePaymentLinks() {
  const { authFetch } = useAuthenticatedFetch()

  const payout = ref<PayoutStatus>({ connected: false })
  const links = ref<PaymentLinkListItem[]>([])
  const stats = ref<PaymentLinkStats>({ collected: 0, paid: 0, unpaid: 0, failed: 0 })
  const settlements = ref<SettlementItem[]>([])
  const settlementSummary = ref<{ pendingTotal: number; settledTotal: number; lastSettledAtMs: number }>({
    pendingTotal: 0,
    settledTotal: 0,
    lastSettledAtMs: 0,
  })
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function isDemo(): Promise<boolean> {
    const { isDemoModeActive } = await import('~/utils/demo-mode')
    return isDemoModeActive()
  }

  async function resolveScope(): Promise<{ ownerUserId: string; storeId: string }> {
    const ownerUserId = await getQueryUserId()
    const storeId = await getCurrentStoreId()
    if (!ownerUserId || !storeId) throw new Error('No store selected')
    return { ownerUserId, storeId }
  }

  async function loadPayout() {
    if (await isDemo()) {
      const { getDemoPayout } = await import('~/utils/demo-payment-links')
      payout.value = getDemoPayout()
      return
    }
    const { ownerUserId, storeId } = await resolveScope()
    const res = await authFetch<{ payout: PayoutStatus }>(
      `/api/payment-links/payout?ownerUserId=${encodeURIComponent(ownerUserId)}&storeId=${encodeURIComponent(storeId)}`
    )
    payout.value = res.payout
  }

  async function loadLinks() {
    if (await isDemo()) {
      const { getDemoPaymentLinks } = await import('~/utils/demo-payment-links')
      const res = getDemoPaymentLinks()
      links.value = res.links
      stats.value = res.stats
      return
    }
    const { ownerUserId, storeId } = await resolveScope()
    const res = await authFetch<{ links: PaymentLinkListItem[]; stats: PaymentLinkStats }>(
      `/api/payment-links/list?ownerUserId=${encodeURIComponent(ownerUserId)}&storeId=${encodeURIComponent(storeId)}`
    )
    links.value = res.links
    stats.value = res.stats
  }

  async function loadSettlements() {
    if (await isDemo()) {
      const { getDemoSettlements } = await import('~/utils/demo-payment-links')
      const res = getDemoSettlements()
      settlements.value = res.settlements
      settlementSummary.value = {
        pendingTotal: res.pendingTotal,
        settledTotal: res.settledTotal,
        lastSettledAtMs: res.lastSettledAtMs,
      }
      return
    }
    const { ownerUserId, storeId } = await resolveScope()
    const res = await authFetch<{
      settlements: SettlementItem[]
      pendingTotal: number
      settledTotal: number
      lastSettledAtMs: number
    }>(
      `/api/payment-links/settlements?ownerUserId=${encodeURIComponent(ownerUserId)}&storeId=${encodeURIComponent(storeId)}`
    )
    settlements.value = res.settlements || []
    settlementSummary.value = {
      pendingTotal: res.pendingTotal || 0,
      settledTotal: res.settledTotal || 0,
      lastSettledAtMs: res.lastSettledAtMs || 0,
    }
  }

  async function loadAll() {
    loading.value = true
    error.value = null
    try {
      await Promise.all([loadPayout(), loadLinks()])
      // Settlements are best-effort (empty in test mode) — never block the page.
      loadSettlements().catch(() => {})
    } catch (e) {
      error.value = (e as Error)?.message || 'Failed to load payment links'
    } finally {
      loading.value = false
    }
  }

  async function fetchBanks(): Promise<{ name: string; code: string }[]> {
    if (await isDemo()) {
      const { DEMO_BANKS } = await import('~/utils/demo-payment-links')
      return DEMO_BANKS
    }
    const res = await authFetch<{ banks: { name: string; code: string }[] }>('/api/payment-links/banks')
    return res.banks
  }

  async function resolveAccount(accountNumber: string, bankCode: string): Promise<string> {
    if (await isDemo()) {
      const { resolveDemoAccount } = await import('~/utils/demo-payment-links')
      return resolveDemoAccount()
    }
    const res = await authFetch<{ accountName: string }>('/api/payment-links/resolve-account', {
      method: 'POST',
      body: { accountNumber, bankCode },
    })
    return res.accountName
  }

  async function connectBank(input: {
    bankCode: string
    bankName: string
    accountNumber: string
    accountName: string
    businessName?: string
  }) {
    if (await isDemo()) {
      const { connectDemoBank } = await import('~/utils/demo-payment-links')
      payout.value = connectDemoBank(input)
      return payout.value
    }
    const { ownerUserId, storeId } = await resolveScope()
    const res = await authFetch<{ payout: PayoutStatus }>('/api/payment-links/connect-bank', {
      method: 'POST',
      body: { ownerUserId, storeId, ...input },
    })
    payout.value = res.payout
    return res.payout
  }

  async function createLink(input: {
    customerName: string
    customerPhone?: string
    customerEmail?: string
    items: CreateLinkItemInput[]
  }): Promise<{ token: string; invoiceNumber: string; url: string }> {
    if (await isDemo()) {
      const { createDemoPaymentLink } = await import('~/utils/demo-payment-links')
      return createDemoPaymentLink({
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        items: input.items,
      })
    }
    const { ownerUserId, storeId } = await resolveScope()
    const res = await authFetch<{ token: string; invoiceNumber: string; url: string }>(
      '/api/payment-links/create',
      { method: 'POST', body: { ownerUserId, storeId, ...input } }
    )
    return res
  }

  return {
    payout,
    links,
    stats,
    settlements,
    settlementSummary,
    loading,
    error,
    loadAll,
    loadPayout,
    loadLinks,
    loadSettlements,
    fetchBanks,
    resolveAccount,
    connectBank,
    createLink,
  }
}
