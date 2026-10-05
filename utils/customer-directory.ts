import { getCustomerContactKey } from '~/utils/customer-key'

/** A customer derived from the sales they appear on (there is no separate customer record UI). */
export interface CustomerDirectoryEntry {
  id: string
  contactKey: string
  name: string
  email?: string
  phone?: string
  address?: string
  receipts: string[]
  totalSpent: number
  lastOrderDate: Date
  firstOrderDate: Date
}

export type CustomerDirectorySort = 'name' | 'orders' | 'spent' | 'lastOrder'

type ReceiptLike = {
  id: string
  customerName: string
  customerEmail?: string
  customerPhone?: string
  customerAddress?: string
  total: number
  date: unknown
}

function toDate(value: unknown): Date {
  if (value && typeof (value as { toDate?: unknown }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate()
  }
  return new Date(value as string | number | Date)
}

/** Groups sales by email, then phone, then name, keeping the first contact details found. */
export function buildCustomerDirectory(receipts: readonly ReceiptLike[]): CustomerDirectoryEntry[] {
  const customerMap = new Map<string, CustomerDirectoryEntry>()

  for (const receipt of receipts) {
    const key =
      receipt.customerEmail?.toLowerCase().trim() ||
      receipt.customerPhone?.trim() ||
      receipt.customerName?.toLowerCase().trim() ||
      ''
    if (!key) continue

    const receiptDate = toDate(receipt.date)
    const existing = customerMap.get(key)
    if (existing) {
      existing.receipts.push(receipt.id)
      existing.totalSpent += receipt.total
      if (receiptDate > existing.lastOrderDate) existing.lastOrderDate = receiptDate
      if (receiptDate < existing.firstOrderDate) existing.firstOrderDate = receiptDate
      if (receipt.customerEmail && !existing.email) existing.email = receipt.customerEmail
      if (receipt.customerPhone && !existing.phone) existing.phone = receipt.customerPhone
      if (receipt.customerAddress && !existing.address) existing.address = receipt.customerAddress
      continue
    }

    customerMap.set(key, {
      id: key,
      contactKey: getCustomerContactKey({
        email: receipt.customerEmail,
        phone: receipt.customerPhone,
        name: receipt.customerName,
      }),
      name: receipt.customerName,
      email: receipt.customerEmail,
      phone: receipt.customerPhone,
      address: receipt.customerAddress,
      receipts: [receipt.id],
      totalSpent: receipt.total,
      lastOrderDate: receiptDate,
      firstOrderDate: receiptDate,
    })
  }

  return Array.from(customerMap.values())
}

export function filterCustomerDirectory(
  customers: readonly CustomerDirectoryEntry[],
  query: string
): CustomerDirectoryEntry[] {
  const q = query.trim().toLowerCase()
  if (!q) return [...customers]
  return customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(q) ||
      customer.email?.toLowerCase().includes(q) ||
      customer.phone?.toLowerCase().includes(q)
  )
}

export function sortCustomerDirectory(
  customers: CustomerDirectoryEntry[],
  sortBy: CustomerDirectorySort | string
): CustomerDirectoryEntry[] {
  return customers.sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'orders':
        return b.receipts.length - a.receipts.length
      case 'spent':
        return b.totalSpent - a.totalSpent
      case 'lastOrder':
        return b.lastOrderDate.getTime() - a.lastOrderDate.getTime()
      default:
        return 0
    }
  })
}
