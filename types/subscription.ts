export type SubscriptionPlan = 'storvv_micro' | 'storvv_medium' | 'storvv_enterprise'

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

/** Max limits by plan (use -1 for unlimited where applicable). */
interface SubscriptionLimits {
 maxStores: number
 maxDepartmentsPerStore: number
 maxStaffPerStore: number
 /** WhatsApp sends per calendar month; -1 = unlimited. */
 maxWhatsAppMessagesPerMonth: number
}

const FEATURES_BY_PLAN: Record<SubscriptionPlan, SubscriptionFeature[]> = {
 storvv_micro: [
 'dashboard',
 'inventory',
 'receipts',
 'returns',
 'customers',
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
 maxStaffPerStore: 25,
 maxWhatsAppMessagesPerMonth: -1,
 },
 storvv_enterprise: {
 maxStores: -1,
 maxDepartmentsPerStore: -1,
 maxStaffPerStore: -1,
 maxWhatsAppMessagesPerMonth: -1,
 },
}

/** Returns whether the plan includes the feature. */
export function planHasFeature(plan: SubscriptionPlan, feature: SubscriptionFeature): boolean {
 return FEATURES_BY_PLAN[plan]?.includes(feature) ?? false
}

/** Returns limits for the plan. */
export function getPlanLimits(plan: SubscriptionPlan): SubscriptionLimits {
 return LIMITS_BY_PLAN[plan] ?? LIMITS_BY_PLAN.storvv_micro
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
 plan: SubscriptionPlan
): T[] {
 const max = getPlanLimits(plan).maxStores
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
 'Inventory, receipts, returns & customers',
 'Dashboard, notifications & help center',
 'WhatsApp receipts (10/month)',
 'Payment links (in progress)',
 ],
 storvv_medium: [
 'Everything in Micro',
 'Up to 2 stores · 10 departments · 25 staff per store',
 'Analytics, activity logs & reports',
 'Customer balance / credit ledger',
 'Unlimited WhatsApp receipts',
 'Duplicate categories (same branch)',
 ],
 storvv_enterprise: [
 'Everything in Medium',
 'Unlimited stores, departments & staff',
 'Multi-store sync & stock transfers',
 'Copy from branch (category templates)',
 'Stock loans for serial inventory',
 'Priority support',
 ],
}
