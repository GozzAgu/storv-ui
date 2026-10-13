import { normalizeWhatsAppPhone } from '~/utils/whatsapp'

export type CustomerSuggestField = 'name' | 'email' | 'phone'

export interface SuggestableCustomer {
  name: string
  email?: string
  phone?: string
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
