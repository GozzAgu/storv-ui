import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { requireAuth } from '~/server/utils/store-auth'
import {
  DEMO_LEADS,
  DEMO_LEAD_STATUSES,
  isStorvvTeamEmail,
  type DemoLeadStatus,
} from '~/server/utils/demo-insights'

/** The team moves a walkthrough request along: contacted, booked, won or lost. */
export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event, { requireVerifiedEmail: true })
  if (!isStorvvTeamEmail(auth.email, auth.emailVerified)) {
    throw createError({ statusCode: 403, message: 'Only the Storvv team can update requests.' })
  }

  const id = String(getRouterParam(event, 'id') || '')
  if (!/^[A-Za-z0-9]{1,64}$/.test(id)) throw createError({ statusCode: 400, message: 'Bad id' })

  const body = ((await readBody(event).catch(() => null)) || {}) as Record<string, unknown>
  const status = String(body.status || '') as DemoLeadStatus
  if (!(DEMO_LEAD_STATUSES as readonly string[]).includes(status)) {
    throw createError({ statusCode: 400, message: 'Unknown status' })
  }

  const ref = getAdminFirestore().collection(DEMO_LEADS).doc(id)
  const snap = await ref.get()
  if (!snap.exists) throw createError({ statusCode: 404, message: 'Request not found' })

  await ref.update({
    status,
    updatedAt: FieldValue.serverTimestamp(),
    statusChangedBy: auth.email ?? auth.uid,
  })
  return { success: true }
})
