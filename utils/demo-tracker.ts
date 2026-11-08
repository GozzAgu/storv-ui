import { readCookieChoice } from '~/utils/cookie-consent'
import {
  isDemoInsightsId,
  normalizeDemoPath,
  type DemoAction,
  type DemoTrackEvent,
} from '~/utils/demo-insights'

/**
 * Anonymous demo activity, batched and sent to /api/demo/track.
 *
 * - Ids are random and contain nothing about the person.
 * - Only time while the tab is visible counts.
 * - Visitors who chose "Essential only" cookies, or have Do Not Track or Global Privacy Control
 *   turned on, are never tracked.
 * - Until a visitor accepts all cookies, the visitor id lasts only for this tab's session, so
 *   separate visits can't be linked.
 */

const VISITOR_KEY = 'storvv-demo-visitor'
const SESSION_KEY = 'storvv-demo-insights-session'
const FLUSH_MS = 20_000

let queue: DemoTrackEvent[] = []
let currentPath: string | null = null
let visibleSince: number | null = null
let flushTimer: ReturnType<typeof setTimeout> | null = null
let listening = false
const counts = new Map<DemoAction, number>()
const startedAt = Date.now()
const pagesSeen = new Set<string>()

function randomId(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

function stored(storage: Storage | undefined, key: string): string {
  try {
    if (!storage) return randomId()
    const existing = storage.getItem(key)
    if (isDemoInsightsId(existing)) return existing
    const id = randomId()
    storage.setItem(key, id)
    return id
  } catch {
    return randomId()
  }
}

let ids: { visitorId: string; sessionId: string } | null = null

export function getDemoInsightIds(): { visitorId: string; sessionId: string } | null {
  if (!import.meta.client || !trackingAllowed()) return null
  const remember = readCookieChoice() === 'all'
  ids ??= {
    visitorId: stored(remember ? window.localStorage : window.sessionStorage, VISITOR_KEY),
    sessionId: stored(window.sessionStorage, SESSION_KEY),
  }
  return ids
}

function trackingAllowed(): boolean {
  if (!import.meta.client) return false
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean }
  return (
    nav.doNotTrack !== '1' &&
    nav.globalPrivacyControl !== true &&
    readCookieChoice() !== 'essential'
  )
}

function closePage() {
  if (currentPath && visibleSince !== null) {
    const seconds = Math.round((Date.now() - visibleSince) / 1000)
    if (seconds > 0) queue.push({ type: 'page', path: currentPath, seconds })
  }
  visibleSince = null
}

function scheduleFlush() {
  if (flushTimer) return
  flushTimer = setTimeout(() => {
    flushTimer = null
    flushDemoActivity()
  }, FLUSH_MS)
}

/** Sends what is queued. `beacon` survives the tab closing. */
export function flushDemoActivity(beacon = false) {
  const who = getDemoInsightIds()
  if (!who) {
    queue = []
    return
  }
  // Count time up to now without ending the visit.
  if (currentPath && visibleSince !== null && document.visibilityState === 'visible') {
    closePage()
    visibleSince = Date.now()
  }
  if (!queue.length) return
  const events = queue.splice(0, 40)
  const params = new URLSearchParams(window.location.search)
  let referrerHost = ''
  try {
    const ref = document.referrer ? new URL(document.referrer) : null
    if (ref && ref.host !== window.location.host) referrerHost = ref.hostname
  } catch {
    /* ignore */
  }
  const body = JSON.stringify({
    ...who,
    referrerHost,
    utmSource: params.get('utm_source') || '',
    utmCampaign: params.get('utm_campaign') || '',
    events,
  })
  try {
    if (beacon && navigator.sendBeacon) {
      navigator.sendBeacon('/api/demo/track', new Blob([body], { type: 'application/json' }))
    } else {
      void fetch('/api/demo/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => undefined)
    }
  } catch {
    /* tracking must never break the demo */
  }
  if (queue.length) scheduleFlush()
}

function listen() {
  if (listening || !import.meta.client) return
  listening = true
  document.addEventListener('visibilitychange', () => {
    if (!currentPath) return
    if (document.visibilityState === 'hidden') {
      closePage()
      flushDemoActivity(true)
    } else {
      visibleSince = Date.now()
    }
  })
  window.addEventListener('pagehide', () => {
    closePage()
    flushDemoActivity(true)
  })
}

/** Call on every route change. Leaving the demo closes the last page and sends at once. */
export function trackDemoPage(path: string) {
  const normalized = normalizeDemoPath(path)
  if (normalized) pagesSeen.add(normalized)
  if (!trackingAllowed()) return
  if (normalized === currentPath) return
  closePage()
  currentPath = normalized
  if (!normalized) {
    flushDemoActivity()
    return
  }
  listen()
  visibleSince = document.visibilityState === 'visible' ? Date.now() : null
  queue.push({ type: 'page', path: normalized, seconds: 0 })
  scheduleFlush()
}

export function trackDemoAction(name: DemoAction) {
  if (!import.meta.client) return
  counts.set(name, (counts.get(name) ?? 0) + 1)
  window.dispatchEvent(new CustomEvent('storvv:demo-action', { detail: name }))
  if (!currentPath || !trackingAllowed()) return
  queue.push({ type: 'action', name })
  scheduleFlush()
}

/** Has this visitor looked around enough to be asked anything? Works even when not tracking. */
export function demoEngagement() {
  return {
    seconds: Math.round((Date.now() - startedAt) / 1000),
    pages: pagesSeen.size,
    did: (name: DemoAction) => counts.get(name) ?? 0,
  }
}
