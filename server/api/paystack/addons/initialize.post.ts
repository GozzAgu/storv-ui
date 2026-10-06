import { createError, defineEventHandler, getRequestURL, readBody } from 'h3'
import {
  ADD_ON_ELIGIBLE_PLAN,
  resolveEffectiveSubscriptionPlan,
  SUBSCRIPTION_ADD_ON_LABELS,
} from '~/types/subscription'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { requireAuth, requireFreshTotp } from '~/server/utils/store-auth'
import { PAYSTACK_CURRENCY, resolvePaystackSecretKey } from '~/server/utils/paystack-validation'
import {
  getAddOnAmountKobo,
  getAddOnPlanCode,
  isSubscriptionAddOnKind,
  type PendingAddOnCheckout,
} from '~/server/utils/subscription-addons'

/** Start Paystack checkout for one Enterprise add-on (extra store or a staff seat for a store). */
export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAuth(event, { requireVerifiedEmail: true })
    const body = (await readBody(event)) as {
      kind?: string
      storeId?: string
      totpCode?: string
    }

    await requireFreshTotp(auth, body.totpCode)

    const kind = body.kind
    if (!isSubscriptionAddOnKind(kind)) {
      throw createError({ statusCode: 400, message: 'kind must be "store" or "staff".' })
    }
    const storeId = typeof body.storeId === 'string' ? body.storeId.trim() : ''
    if (kind === 'staff' && !storeId) {
      throw createError({ statusCode: 400, message: 'Choose the store this staff seat is for.' })
    }

    const adminDb = getAdminFirestore()
    const userRef = adminDb.collection('users').doc(auth.uid)
    const userSnap = await userRef.get()
    const userData = userSnap.data() as
      | {
          email?: string
          subscription?: string
          subscriptionStatus?: string
          subscriptionCurrentPeriodEnd?: string
        }
      | undefined
    if (!userData) {
      throw createError({ statusCode: 404, message: 'User account not found.' })
    }

    if (resolveEffectiveSubscriptionPlan(userData) !== ADD_ON_ELIGIBLE_PLAN) {
      throw createError({ statusCode: 403, message: 'Add-ons are available on Storvv Enterprise.' })
    }
    if (userData.subscriptionStatus === 'canceled' || userData.subscriptionStatus === 'past_due') {
      throw createError({
        statusCode: 409,
        message: 'Renew your Enterprise plan before adding stores or staff seats.',
      })
    }

    if (kind === 'staff') {
      const storeSnap = await userRef.collection('stores').doc(storeId).get()
      if (!storeSnap.exists) {
        throw createError({ statusCode: 404, message: 'Store not found.' })
      }
    }

    const config = useRuntimeConfig()
    const secretKey = resolvePaystackSecretKey(config)
    if (!secretKey) {
      throw createError({ statusCode: 503, message: 'Paystack is not configured.' })
    }

    let planCode: string
    let amount: number
    try {
      planCode = getAddOnPlanCode(kind, config as Record<string, unknown>)
      amount = getAddOnAmountKobo(kind, config as Record<string, unknown>)
    } catch (err: unknown) {
      throw createError({
        statusCode: 503,
        message: err instanceof Error ? err.message : 'Add-on billing is not configured.',
      })
    }

    const email = (auth.email || userData.email || '').trim().toLowerCase()
    if (!email) {
      throw createError({ statusCode: 400, message: 'Your account needs an email for billing.' })
    }

    const reference = `storvv_addon_${kind}_${auth.uid}_${Date.now()}`
    const callbackUrl = `${getRequestURL(event).origin}/dashboard/settings?paystack_callback=1`

    const response = (await $fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        email,
        amount,
        plan: planCode,
        reference,
        currency: PAYSTACK_CURRENCY,
        callback_url: callbackUrl,
        metadata: {
          kind: 'addon',
          userId: auth.uid,
          addOnKind: kind,
          ...(kind === 'staff' ? { storeId } : {}),
          custom_fields: [
            {
              display_name: 'Add-on',
              variable_name: 'addon',
              value: SUBSCRIPTION_ADD_ON_LABELS[kind],
            },
          ],
        },
      },
    })) as {
      status: boolean
      data?: { authorization_url: string; reference: string }
      message?: string
    }

    if (!response.status || !response.data?.authorization_url) {
      throw createError({
        statusCode: 502,
        message: response.message || 'Paystack could not create transaction',
      })
    }

    const now = new Date().toISOString()
    const pending: PendingAddOnCheckout & Record<string, unknown> = {
      kind: 'addon',
      userId: auth.uid,
      addOnKind: kind,
      ...(kind === 'staff' ? { storeId } : {}),
      amount,
      currency: PAYSTACK_CURRENCY,
      paystackPlanCode: planCode,
      billingCycle: 'monthly',
      email,
      reference,
      status: 'initialized',
      createdAt: now,
      updatedAt: now,
    }
    await userRef.collection('pendingCheckouts').doc(reference).set(pending)

    return {
      success: true,
      authorization_url: response.data.authorization_url,
      reference: response.data.reference,
    }
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string }
    if (e.statusCode) throw err
    console.error('[paystack/addons/initialize] error:', err)
    throw createError({ statusCode: 500, message: e.message || 'Failed to start add-on checkout' })
  }
})
