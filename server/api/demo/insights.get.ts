import { createError, defineEventHandler } from 'h3'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { requireAuth } from '~/server/utils/store-auth'
import {
  DEMO_LEADS,
  DEMO_SESSIONS,
  isStorvvTeamEmail,
  summarizeDemoSession,
  toIso,
} from '~/server/utils/demo-insights'
import { demoInterest } from '~/utils/demo-insights'

/** Walkthrough requests and recent demo sessions, for the Storvv team only. */
export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event, { requireVerifiedEmail: true })
  if (!isStorvvTeamEmail(auth.email, auth.emailVerified)) {
    throw createError({ statusCode: 403, message: 'Only the Storvv team can see demo insights.' })
  }

  const db = getAdminFirestore()
  const [leadSnap, sessionSnap] = await Promise.all([
    db.collection(DEMO_LEADS).orderBy('createdAt', 'desc').limit(100).get(),
    db.collection(DEMO_SESSIONS).orderBy('lastSeenAt', 'desc').limit(200).get(),
  ])

  const leads = leadSnap.docs.map((doc) => {
    const d = doc.data()
    const activity = d.activity ?? null
    return {
      id: doc.id,
      name: String(d.name ?? ''),
      business: String(d.business ?? ''),
      email: String(d.email ?? ''),
      phone: String(d.phone ?? ''),
      branches: String(d.branches ?? ''),
      sells: String(d.sells ?? ''),
      message: String(d.message ?? ''),
      preferredContact: String(d.preferredContact ?? ''),
      source: String(d.source ?? ''),
      status: String(d.status ?? 'new'),
      device: String(d.device ?? ''),
      country: String(d.country ?? ''),
      createdAt: toIso(d.createdAt),
      activity,
      interest: demoInterest({
        activeSeconds: activity?.activeSeconds,
        pageCount: activity?.pageCount,
        actions: activity?.actions,
        hasLead: true,
      }),
    }
  })

  const sessions = sessionSnap.docs.map((doc) => {
    const d = doc.data()
    const summary = summarizeDemoSession(d)
    return {
      id: doc.id,
      visitorId: String(d.visitorId ?? ''),
      leadId: d.leadId ? String(d.leadId) : null,
      startedAt: toIso(d.startedAt),
      lastSeenAt: toIso(d.lastSeenAt),
      ...summary,
      interest: demoInterest({ ...summary, hasLead: Boolean(d.leadId) }),
    }
  })

  return { leads, sessions }
})
