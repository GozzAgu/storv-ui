import type { DemoLeadSource } from '~/utils/demo-insights'
import { trackDemoAction } from '~/utils/demo-tracker'

/**
 * How the walkthrough dialog opens:
 * - `book`: someone asked for a walkthrough.
 * - `exit`: they are leaving the demo after looking around.
 * - `save`: they just did real work (a sale, new stock) that only lives in this browser.
 */
export type WalkthroughVariant = 'book' | 'exit' | 'save'

interface WalkthroughState {
  open: boolean
  variant: WalkthroughVariant
  source: DemoLeadSource
}

const SUBMITTED_KEY = 'storvv-walkthrough-requested'

/** Shared open state for the one BookWalkthroughDialog each layout mounts. */
export function useWalkthrough() {
  const state = useState<WalkthroughState>('storvv-walkthrough', () => ({
    open: false,
    variant: 'book',
    source: 'demo_banner',
  }))
  const config = useRuntimeConfig().public

  const bookingUrl = safeHttpsUrl(String(config.bookingUrl || ''))
  const whatsappNumber = String(config.salesWhatsapp || '').replace(/\D/g, '')

  function open(source: DemoLeadSource, variant: WalkthroughVariant = 'book') {
    state.value = { open: true, variant, source }
    trackDemoAction(variant === 'book' ? 'book_click' : 'prompt_shown')
  }

  function whatsappUrl(text = 'Hi Storvv, I just tried the demo and would like a walkthrough.') {
    if (!whatsappNumber) return ''
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`
  }

  return { state, open, bookingUrl, whatsappUrl, hasRequested, markRequested }
}

/** Already asked in this browser, so we stop prompting. */
export function hasRequested(): boolean {
  if (!import.meta.client) return false
  try {
    return localStorage.getItem(SUBMITTED_KEY) === '1'
  } catch {
    return false
  }
}

export function markRequested() {
  if (!import.meta.client) return
  try {
    localStorage.setItem(SUBMITTED_KEY, '1')
  } catch {
    /* ignore */
  }
}

function safeHttpsUrl(raw: string): string {
  try {
    const url = new URL(raw)
    return url.protocol === 'https:' ? url.toString() : ''
  } catch {
    return ''
  }
}
