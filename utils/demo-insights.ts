/**
 * Demo walkthrough requests and demo activity, shared by the browser and the server.
 *
 * Activity is anonymous: a random visitor id (kept in this browser) and a session id, the demo
 * pages seen and for how long, and a short list of named actions. No names, contact details or
 * store data are ever sent with it. Contact details arrive only when a visitor fills in the
 * walkthrough form, and that request is linked to their demo activity so the team can follow up.
 */

export const DEMO_LEAD_SOURCES = [
  'demo_banner',
  'demo_exit',
  'demo_save',
  'demo_menu',
  'landing_hero',
  'landing_cta',
  'landing_menu',
] as const
export type DemoLeadSource = (typeof DEMO_LEAD_SOURCES)[number]

export const DEMO_LEAD_BRANCHES = ['1', '2-3', '4-10', '10+'] as const
export type DemoLeadBranches = (typeof DEMO_LEAD_BRANCHES)[number]

export const DEMO_LEAD_CONTACT = ['whatsapp', 'call', 'email'] as const
export type DemoLeadContact = (typeof DEMO_LEAD_CONTACT)[number]

export const DEMO_LEAD_LIMITS = {
  name: 80,
  business: 100,
  email: 254,
  phone: 20,
  sells: 80,
  message: 500,
} as const

/** Named things a visitor did in the demo. Anything else is dropped. */
export const DEMO_ACTIONS = [
  'sale_created',
  'item_added',
  'receipt_edited',
  'store_created',
  'data_reset',
  'signup_click',
  'book_click',
  'whatsapp_click',
  'calendar_click',
  'exit',
  'prompt_shown',
  'prompt_dismissed',
] as const
export type DemoAction = (typeof DEMO_ACTIONS)[number]

/** Actions that show real interest in using Storvv, not just looking around. */
export const DEMO_INTENT_ACTIONS: readonly DemoAction[] = [
  'sale_created',
  'item_added',
  'receipt_edited',
  'store_created',
  'signup_click',
  'book_click',
  'whatsapp_click',
  'calendar_click',
]

export const DEMO_TRACK_LIMITS = {
  /** Events per request. */
  events: 40,
  /** Longest single stretch counted on one page (seconds); longer means the tab was left open. */
  pageSeconds: 30 * 60,
  pathLength: 80,
  /** Distinct pages kept per session, so one document cannot grow without bound. */
  pagesPerSession: 60,
} as const

const ID_PATTERN = /^[A-Za-z0-9_-]{16,64}$/
const EMAIL_PATTERN = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[A-Za-z]{2,}$/

export function isDemoInsightsId(value: unknown): value is string {
  return typeof value === 'string' && ID_PATTERN.test(value)
}

function cleanText(value: unknown, max: number): string {
  if (typeof value !== 'string') return ''
  return (
    value
      // eslint-disable-next-line no-control-regex -- strip control characters from typed text
      .replace(/[\u0000-\u001f\u007f]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, max)
  )
}

/** Digits with an optional leading +, as typed ("+234 803 000 0000" → "+2348030000000"). */
export function cleanPhone(value: unknown): string {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim()
  const digits = trimmed.replace(/\D/g, '')
  if (!digits) return ''
  return (trimmed.startsWith('+') ? '+' : '') + digits
}

export interface DemoLeadInput {
  name: string
  business: string
  email: string
  phone: string
  branches: DemoLeadBranches | ''
  sells: string
  message: string
  preferredContact: DemoLeadContact
  source: DemoLeadSource
  visitorId: string | null
  sessionId: string | null
}

export type DemoLeadValidation =
  | { ok: true; data: DemoLeadInput }
  | { ok: false; message: string; field?: keyof DemoLeadInput }

export function validateDemoLead(raw: unknown): DemoLeadValidation {
  const body = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>

  const name = cleanText(body.name, DEMO_LEAD_LIMITS.name)
  if (name.length < 2) return { ok: false, field: 'name', message: 'Enter your name.' }

  const business = cleanText(body.business, DEMO_LEAD_LIMITS.business)

  const email = cleanText(body.email, DEMO_LEAD_LIMITS.email).toLowerCase()
  if (email && !EMAIL_PATTERN.test(email)) {
    return { ok: false, field: 'email', message: 'Enter a valid email address.' }
  }

  const phone = cleanPhone(body.phone)
  const phoneDigits = phone.replace(/\D/g, '')
  if (phone && (phoneDigits.length < 7 || phoneDigits.length > 15)) {
    return { ok: false, field: 'phone', message: 'Enter a valid phone or WhatsApp number.' }
  }

  if (!email && !phone) {
    return {
      ok: false,
      field: 'phone',
      message: 'Add a WhatsApp number or an email so we can reach you.',
    }
  }

  const branches = (DEMO_LEAD_BRANCHES as readonly string[]).includes(String(body.branches))
    ? (String(body.branches) as DemoLeadBranches)
    : ''

  let preferredContact = (DEMO_LEAD_CONTACT as readonly string[]).includes(
    String(body.preferredContact)
  )
    ? (String(body.preferredContact) as DemoLeadContact)
    : phone
    ? 'whatsapp'
    : 'email'
  // Never ask the team to use a channel the visitor gave no details for.
  if (preferredContact === 'email' && !email) preferredContact = 'whatsapp'
  if (preferredContact !== 'email' && !phone) preferredContact = 'email'

  const source = (DEMO_LEAD_SOURCES as readonly string[]).includes(String(body.source))
    ? (String(body.source) as DemoLeadSource)
    : 'demo_banner'

  return {
    ok: true,
    data: {
      name,
      business,
      email,
      phone,
      branches,
      sells: cleanText(body.sells, DEMO_LEAD_LIMITS.sells),
      message: cleanText(body.message, DEMO_LEAD_LIMITS.message),
      preferredContact,
      source,
      visitorId: isDemoInsightsId(body.visitorId) ? body.visitorId : null,
      sessionId: isDemoInsightsId(body.sessionId) ? body.sessionId : null,
    },
  }
}

