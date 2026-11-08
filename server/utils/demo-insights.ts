import { createError, getHeader, type H3Event } from 'h3'
import { FieldValue, type Firestore, type Timestamp } from 'firebase-admin/firestore'
import { getResendConfig } from '~/server/utils/delivery-config'
import { escapeHtml } from '~/server/utils/receipt-email-html'
import { logServerError } from '~/server/utils/log-server-error'
import {
  DEMO_TRACK_LIMITS,
  demoInterest,
  demoPageKey,
  demoPageLabel,
  type DemoInterest,
  type DemoLeadInput,
  type DemoTrackBatch,
} from '~/utils/demo-insights'

/**
 * Demo walkthrough requests (`demoLeads`) and anonymous demo activity (`demoSessions`).
 * Only these server routes read or write them; Firestore rules deny every client.
 */
export const DEMO_LEADS = 'demoLeads'
export const DEMO_SESSIONS = 'demoSessions'

export const DEMO_LEAD_STATUSES = ['new', 'contacted', 'booked', 'won', 'lost'] as const
export type DemoLeadStatus = (typeof DEMO_LEAD_STATUSES)[number]

export interface DemoRequestMeta {
  device: 'mobile' | 'tablet' | 'desktop'
  /** Two-letter country from the hosting platform, when it provides one we can trust. */
  country: string
}

export function demoRequestMeta(
  event: H3Event,
  env: NodeJS.ProcessEnv = process.env
): DemoRequestMeta {
  const ua = String(getHeader(event, 'user-agent') || '')
  const device = /iPad|Tablet/i.test(ua)
    ? 'tablet'
    : /Mobi|Android|iPhone/i.test(ua)
    ? 'mobile'
    : 'desktop'
  // Only the platform can set this header on Vercel; elsewhere it could be forged, so skip it.
  const rawCountry = env.VERCEL ? String(getHeader(event, 'x-vercel-ip-country') || '') : ''
  const country = /^[A-Z]{2}$/.test(rawCountry) ? rawCountry : ''
  return { device, country }
}

interface SessionDoc {
  visitorId?: string
  activeSeconds?: number
  pageViews?: number
  pages?: Record<string, { views?: number; seconds?: number }>
  actions?: Record<string, number>
  leadId?: string
}

/**
 * Adds one batch of demo activity to its session. Runs in a transaction so the page map stays
 * capped and a session id can never be reused under another visitor id.
 */
export async function recordDemoActivity(
  db: Firestore,
  batch: DemoTrackBatch,
  meta: DemoRequestMeta
): Promise<void> {
  if (!batch.events.length) return
  const ref = db.collection(DEMO_SESSIONS).doc(batch.sessionId)

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    const existing = (snap.exists ? snap.data() : undefined) as SessionDoc | undefined
    if (existing?.visitorId && existing.visitorId !== batch.visitorId) {
      throw createError({ statusCode: 409, message: 'Session belongs to another visitor' })
    }

    const knownPages = new Set(Object.keys(existing?.pages ?? {}))
    const counts = new Map<string, number>()
    const add = (field: string, n: number) => counts.set(field, (counts.get(field) ?? 0) + n)

    for (const event of batch.events) {
      if (event.type === 'page') {
        const key = demoPageKey(event.path)
        if (!knownPages.has(key)) {
          if (knownPages.size >= DEMO_TRACK_LIMITS.pagesPerSession) continue
          knownPages.add(key)
        }
        // A page event with no time is a fresh view; one with time closes out that view.
        if (event.seconds === 0) {
          add(`pages.${key}.views`, 1)
          add('pageViews', 1)
        } else {
          add(`pages.${key}.seconds`, event.seconds)
          add('activeSeconds', event.seconds)
        }
      } else {
        add(`actions.${event.name}`, 1)
      }
    }

    const update: Record<string, unknown> = {
      lastSeenAt: FieldValue.serverTimestamp(),
      pageCount: knownPages.size,
    }
    for (const [field, n] of counts) update[field] = FieldValue.increment(n)

    if (!snap.exists) {
      tx.set(ref, {
        visitorId: batch.visitorId,
        startedAt: FieldValue.serverTimestamp(),
        referrerHost: batch.referrerHost,
        utmSource: batch.utmSource,
        utmCampaign: batch.utmCampaign,
        device: meta.device,
        country: meta.country,
        activeSeconds: 0,
        pageViews: 0,
        pageCount: 0,
      })
    }
    tx.update(ref, update)
  })
}

export interface DemoSessionSummary {
  activeSeconds: number
  pageCount: number
  pageViews: number
  topPages: Array<{ label: string; seconds: number; views: number }>
  actions: Record<string, number>
  device: string
  country: string
  referrerHost: string
  utmSource: string
  utmCampaign: string
}

