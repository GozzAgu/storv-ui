import { createError, defineEventHandler, readBody } from 'h3'
import { requireAuth } from '~/server/utils/store-auth'
import { getPaystackSecret, paystackRequest } from '~/server/utils/payment-links'

interface Body {
  accountNumber?: string
  bankCode?: string
}

/** Authenticated: resolve a bank account name via Paystack (so the merchant can confirm before connecting). */
export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const body = await readBody<Body>(event)
  const accountNumber = (body.accountNumber || '').replace(/\D/g, '')
  const bankCode = (body.bankCode || '').trim()

  if (accountNumber.length !== 10 || !bankCode) {
    throw createError({ statusCode: 400, message: 'A 10-digit account number and bank are required' })
  }

  const config = useRuntimeConfig()
  const secretKey = getPaystackSecret(config)

  const data = await paystackRequest<{ account_name?: string; account_number?: string }>(
    `/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`,
    { method: 'GET', secretKey }
  )

  return { success: true, accountName: data?.account_name || '' }
})
