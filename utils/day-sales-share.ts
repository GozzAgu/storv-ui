import type { DaySalesSummary } from '~/utils/day-sales-summary'

const TOP_PRODUCTS = 5

export interface DaySalesShareInput {
  storeName: string
  day: Date
  formatCurrency: (amount: number) => string
}

export type DaySalesShareResult = 'system' | 'whatsapp' | 'clipboard' | 'cancelled'

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? '' : 's'}`
}

/** WhatsApp-ready text (`*bold*`). Always names the date: "today" is wrong once forwarded. */
export function buildDaySalesShareText(
  summary: DaySalesSummary,
  input: DaySalesShareInput
): string {
  const money = input.formatCurrency
  const date = input.day.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const who = summary.mode === 'mine' ? 'My sales · ' : ''
  const lines: string[] = [`*${who}${input.storeName} · ${date}*`]

  lines.push(`Sold ${money(summary.sold)} from ${plural(summary.count, 'sale')}`)
  lines.push(`Collected ${money(summary.collected)} · Still owed ${money(summary.owed)}`)
  if (summary.refunds.count > 0) {
    lines.push(`Refunds: ${summary.refunds.count} (${money(summary.refunds.amount)})`)
  }

  if (summary.tenders.length > 0) {
    lines.push('', '*Paid by*')
    for (const tender of summary.tenders) lines.push(`${tender.method} ${money(tender.amount)}`)
  }

  if (summary.products.length > 0) {
    lines.push('', '*Top sellers*')
    for (const product of summary.products.slice(0, TOP_PRODUCTS)) {
      lines.push(`${product.name} ×${product.quantity} · ${money(product.amount)}`)
    }
    const more = summary.products.length - TOP_PRODUCTS
    if (more > 0) lines.push(`+${plural(more, 'more product')}`)
  }

  if (summary.sellers.length > 0) {
    lines.push('', '*Who sold*')
    for (const seller of summary.sellers) {
      lines.push(`${seller.name} · ${plural(seller.count, 'sale')} · ${money(seller.amount)}`)
    }
  }

  lines.push('', 'Sent from Storvv')
  return lines.join('\n')
}

/** Phone share sheet (WhatsApp is in it), else WhatsApp Web, else the clipboard. */
export async function shareDaySalesText(text: string): Promise<DaySalesShareResult> {
  if (!import.meta.client) return 'cancelled'
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ text })
      return 'system'
    } catch (error: unknown) {
      if ((error as { name?: string })?.name === 'AbortError') return 'cancelled'
    }
  }
  const opened = window.open(
    `https://wa.me/?text=${encodeURIComponent(text)}`,
    '_blank',
    'noopener,noreferrer'
  )
  if (opened !== null) return 'whatsapp'
  try {
    await navigator.clipboard.writeText(text)
    return 'clipboard'
  } catch {
    return 'cancelled'
  }
}