export function summarizeDemoSession(
  data: Record<string, unknown> | undefined
): DemoSessionSummary {
  const d = (data ?? {}) as SessionDoc & Record<string, unknown>
  const pages = Object.entries(d.pages ?? {})
    .map(([key, value]) => ({
      label: demoPageLabel(key),
      seconds: Number(value?.seconds) || 0,
      views: Number(value?.views) || 0,
    }))
    .sort((a, b) => b.seconds - a.seconds || b.views - a.views)
  const actions: Record<string, number> = {}
  for (const [name, count] of Object.entries(d.actions ?? {})) {
    const n = Number(count) || 0
    if (n > 0) actions[name] = n
  }
  return {
    activeSeconds: Number(d.activeSeconds) || 0,
    pageCount: pages.length,
    pageViews: Number(d.pageViews) || 0,
    topPages: pages.slice(0, 6),
    actions,
    device: String(d.device ?? ''),
    country: String(d.country ?? ''),
    referrerHost: String(d.referrerHost ?? ''),
    utmSource: String(d.utmSource ?? ''),
    utmCampaign: String(d.utmCampaign ?? ''),
  }
}

/**
 * Saves a walkthrough request with a snapshot of what the visitor did in the demo, and links the
 * session back to it.
 */
export async function createDemoLead(
  db: Firestore,
  lead: DemoLeadInput,
  meta: DemoRequestMeta
): Promise<{ id: string; activity: DemoSessionSummary | null; interest: DemoInterest }> {
  let activity: DemoSessionSummary | null = null
  const sessionRef = lead.sessionId ? db.collection(DEMO_SESSIONS).doc(lead.sessionId) : null
  if (sessionRef) {
    const snap = await sessionRef.get()
    const data = snap.data() as SessionDoc | undefined
    // Only link activity that this visitor actually produced.
    if (snap.exists && data?.visitorId === lead.visitorId) {
      activity = summarizeDemoSession(snap.data())
    }
  }

  const interest = demoInterest({
    activeSeconds: activity?.activeSeconds,
    pageCount: activity?.pageCount,
    actions: activity?.actions,
    hasLead: true,
  })

  const ref = await db.collection(DEMO_LEADS).add({
    ...lead,
    status: 'new' satisfies DemoLeadStatus,
    device: meta.device,
    country: meta.country,
    activity,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })

  if (sessionRef && activity) {
    await sessionRef.update({ leadId: ref.id }).catch(() => undefined)
  }
  return { id: ref.id, activity, interest }
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.round(seconds / 60)
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${minutes % 60} min`
}

const BRANCH_LABELS: Record<string, string> = {
  '1': '1 branch',
  '2-3': '2–3 branches',
  '4-10': '4–10 branches',
  '10+': 'More than 10 branches',
}

/** Emails the team about a new request. Never throws: the request is already saved. */
export async function notifyDemoLead(
  lead: DemoLeadInput,
  activity: DemoSessionSummary | null
): Promise<boolean> {
  const { apiKey, from } = getResendConfig()
  const config = useRuntimeConfig()
  const to = String(
    config.demoLeadsNotifyEmail || process.env.DEMO_LEADS_NOTIFY_EMAIL || 'hello@storvv.com'
  ).trim()
  if (!apiKey || !to) return false

  const rows: Array<[string, string]> = [
    ['Name', lead.name],
    ['Business', lead.business || '—'],
    ['WhatsApp / phone', lead.phone || '—'],
    ['Email', lead.email || '—'],
    ['Prefers', lead.preferredContact],
    ['Branches', BRANCH_LABELS[lead.branches] ?? '—'],
    ['Sells', lead.sells || '—'],
    ['Message', lead.message || '—'],
    ['From', lead.source.replace(/_/g, ' ')],
  ]
  if (activity) {
    rows.push(
      ['Time in demo', formatDuration(activity.activeSeconds)],
      ['Pages seen', String(activity.pageCount)],
      [
        'Most time on',
        activity.topPages
          .map((p) => p.label)
          .slice(0, 4)
          .join(', ') || '—',
      ],
      [
        'Did in demo',
        Object.entries(activity.actions)
          .map(([name, n]) => `${name.replace(/_/g, ' ')} ×${n}`)
          .join(', ') || '—',
      ]
    )
  }

  const html = `<h2 style="font-family:sans-serif">New walkthrough request</h2>
<table style="font-family:sans-serif;font-size:14px;border-collapse:collapse">${rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#666">${escapeHtml(
          k
        )}</td><td style="padding:4px 0">${escapeHtml(v)}</td></tr>`
    )
    .join('')}</table>`

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        from,
        to: [to],
        ...(lead.email ? { reply_to: lead.email } : {}),
        subject: `Walkthrough request: ${lead.name}${lead.business ? ` (${lead.business})` : ''}`
          .replace(/[\r\n]+/g, ' ')
          .slice(0, 150),
        html,
      }),
    })
    if (!response.ok) throw new Error(`Resend ${response.status}`)
    return true
  } catch (error) {
    logServerError('demo-leads:notify', error)
    return false
  }
}

/** Storvv team members, by verified sign-in email (STORVV_TEAM_EMAILS, comma separated). */
export function isStorvvTeamEmail(
  email: string | undefined,
  emailVerified: boolean,
  env: NodeJS.ProcessEnv = process.env
): boolean {
  if (!email || !emailVerified) return false
  let raw = ''
  try {
    raw = String(useRuntimeConfig().storvvTeamEmails || '')
  } catch {
    /* outside Nuxt (tests) */
  }
  const allowed = (raw || env.STORVV_TEAM_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  return allowed.includes(email.trim().toLowerCase())
}

export function toIso(value: unknown): string | null {
  const ts = value as Timestamp | undefined
  return ts && typeof ts.toDate === 'function' ? ts.toDate().toISOString() : null
}