/**
 * Demo path with record ids folded away, so "/demo/dashboard/inventory/abc123" and
 * ".../xyz789" count as one page. Returns null for anything outside the demo.
 */
export function normalizeDemoPath(path: unknown): string | null {
  if (typeof path !== 'string') return null
  const clean = path.split(/[?#]/)[0].replace(/\/+$/, '') || '/'
  if (clean !== '/demo' && !clean.startsWith('/demo/')) return null
  const segments = clean
    .split('/')
    .filter(Boolean)
    .map((segment) => (/^[a-z][a-z-]*$/.test(segment) && segment.length <= 32 ? segment : ':id'))
  const normalized = `/${segments.join('/')}`
  return normalized.length > DEMO_TRACK_LIMITS.pathLength ? null : normalized
}

/** Firestore-safe map key for a normalized path ("/demo/dashboard/receipts" → "dashboard~receipts"). */
export function demoPageKey(path: string): string {
  const rest = path.replace(/^\/demo\/?/, '')
  return (rest || 'demo').replace(/\//g, '~').replace(/:/g, '')
}

/** The reverse of demoPageKey, for display. */
export function demoPageLabel(key: string): string {
  if (key === 'demo' || key === 'dashboard') return 'Overview'
  const parts = key
    .replace(/^dashboard~?/, '')
    .split('~')
    .filter(Boolean)
  const words = parts.filter((p) => p !== 'id').map((p) => p.replace(/-/g, ' '))
  const label = words.join(' › ') || 'Overview'
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export type DemoTrackEvent =
  | { type: 'page'; path: string; seconds: number }
  | { type: 'action'; name: DemoAction }

export interface DemoTrackBatch {
  visitorId: string
  sessionId: string
  /** Where the visitor came from, host only. */
  referrerHost: string
  utmSource: string
  utmCampaign: string
  events: DemoTrackEvent[]
}

export function validateDemoTrackBatch(raw: unknown): DemoTrackBatch | null {
  const body = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  if (!isDemoInsightsId(body.visitorId) || !isDemoInsightsId(body.sessionId)) return null
  if (!Array.isArray(body.events)) return null

  const events: DemoTrackEvent[] = []
  for (const entry of body.events.slice(0, DEMO_TRACK_LIMITS.events)) {
    if (!entry || typeof entry !== 'object') continue
    const e = entry as Record<string, unknown>
    if (e.type === 'page') {
      const path = normalizeDemoPath(e.path)
      if (!path) continue
      const seconds = Math.round(Number(e.seconds) || 0)
      events.push({
        type: 'page',
        path,
        seconds: Math.min(Math.max(seconds, 0), DEMO_TRACK_LIMITS.pageSeconds),
      })
    } else if (e.type === 'action') {
      if ((DEMO_ACTIONS as readonly string[]).includes(String(e.name))) {
        events.push({ type: 'action', name: e.name as DemoAction })
      }
    }
  }

  const referrerHost = cleanText(body.referrerHost, 100).toLowerCase()
  return {
    visitorId: body.visitorId,
    sessionId: body.sessionId,
    referrerHost: /^[a-z0-9.-]+$/.test(referrerHost) ? referrerHost : '',
    utmSource: cleanText(body.utmSource, 60),
    utmCampaign: cleanText(body.utmCampaign, 60),
    events,
  }
}

export type DemoInterest = 'hot' | 'warm' | 'cold'

/**
 * How serious a demo session looks. Asking for a walkthrough or doing real work in the demo
 * (selling, adding stock) counts most; long browsing counts some.
 */
export function demoInterest(summary: {
  activeSeconds?: number
  pageCount?: number
  actions?: Partial<Record<string, number>>
  hasLead?: boolean
}): DemoInterest {
  const seconds = summary.activeSeconds ?? 0
  const pages = summary.pageCount ?? 0
  const intent = DEMO_INTENT_ACTIONS.reduce((n, a) => n + (summary.actions?.[a] ?? 0), 0)
  if (summary.hasLead || intent >= 2 || seconds >= 10 * 60 || (intent >= 1 && pages >= 5)) {
    return 'hot'
  }
  if (intent >= 1 || seconds >= 2 * 60 || pages >= 4) return 'warm'
  return 'cold'
}
