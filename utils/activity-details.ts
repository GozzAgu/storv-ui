/**
 * Structured detail stored on an activity log entry, so the Activity page can show exactly what
 * happened (who, what changed from what to what, which items, how much) instead of one line.
 * Shared by the server writers and the browser writer; the page renders it as a detail card.
 *
 * Money is stored as plain numbers with `money: true` so each viewer sees their own currency
 * formatting. Everything is size-capped by `sanitizeActivityDetails` before it is written.
 */

export type ActivityValue = string | number | boolean | null

export interface ActivityFact {
  label: string
  value: ActivityValue
  /** Format `value` as money in the viewer's currency. */
  money?: boolean
  /** Colour hint: good (green), bad (red), warn (amber). */
  tone?: 'good' | 'bad' | 'warn'
}

export interface ActivityChange {
  label: string
  from: ActivityValue
  to: ActivityValue
  money?: boolean
}

export interface ActivityLine {
  name: string
  /** Serial, SKU, model… one short line. */
  meta?: string
  qty?: number
  /** Price per unit, or the line's amount. */
  amount?: number
  /** The price before a change at checkout, shown struck through next to `amount`. */
  was?: number
  /** Short note, e.g. "Price changed by Ada". */
  note?: string
}

export interface ActivityRouteEnd {
  branch: string
  path: string[]
}

export interface ActivityDetails {
  facts?: ActivityFact[]
  changes?: ActivityChange[]
  lines?: ActivityLine[]
  /** Heading for `lines`, e.g. "Items sold". */
  linesLabel?: string
  route?: { from: ActivityRouteEnd; to: ActivityRouteEnd }
  /** In-app link, a dashboard sub-path such as "/receipts?receipt=abc". */
  link?: { label: string; path: string }
}

const MAX_FACTS = 24
const MAX_CHANGES = 40
const MAX_LINES = 60
const MAX_TEXT = 240

function text(value: unknown, max = MAX_TEXT): string {
  return String(value ?? '')
    .replace(/[\r\n\t]+/g, ' ')
    .trim()
    .slice(0, max)
}

function value(raw: unknown): ActivityValue {
  if (raw === null || raw === undefined) return null
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null
  if (typeof raw === 'boolean') return raw
  if (raw instanceof Date) return raw.toISOString()
  if (typeof raw === 'object' && typeof (raw as { toDate?: unknown }).toDate === 'function') {
    try {
      return (raw as { toDate: () => Date }).toDate().toISOString()
    } catch {
      return null
    }
  }
  return text(raw)
}

function num(raw: unknown): number | undefined {
  const n = Number(raw)
  return raw === undefined || raw === null || raw === '' || !Number.isFinite(n) ? undefined : n
}

function end(raw: unknown): ActivityRouteEnd {
  const e = (raw ?? {}) as Record<string, unknown>
  return {
    branch: text(e.branch, 120),
    path: Array.isArray(e.path)
      ? e.path
          .slice(0, 4)
          .map((p) => text(p, 120))
          .filter(Boolean)
      : [],
  }
}

/** Keeps only known, short fields so a log entry stays small and safe to render. */
export function sanitizeActivityDetails(raw: unknown): ActivityDetails | null {
  if (!raw || typeof raw !== 'object') return null
  const d = raw as Record<string, unknown>
  const out: ActivityDetails = {}

  if (Array.isArray(d.facts)) {
    const facts = d.facts
      .slice(0, MAX_FACTS)
      .map((f) => (f ?? {}) as Record<string, unknown>)
      .filter((f) => text(f.label))
      .map((f) => ({
        label: text(f.label, 60),
        value: value(f.value),
        ...(f.money === true && { money: true }),
        ...(f.tone === 'good' || f.tone === 'bad' || f.tone === 'warn'
          ? { tone: f.tone as ActivityFact['tone'] }
          : {}),
      }))
      .filter((f) => f.value !== null && f.value !== '')
    if (facts.length) out.facts = facts
  }

  if (Array.isArray(d.changes)) {
    const changes = d.changes
      .slice(0, MAX_CHANGES)
      .map((c) => (c ?? {}) as Record<string, unknown>)
      .filter((c) => text(c.label))
      .map((c) => ({
        label: text(c.label, 60),
        from: value(c.from),
        to: value(c.to),
        ...(c.money === true && { money: true }),
      }))
    if (changes.length) out.changes = changes
  }

  if (Array.isArray(d.lines)) {
    const lines = d.lines
      .slice(0, MAX_LINES)
      .map((l) => (l ?? {}) as Record<string, unknown>)
      .filter((l) => text(l.name))
      .map((l) => {
        const line: ActivityLine = { name: text(l.name, 120) }
        if (text(l.meta)) line.meta = text(l.meta, 160)
        if (num(l.qty) !== undefined) line.qty = num(l.qty)
        if (num(l.amount) !== undefined) line.amount = num(l.amount)
        if (num(l.was) !== undefined) line.was = num(l.was)
        if (text(l.note)) line.note = text(l.note, 120)
        return line
      })
    if (lines.length) {
      out.lines = lines
      if (text(d.linesLabel)) out.linesLabel = text(d.linesLabel, 60)
    }
  }

  if (d.route && typeof d.route === 'object') {
    const r = d.route as Record<string, unknown>
    out.route = { from: end(r.from), to: end(r.to) }
  }

  if (d.link && typeof d.link === 'object') {
    const l = d.link as Record<string, unknown>
    const path = text(l.path, 300)
    // In-app paths only.
    if (path.startsWith('/') && !path.startsWith('//')) {
      out.link = { label: text(l.label, 60) || 'Open', path }
    }
  }

  return Object.keys(out).length ? out : null
}

/** "Unit price" from "unitPrice" / "unit_price" for field diffs without a template label. */
export function humanizeFieldKey(key: string): string {
  const spaced = key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .trim()
  return spaced ? spaced[0]!.toUpperCase() + spaced.slice(1).toLowerCase() : key
}
