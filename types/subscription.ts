export type SubscriptionPlan = 'storvv_micro' | 'storvv_medium' | 'storvv_enterprise'

/** Normalize Firestore / legacy plan strings to canonical plan ids. */
export function normalizeSubscriptionPlan(raw: unknown): SubscriptionPlan {
  if (!raw || typeof raw !== 'string') return 'storvv_micro'
  const value = raw.trim().toLowerCase()
  if (value === 'storvv_enterprise' || value === 'enterprise') return 'storvv_enterprise'
  if (value === 'storvv_medium' || value === 'medium') return 'storvv_medium'
  if (value === 'storvv_micro' || value === 'micro') return 'storvv_micro'
  return 'storvv_micro'
}

/** UI/rules plan after canceled subscriptions pass their paid period. */
export function resolveEffectiveSubscriptionPlan(
  userData:
    | {
        subscription?: unknown
        subscriptionStatus?: string
        subscriptionCurrentPeriodEnd?: string
      }
    | null
    | undefined
): SubscriptionPlan {
  const stored = normalizeSubscriptionPlan(userData?.subscription)
  if (userData?.subscriptionStatus !== 'canceled') return stored
  const periodEnd = userData.subscriptionCurrentPeriodEnd
  if (!periodEnd) return stored
  const endMs = new Date(periodEnd).getTime()
  if (Number.isFinite(endMs) && Date.now() > endMs) {
    return 'storvv_micro'
  }
  return stored
}

export const SUBSCRIPTION_PLANS: Array<{ id: SubscriptionPlan; name: string }> = [
  { id: 'storvv_micro', name: 'Storvv Micro' },
  { id: 'storvv_medium', name: 'Storvv Medium' },
  { id: 'storvv_enterprise', name: 'Storvv Enterprise' },
]

/** Feature flags by plan. Used for nav gating and upgrade prompts. */
export type SubscriptionFeature =
  | 'dashboard'
  | 'inventory'
  | 'receipts'
  | 'returns'
  | 'customers'
  | 'analytics'
  | 'activity_logs'
  /** Track units lent to external resellers until sold or returned. Enterprise only. */
  | 'seller_loans'
  | 'departments'
  | 'multi_store_sync'
  | 'settings'
  | 'profile'
  | 'notifications'
  /** WhatsApp receipt share & payment nudges (Micro: monthly cap). */
  | 'whatsapp_messaging'
  /** Customer balance / credit ledger & payment reminders tied to balance. */
  | 'customer_balance'
  /** Shareable Paystack payment links for remote sales (all plans; platform fee applies). */
  | 'payment_links'
  /** Manual sales enquiry tracking and convert-to-sale (Medium+). */
  | 'sales_leads'

/** Max limits by plan (use -1 for unlimited where applicable). */
interface SubscriptionLimits {
  maxStores: number
  maxDepartmentsPerStore: number
  maxStaffPerStore: number
  /** WhatsApp sends per calendar month; -1 = unlimited. */
  maxWhatsAppMessagesPerMonth: number
}

export const FEATURES_BY_PLAN: Record<SubscriptionPlan, SubscriptionFeature[]> = {
  storvv_micro: [
    'dashboard',
    'inventory',
    'receipts',
    'returns',
    'customers',
    'departments',
    'settings',
    'profile',
    'notifications',
    'whatsapp_messaging',
    'payment_links',
  ],
  storvv_medium: [
    'dashboard',
    'inventory',
    'receipts',
    'returns',
    'customers',
    'analytics',
    'activity_logs',
    'departments',
    'settings',
    'profile',
    'notifications',
    'whatsapp_messaging',
    'customer_balance',
    'payment_links',
    'sales_leads',
  ],
  storvv_enterprise: [
    'dashboard',
    'inventory',
    'receipts',
    'returns',
    'customers',
    'analytics',
    'activity_logs',
    'seller_loans',
    'departments',
    'multi_store_sync',
    'settings',
    'profile',
    'notifications',
    'whatsapp_messaging',
    'customer_balance',
    'payment_links',
    'sales_leads',
  ],
}

const LIMITS_BY_PLAN: Record<SubscriptionPlan, SubscriptionLimits> = {
  storvv_micro: {
    maxStores: 1,
    maxDepartmentsPerStore: 1,
    maxStaffPerStore: 2,
    maxWhatsAppMessagesPerMonth: 10,
  },
  storvv_medium: {
    maxStores: 2,
    maxDepartmentsPerStore: 10,
    maxStaffPerStore: 5,
    maxWhatsAppMessagesPerMonth: -1,
  },
  storvv_enterprise: {
    maxStores: 5,
    maxDepartmentsPerStore: -1,
    maxStaffPerStore: 10,
    maxWhatsAppMessagesPerMonth: -1,
  },
}

/** Paid extras sold monthly on top of Enterprise. */
export type SubscriptionAddOnKind = 'store' | 'staff'

