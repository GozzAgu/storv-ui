export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const reference = query.reference as string

    if (!reference) {
      throw createError({
        statusCode: 400,
        message: 'reference is required',
      })
    }

    const config = useRuntimeConfig()
    const secretKey = config.paystackSecretKey
    if (!secretKey) {
      throw createError({
        statusCode: 503,
        message: 'Paystack is not configured',
      })
    }

    const response = await $fetch<{
      status: boolean
      data?: {
        status: string
        reference: string
        metadata?: { userId?: string; planId?: string }
      }
      message?: string
    }>(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    })

    if (!response.status || !response.data) {
      throw createError({
        statusCode: 502,
        message: response.message || 'Verification failed',
      })
    }

    const { data } = response
    if (data.status !== 'success') {
      return {
        success: false,
        message: 'Payment was not successful',
        paid: false,
      }
    }

    const userId = data.metadata?.userId as string | undefined
    const planId = data.metadata?.planId as string | undefined

    if (!userId || !planId) {
      return {
        success: false,
        message: 'Invalid transaction metadata',
        paid: false,
      }
    }

    return {
      success: true,
      paid: true,
      userId,
      planId,
    }
  } catch (err: any) {
    if (err.statusCode) throw err
    console.error('Paystack verify error:', err)
    throw createError({
      statusCode: 500,
      message: err.message || 'Failed to verify payment',
    })
  }
})
