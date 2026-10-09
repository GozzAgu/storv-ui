import { defineEventHandler } from 'h3'
import { assertRateLimit } from '~/server/utils/rate-limit'
import { requireAuth } from '~/server/utils/store-auth'
import { getPaystackSecret, paystackRequest } from '~/server/utils/payment-links'
import { requirePaystackLiveAllowed } from '~/server/utils/payments/config'

interface PaystackBank {
  name: string
  code: string
  active?: boolean
}

/** Authenticated: list Nigerian banks for the payout connect dropdown. */
export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  await assertRateLimit(event, { id: 'payout:banks', limit: 30, windowMs: 10 * 60_000, uid: auth.uid })
  await requirePaystackLiveAllowed()
  const config = useRuntimeConfig()
  const secretKey = getPaystackSecret(config)

  const banks = await paystackRequest<PaystackBank[]>('/bank?currency=NGN&perPage=100', {
    method: 'GET',
    secretKey,
  })

  const list = (banks || [])
    .filter((b) => b.active !== false)
    .map((b) => ({ name: b.name, code: b.code }))
    .sort((a, b) => a.name.localeCompare(b.name))

  return { success: true, banks: list }
})