export const ADD_ON_ELIGIBLE_PLAN: SubscriptionPlan = 'storvv_enterprise'

/** Monthly add-on prices in naira. Must match the Paystack add-on plan amounts. */
export const SUBSCRIPTION_ADD_ON_PRICES_NGN: Record<SubscriptionAddOnKind, number> = {
  store: 5000,
  staff: 2000,
}

export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`
}

export const SUBSCRIPTION_ADD_ON_LABELS: Record<SubscriptionAddOnKind, string> = {
  store: 'Extra store',
  staff: 'Extra staff seat',
}

/** Server-written summary row on the owner doc (`subscriptionAddOns`). */
export interface SubscriptionAddOnEntry {
  id: string
  kind: SubscriptionAddOnKind
  /** Staff seats belong to one store. */
  storeId?: string
  status: 'active' | 'past_due' | 'canceled'
  /** Canceled add-ons keep counting until this date. */
  endsAt?: string
}

export interface SubscriptionAddOnTotals {
  extraStores: number
  extraStaffByStore: Record<string, number>
}

const EMPTY_ADD_ON_TOTALS: SubscriptionAddOnTotals = { extraStores: 0, extraStaffByStore: {} }

/** Add-ons that still grant capacity right now (drops malformed and expired rows). */
export function getLiveSubscriptionAddOns(
  raw: unknown,
  now = Date.now()
): SubscriptionAddOnEntry[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((entry): entry is SubscriptionAddOnEntry => {
    if (!entry || typeof entry !== 'object') return false
    const row = entry as Partial<SubscriptionAddOnEntry>
    if (typeof row.id !== 'string' || (row.kind !== 'store' && row.kind !== 'staff')) return false
    if (row.kind === 'staff' && typeof row.storeId !== 'string') return false
    if (row.status !== 'canceled') return row.status === 'active' || row.status === 'past_due'
    const endMs = row.endsAt ? new Date(row.endsAt).getTime() : NaN
    return Number.isFinite(endMs) && endMs > now
  })
}

export function summarizeSubscriptionAddOns(
  raw: unknown,
  now = Date.now()
): SubscriptionAddOnTotals {
  const totals: SubscriptionAddOnTotals = { extraStores: 0, extraStaffByStore: {} }
  for (const entry of getLiveSubscriptionAddOns(raw, now)) {
    if (entry.kind === 'store') {
      totals.extraStores += 1
    } else if (entry.storeId) {
      totals.extraStaffByStore[entry.storeId] = (totals.extraStaffByStore[entry.storeId] || 0) + 1
    }
  }
  return totals
}

/** Returns whether the plan includes the feature. */
export function planHasFeature(plan: SubscriptionPlan, feature: SubscriptionFeature): boolean {
  return FEATURES_BY_PLAN[plan]?.includes(feature) ?? false
}

/** Lowest plan tier that includes the feature (for upgrade copy). */
export function getMinimumPlanForFeature(feature: SubscriptionFeature): SubscriptionPlan | null {
  const order: SubscriptionPlan[] = ['storvv_micro', 'storvv_medium', 'storvv_enterprise']
  return order.find((plan) => planHasFeature(plan, feature)) ?? null
}

export function getPlanDisplayName(plan: SubscriptionPlan): string {
  return SUBSCRIPTION_PLANS.find((entry) => entry.id === plan)?.name ?? plan
}

/** Returns limits for the plan, raised by purchased add-ons when the plan supports them. */
export function getPlanLimits(
  plan: SubscriptionPlan,
  addOns: SubscriptionAddOnTotals = EMPTY_ADD_ON_TOTALS
): SubscriptionLimits {
  const base = LIMITS_BY_PLAN[plan] ?? LIMITS_BY_PLAN.storvv_micro
  if (plan !== ADD_ON_ELIGIBLE_PLAN || base.maxStores < 0 || addOns.extraStores <= 0) return base
  return { ...base, maxStores: base.maxStores + addOns.extraStores }
}

/** Staff cap for one store: plan allowance plus any seats bought for that store. */
export function getStaffLimitForStore(
  plan: SubscriptionPlan,
  storeId: string | null | undefined,
  addOns: SubscriptionAddOnTotals = EMPTY_ADD_ON_TOTALS
): number {
  const base = getPlanLimits(plan).maxStaffPerStore
  if (base < 0 || plan !== ADD_ON_ELIGIBLE_PLAN || !storeId) return base
  return base + (addOns.extraStaffByStore[storeId] || 0)
}

export function storeLimitReachedMessage(plan: SubscriptionPlan, maxStores: number): string {
  if (plan === 'storvv_micro') {
    return 'Storvv Micro allows 1 store. Upgrade to Medium or Enterprise to add more.'
  }
  if (plan === 'storvv_medium') {
    return `Storvv Medium allows up to ${maxStores} stores. Upgrade to Enterprise for up to ${LIMITS_BY_PLAN.storvv_enterprise.maxStores}.`
  }
  return `You're using all ${maxStores} stores on your plan. Add another store for ${formatNaira(
    SUBSCRIPTION_ADD_ON_PRICES_NGN.store
  )}/month in Settings → Plan & billing.`
}

export function staffLimitReachedMessage(plan: SubscriptionPlan, maxStaff: number): string {
  if (plan === 'storvv_micro') {
    return `Storvv Micro allows up to ${maxStaff} staff per store. Upgrade to Medium or Enterprise for more.`
  }
  if (plan === 'storvv_medium') {
    return `Storvv Medium allows up to ${maxStaff} staff per store. Upgrade to Enterprise for ${LIMITS_BY_PLAN.storvv_enterprise.maxStaffPerStore} per store.`
  }
  return `This store is using all ${maxStaff} staff seats. Add a seat for ${formatNaira(
    SUBSCRIPTION_ADD_ON_PRICES_NGN.staff
  )}/month in Settings → Plan & billing.`
}

/** Normalize Firestore Timestamp / Date / string for sorting. Missing dates sort last (newest), so limits trim undated stores first when over capacity. */
export function storeCreatedAtMillis(createdAt: unknown): number {
  if (createdAt == null) return Number.MAX_SAFE_INTEGER
  if (typeof createdAt === 'object' && createdAt !== null && 'toMillis' in createdAt) {
    const fn = (createdAt as { toMillis?: () => number }).toMillis
    if (typeof fn === 'function') return fn.call(createdAt)
  }
  if (createdAt instanceof Date) return createdAt.getTime()
  if (typeof createdAt === 'string' || typeof createdAt === 'number') {
    const t = new Date(createdAt).getTime()
    return Number.isFinite(t) ? t : Number.MAX_SAFE_INTEGER
  }
  return Number.MAX_SAFE_INTEGER
}

/**
 * Stores the plan allows the account to **view and switch to** (e.g. after downgrade).
 * Keeps the oldest stores by `createdAt` up to `maxStores`; unlimited plans return all.
 */
export function getEligibleStoresForPlan<T extends { id: string; createdAt?: unknown }>(
  stores: T[],
  plan: SubscriptionPlan,
  addOns: SubscriptionAddOnTotals = EMPTY_ADD_ON_TOTALS
): T[] {
  const max = getPlanLimits(plan, addOns).maxStores
  if (max < 0) return [...stores]
  const sorted = [...stores].sort((a, b) => {
    const da = storeCreatedAtMillis(a.createdAt)
    const db = storeCreatedAtMillis(b.createdAt)
    if (da !== db) return da - db
    return a.id.localeCompare(b.id)
  })
  return sorted.slice(0, max)
}

/** Human-readable feature summary per plan (Settings “Compare plans”, upgrade copy). */
export const SUBSCRIPTION_FEATURE_SUMMARY: Record<SubscriptionPlan, string[]> = {
  storvv_micro: [
    '1 store · 1 department · up to 2 staff',
    'Inventory (categories, subcategories, serial/bulk) & sales',
    'Receipts, returns, customers, Quick Sale & Create New Sale',
    'Dashboard, notifications, help center & Storvv Assistant',
    'Paystack payment links',
    'WhatsApp receipt sharing (10/month)',
    'Web dashboard & iOS app',
    'Solo workspace at signup (Just me) or full Business layout',
    'Upgrade to paid plans anytime in Settings',
  ],
  storvv_medium: [
    'Everything in Micro',
    'Up to 2 stores · 10 departments · 5 staff per store',
    'Analytics, activity logs & PDF/Excel exports',
    'Sales leads (enquiry pipeline → receipt)',
    'Customer balance / credit ledger',
    'Unlimited WhatsApp receipts',
    'Duplicate categories within the same branch',
    'Paystack auto-renew · billing history · cancel anytime in Settings',
  ],
  storvv_enterprise: [
    'Everything in Medium',
    'Up to 5 stores · 10 staff per store · unlimited departments',
    `Add stores (${formatNaira(SUBSCRIPTION_ADD_ON_PRICES_NGN.store)}/mo, ${
      LIMITS_BY_PLAN.storvv_enterprise.maxStaffPerStore
    } staff each) or staff seats (${formatNaira(SUBSCRIPTION_ADD_ON_PRICES_NGN.staff)}/mo) anytime`,
    'Multi-store sync & stock transfers',
    'Copy from branch (category templates across stores)',
    'Stock loans for serial-tracked inventory',
    'Priority support',
    'Paystack auto-renew · billing history · cancel anytime in Settings',
  ],
}

/** Short exclusion line for pricing cards (landing & upsell). */
export const SUBSCRIPTION_PLAN_NOT_INCLUDED: Partial<Record<SubscriptionPlan, string>> = {
  storvv_micro:
    'No analytics, sales leads, activity logs, customer balance ledger, duplicate category, or multi-store tools',
  storvv_medium: 'No stock transfers, copy-from-branch, or stock loans (Enterprise)',
}
