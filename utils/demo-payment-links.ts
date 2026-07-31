import type {
  CreateLinkItemInput,
  PaymentLinkListItem,
  PaymentLinkStats,
  PayoutStatus,
  SettlementItem,
} from '~/composables/usePaymentLinks'
import { demoId } from '~/utils/demo-seed'
import { normalizeEntityName } from '~/utils/capitalize-text'
import { useDemoAppStore } from '~/stores/demoApp'

const DEMO_PAYMENT_LINKS_KEY = 'storvv-demo-payment-links'
const DEMO_PAYOUT_KEY = 'storvv-demo-payout'

const DEMO_BASE_URL =
  typeof window !== 'undefined' ? window.location.origin : 'https://app.storvv.com'

/** Dummy payout account presented in the interactive demo. */
const DEFAULT_DEMO_PAYOUT: PayoutStatus = {
  connected: true,
  bankName: 'Demo Bank',
  accountName: 'Storvv Demo Store',
  accountNumberLast4: '4567',
  percentageCharge: 1.5,
}

export const DEMO_BANKS: { name: string; code: string }[] = [
  { name: 'Demo Bank', code: '001' },
  { name: 'Sample Microfinance', code: '002' },
  { name: 'Test Union Bank', code: '003' },
]

function readLinks(): PaymentLinkListItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(DEMO_PAYMENT_LINKS_KEY)
    if (!raw) return seedDemoLinks()
    const parsed = JSON.parse(raw) as PaymentLinkListItem[]
    return Array.isArray(parsed) ? parsed : seedDemoLinks()
  } catch {
    return seedDemoLinks()
  }
}

function writeLinks(links: PaymentLinkListItem[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(DEMO_PAYMENT_LINKS_KEY, JSON.stringify(links))
}

function linkUrl(token: string): string {
  return `${DEMO_BASE_URL}/pay/${token}`
}

/** Two illustrative links (one paid, one unpaid) so the demo page is never empty. */
function seedDemoLinks(): PaymentLinkListItem[] {
  const now = Date.now()
  const day = 24 * 60 * 60 * 1000
  const paidToken = 'demo_pl_paid'
  const unpaidToken = 'demo_pl_unpaid'
  const seeded: PaymentLinkListItem[] = [
    {
      token: paidToken,
      invoiceNumber: 'INV-1042',
      customerName: 'Ada Okonkwo',
      customerPhone: '0803 111 2233',
      itemsCount: 1,
      total: 485000,
      status: 'paid',
      url: linkUrl(paidToken),
      createdAtMs: now - day * 2,
      paidAtMs: now - day,
    },
    {
      token: unpaidToken,
      invoiceNumber: 'INV-1043',
      customerName: 'Tunde Bello',
      customerPhone: '0805 444 5566',
      itemsCount: 2,
      total: 33500,
      status: 'unpaid',
      url: linkUrl(unpaidToken),
      createdAtMs: now - day * 0.5,
      paidAtMs: 0,
    },
  ]
  writeLinks(seeded)
  return seeded
}

function computeStats(links: PaymentLinkListItem[]): PaymentLinkStats {
  return links.reduce<PaymentLinkStats>(
    (acc, l) => {
      if (l.status === 'paid') {
        acc.paid += 1
        acc.collected += l.total
      } else if (l.status === 'failed') {
        acc.failed += 1
      } else {
        acc.unpaid += 1
      }
      return acc
    },
    { collected: 0, paid: 0, unpaid: 0, failed: 0 }
  )
}

export function getDemoPayout(): PayoutStatus {
  if (typeof window === 'undefined') return DEFAULT_DEMO_PAYOUT
  try {
    const raw = localStorage.getItem(DEMO_PAYOUT_KEY)
    if (!raw) return DEFAULT_DEMO_PAYOUT
    const parsed = JSON.parse(raw) as PayoutStatus
    return parsed?.connected !== undefined ? parsed : DEFAULT_DEMO_PAYOUT
  } catch {
    return DEFAULT_DEMO_PAYOUT
  }
}

export function setDemoPayout(payout: PayoutStatus) {
  if (typeof window === 'undefined') return
  localStorage.setItem(DEMO_PAYOUT_KEY, JSON.stringify(payout))
}

export function getDemoPaymentLinks(): { links: PaymentLinkListItem[]; stats: PaymentLinkStats } {
  const links = readLinks().sort((a, b) => b.createdAtMs - a.createdAtMs)
  return { links, stats: computeStats(links) }
}

export function getDemoSettlements(): {
  settlements: SettlementItem[]
  pendingTotal: number
  settledTotal: number
  lastSettledAtMs: number
} {
  const { stats } = getDemoPaymentLinks()
  if (stats.collected <= 0) {
    return { settlements: [], pendingTotal: 0, settledTotal: 0, lastSettledAtMs: 0 }
  }
  const lastSettledAtMs = Date.now() - 12 * 60 * 60 * 1000
  return {
    settlements: [{ id: 1, status: 'success', amount: stats.collected, dateMs: lastSettledAtMs }],
    pendingTotal: 0,
    settledTotal: stats.collected,
    lastSettledAtMs,
  }
}

export function resolveDemoAccount(): string {
  return DEFAULT_DEMO_PAYOUT.accountName ?? 'Storvv Demo Store'
}

export function connectDemoBank(input: {
  bankName: string
  accountName: string
  accountNumber: string
}): PayoutStatus {
  const payout: PayoutStatus = {
    connected: true,
    bankName: input.bankName || 'Demo Bank',
    accountName: input.accountName || 'Storvv Demo Store',
    accountNumberLast4: input.accountNumber.slice(-4) || '0000',
    percentageCharge: 1.5,
  }
  setDemoPayout(payout)
  return payout
}

/** Create a dummy unpaid link in the demo, computing the total from demo inventory. */
export function createDemoPaymentLink(input: {
  customerName: string
  customerPhone?: string
  items: CreateLinkItemInput[]
}): { token: string; invoiceNumber: string; url: string } {
  const demo = useDemoAppStore()
  demo.hydrate()
  const allItems = demo.state.stores.flatMap((s) => s.items)

  let total = 0
  let itemsCount = 0
  for (const line of input.items) {
    const item = allItems.find((i) => i.id === line.itemId)
    if (item) {
      total += item.price * line.quantity
      itemsCount += line.quantity
    }
  }

  const existing = readLinks()
  const nextNumber = 1043 + existing.filter((l) => l.invoiceNumber.startsWith('INV-')).length + 1
  const token = demoId('demo_pl')
  const invoiceNumber = `INV-${nextNumber}`
  const link: PaymentLinkListItem = {
    token,
    invoiceNumber,
    customerName: normalizeEntityName(input.customerName) || input.customerName || 'Walk-in Customer',
    customerPhone: input.customerPhone ?? '',
    itemsCount,
    total,
    status: 'unpaid',
    url: linkUrl(token),
    createdAtMs: Date.now(),
    paidAtMs: 0,
  }
  writeLinks([link, ...existing])
  return { token, invoiceNumber, url: link.url }
}
