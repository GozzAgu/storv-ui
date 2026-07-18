import { createError, defineEventHandler, readBody } from 'h3'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { requireAuth, requireStoreManageAccess } from '~/server/utils/store-auth'
import { getPaystackSecret, paystackRequest, payoutDocId } from '~/server/utils/payment-links'

interface Body {
  ownerUserId?: string
  storeId?: string
  businessName?: string
  bankCode?: string
  bankName?: string
  accountNumber?: string
  accountName?: string
}

const DEFAULT_PLATFORM_FEE_PERCENT = 0

/**
 * Authenticated (owner/manager): create a Paystack subaccount for the merchant's
 * bank account and store the payout config server-side. Payments then settle
 * straight to this account, minus the platform fee.
 */
export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  const body = await readBody<Body>(event)

  const ownerUserId = (body.ownerUserId || '').trim()
  const storeId = (body.storeId || '').trim()
  const bankCode = (body.bankCode || '').trim()
  const accountNumber = (body.accountNumber || '').replace(/\D/g, '')
  const accountName = (body.accountName || '').trim()
  const bankName = (body.bankName || '').trim()
  const businessName = (body.businessName || '').trim() || accountName || 'Storvv merchant'

  if (!ownerUserId || !storeId || !bankCode || accountNumber.length !== 10 || !accountName) {
    throw createError({
      statusCode: 400,
      message: 'Bank, valid account number and resolved name are required',
    })
  }

  await requireStoreManageAccess(auth.uid, ownerUserId, storeId)

  const config = useRuntimeConfig()
  const secretKey = getPaystackSecret(config)
  const feePercent =
    Number(config.paymentLinkPlatformFeePercent ?? DEFAULT_PLATFORM_FEE_PERCENT) || 0

  const subaccount = await paystackRequest<{ subaccount_code?: string }>('/subaccount', {
    method: 'POST',
    secretKey,
    body: {
      business_name: businessName,
      settlement_bank: bankCode,
      account_number: accountNumber,
      percentage_charge: feePercent,
    },
  })

  if (!subaccount?.subaccount_code) {
    throw createError({ statusCode: 502, message: 'Paystack did not return a subaccount code' })
  }

  const adminDb = getAdminFirestore()
  await adminDb.collection('merchantPayouts').doc(payoutDocId(ownerUserId, storeId)).set(
    {
      ownerUserId,
      storeId,
      connected: true,
      bankName,
      bankCode,
      accountNumber,
      accountName,
      subaccountCode: subaccount.subaccount_code,
      percentageCharge: feePercent,
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  )

  return {
    success: true,
    payout: {
      connected: true,
      bankName,
      accountName,
      accountNumberLast4: accountNumber.slice(-4),
      percentageCharge: feePercent,
    },
  }
})
