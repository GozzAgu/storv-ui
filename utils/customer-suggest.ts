import { buildCustomerDirectory } from '~/utils/customer-directory'
import { normalizeWhatsAppPhone } from '~/utils/whatsapp'

export type CustomerSuggestField = 'name' | 'email' | 'phone'

export interface SuggestableCustomer {
  name: string
  email?: string
  phone?: string
}

export interface CustomerOption {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  totalOrders: number
}

type SavedCustomer = Omit<CustomerOption, 'totalOrders'> & { totalOrders?: number }

const WALK_IN = /^walk[\s-]?in(\s+customer)?$/i

function optionKey(c: { name?: string; email?: string; phone?: string }): string {
  const email = c.email?.toLowerCase().trim()
  if (email) return `e:${email}`
  const phone = c.phone ? normalizeWhatsAppPhone(c.phone) : ''
  if (phone.length >= 7) return `p:${phone}`
  return `n:${c.name?.toLowerCase().trim() ?? ''}`
}

/**
 * Everyone the store has sold to (as on the Customers page) plus saved customer records,
 * one entry per email, phone or name.
 */
export function buildCustomerOptions(
  saved: readonly SavedCustomer[],
  receipts: Parameters<typeof buildCustomerDirectory>[0]
): CustomerOption[] {
  const fromSales: CustomerOption[] = buildCustomerDirectory(receipts).map((entry) => ({
    id: entry.id,
    name: entry.name,
    email: entry.email,
    phone: entry.phone,
    address: entry.address,
    totalOrders: entry.receipts.length,
  }))
  const fromSaved: CustomerOption[] = saved.map((c) => ({ ...c, totalOrders: c.totalOrders ?? 0 }))

  const byKey = new Map<string, CustomerOption>()
  for (const option of [...fromSaved, ...fromSales]) {
    const name = option.name?.trim()
    if (!name) continue
    if (WALK_IN.test(name) && !option.email && !option.phone) continue
    const key = optionKey(option)
    const existing = byKey.get(key)
    if (!existing) {
      byKey.set(key, { ...option, name })
      continue
    }
    existing.email ||= option.email
    existing.phone ||= option.phone
    existing.address ||= option.address
    existing.totalOrders = Math.max(existing.totalOrders, option.totalOrders)
  }
  return Array.from(byKey.values()).sort((a, b) => b.totalOrders - a.totalOrders)
}

const MIN_QUERY: Record<CustomerSuggestField, number> = { name: 1, email: 2, phone: 3 }

function phoneMatch(phone: string | undefined, query: string): 0 | 1 | 2 {
  if (!phone) return 0
  const digits = query.replace(/\D/g, '')
  if (digits.length < MIN_QUERY.phone) return 0
  const stored = phone.replace(/\D/g, '')
  const storedNorm = normalizeWhatsAppPhone(phone)
  const queryNorm = normalizeWhatsAppPhone(query)
  if (stored.startsWith(digits) || storedNorm.startsWith(queryNorm)) return 2
  if (stored.includes(digits) || storedNorm.includes(queryNorm)) return 1
  return 0
}

function textMatch(value: string | undefined, query: string): 0 | 1 | 2 {
  const text = value?.toLowerCase().trim()
  if (!text) return 0
  if (text.startsWith(query)) return 2
  if (text.includes(query)) return 1
  return 0
}

/** Existing customers matching what is typed in one field; prefix matches first. */
export function suggestCustomers<T extends SuggestableCustomer>(
  customers: readonly T[],
  field: CustomerSuggestField,
  rawQuery: string,
  limit = 5
): T[] {
  const query = rawQuery.trim().toLowerCase()
  if (query.length < MIN_QUERY[field]) return []

  const scored: Array<{ customer: T; score: number; index: number }> = []
  customers.forEach((customer, index) => {
    let score: number
    if (field === 'phone') {
      score = phoneMatch(customer.phone, query)
    } else if (field === 'email') {
      score = textMatch(customer.email, query)
    } else {
      score = Math.max(
        textMatch(customer.name, query),
        textMatch(customer.email, query) ? 1 : 0,
        phoneMatch(customer.phone, query) ? 1 : 0
      )
    }
    if (score > 0) scored.push({ customer, score, index })
  })

  return scored
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map((entry) => entry.customer)
}
