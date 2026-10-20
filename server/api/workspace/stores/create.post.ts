import { createError, defineEventHandler, readBody } from 'h3'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { requireAuth } from '~/server/utils/store-auth'
import { assertRateLimit } from '~/server/utils/rate-limit'
import { syncPlanTiers } from '~/server/utils/plan-tiers'
import {
  getPlanLimits,
  isTrialActive,
  resolveEffectiveSubscriptionPlan,
  storeLimitReachedMessage,
  summarizeSubscriptionAddOns,
} from '~/types/subscription'
import { normalizeEntityName } from '~/utils/capitalize-text'

const text = (value: unknown, max: number) =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''

/**
 * Creates a branch for the signed-in owner. Branches used to be client writes, which let an
 * owner skip the plan's branch limit; now the limit is checked here and the new branch gets its
 * `planTier` before anyone can use it.
 */
export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  await assertRateLimit(event, { id: 'workspace:stores:create', limit: 10, windowMs: 60_000, uid: auth.uid })
  const body = ((await readBody<Record<string, unknown>>(event).catch(() => null)) ?? {}) as Record<string, unknown>
  const db = getAdminFirestore()
  const ownerRef = db.collection('users').doc(auth.uid)
  const owner = (await ownerRef.get()).data()
  if (!owner || owner.role !== 'superAdmin') {
    throw createError({ statusCode: 403, message: 'Only the account owner can create branches' })
  }

  const name = normalizeEntityName(text(body.name, 120))
  if (!name) throw createError({ statusCode: 400, message: 'Branch name is required' })

  const plan = resolveEffectiveSubscriptionPlan(owner)
  const limits = getPlanLimits(plan, summarizeSubscriptionAddOns(owner.subscriptionAddOns))
  const storesRef = ownerRef.collection('stores')
  const existing = await storesRef.where('ownerId', '==', auth.uid).count().get()
  if (limits.maxStores >= 0 && existing.data().count >= limits.maxStores) {
    throw createError({
      statusCode: 403,
      message: storeLimitReachedMessage(plan, limits.maxStores, isTrialActive(owner)),
      data: { code: 'STORE_LIMIT' },
    })
  }

  const ref = storesRef.doc()
  const store = {
    name,
    description: text(body.description, 500),
    address: text(body.address, 300),
    phone: text(body.phone, 40),
    email: text(body.email, 200).toLowerCase(),
    ...(text(body.logoUrl, 1000) && { logoUrl: text(body.logoUrl, 1000) }),
    ownerId: auth.uid,
    isActive: body.isActive !== false,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }
  await ref.set(store)
  await syncPlanTiers(db, auth.uid)
  const saved = (await ref.get()).data() ?? {}
  return {
    id: ref.id,
    store: {
      ...saved,
      createdAt: saved.createdAt?.toDate?.().toISOString() ?? new Date().toISOString(),
      updatedAt: saved.updatedAt?.toDate?.().toISOString() ?? new Date().toISOString(),
    },
  }
})
