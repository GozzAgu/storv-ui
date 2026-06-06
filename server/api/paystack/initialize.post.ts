import type { SubscriptionPlan } from '~/types/subscription'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import {
 getExpectedPlanAmount,
 PAYSTACK_CURRENCY,
 VALID_PLANS,
 resolvePaystackSecretKey,
} from '~/server/utils/paystack-validation'

export default defineEventHandler(async (event) => {
 try {
 const body = await readBody(event)
 const { planId, email, userId } = body as { planId?: SubscriptionPlan; email?: string; userId?: string }

 if (!planId || !email || !userId) {
 throw createError({
 statusCode: 400,
 message: 'planId, email, and userId are required',
 })
 }

 if (!VALID_PLANS.includes(planId)) {
 throw createError({
 statusCode: 400,
 message: 'Invalid planId',
 })
 }

 const config = useRuntimeConfig()
 const secretKey = resolvePaystackSecretKey(config)
 if (!secretKey) {
 throw createError({
 statusCode: 503,
 message: 'Paystack is not configured. Set PAYSTACK_SECRET_KEY.',
 })
 }

 const amount = getExpectedPlanAmount(planId, config as Record<string, unknown>)

 const normalizedEmail = email.trim().toLowerCase()
 const reference = `storvv_${planId}_${userId}_${Date.now()}`
 const baseUrl = getRequestURL(event).origin
 const callbackUrl = `${baseUrl}/dashboard/settings?paystack_callback=1`

 const response = (await $fetch(
 'https://api.paystack.co/transaction/initialize',
 {
 method: 'POST',
 headers: {
 Authorization: `Bearer ${secretKey}`,
 'Content-Type': 'application/json',
 },
 body: {
 email: normalizedEmail,
 amount,
 reference,
 currency: PAYSTACK_CURRENCY,
 callback_url: callbackUrl,
 metadata: {
 userId,
 planId,
 },
 },
 },
 )) as {
 status: boolean
 data?: { authorization_url: string; reference: string; access_code: string }
 message?: string
 }

 if (!response.status || !response.data?.authorization_url) {
 throw createError({
 statusCode: 502,
 message: response.message || 'Paystack could not create transaction',
 })
 }

 // Persist pending checkout server-side for later verification hard checks.
 const adminDb = getAdminFirestore()
 await adminDb
 .collection('users')
 .doc(userId)
 .collection('pendingCheckouts')
 .doc(reference)
 .set(
 {
 userId,
 planId,
 email: normalizedEmail,
 amount,
 currency: PAYSTACK_CURRENCY,
 reference,
 status: 'initialized',
 createdAt: new Date().toISOString(),
 updatedAt: new Date().toISOString(),
 },
 { merge: true }
 )

 return {
 success: true,
 authorization_url: response.data.authorization_url,
 reference: response.data.reference,
 }
 } catch (err: any) {
 if (err.statusCode) throw err
 console.error('Paystack initialize error:', err)
 throw createError({
 statusCode: 500,
 message: err.message || 'Failed to initialize payment',
 })
 }
})
