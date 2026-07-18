import { getPlanLimits, planHasFeature } from '~/types/subscription'
import type { SubscriptionPlan } from '~/types/subscription'
import { deliverReceiptViaClientWhatsApp } from '~/composables/useWhatsAppFileShare'
import { blobToBase64 } from '~/utils/file-share'
import { resolveApiPath } from '~/utils/api-url'

export interface WhatsAppUsageState {
  count: number
  limit: number
  unlimited: boolean
  canSend: boolean
  monthKey: string
}

export interface DeliverReceiptResult {
  success: boolean
  channel?: 'email' | 'whatsapp'
  method?: string
  message?: string
}

interface DeliverReceiptApiResponse {
  success: boolean
  fallback?: string
  channel?: 'email' | 'whatsapp'
  method?: string
  message?: string
  normalizedPhone?: string
  error?: string
}

function fetchErrorMessage(e: unknown): string {
  const err = e as { data?: { message?: string }; statusMessage?: string; message?: string }
  return err?.data?.message || err?.statusMessage || err?.message || 'Could not deliver receipt'
}

export function useWhatsAppMessaging() {
  const authStore = useAuthStore()
  const { plan, canUse } = useSubscriptionFeatures()
  const toast = useAppToast()
  const config = useRuntimeConfig()
  const { getAuthHeaders } = useAuthenticatedFetch()

  const hasFeature = computed(() => canUse('whatsapp_messaging'))
  const hasBalanceFeature = computed(() => canUse('customer_balance'))

  const usage = ref<WhatsAppUsageState | null>(null)
  const usageLoading = ref(false)

  const monthlyLimit = computed(() => getPlanLimits(plan.value).maxWhatsAppMessagesPerMonth)

  async function refreshUsage() {
    if (!hasFeature.value || !import.meta.client) return
    usageLoading.value = true
    try {
      const headers = await getAuthHeaders()
      const data = (await $fetch(resolveApiPath('/api/whatsapp/usage'), {
        headers,
      })) as WhatsAppUsageState
      usage.value = data
    } catch (e) {
      console.warn('[useWhatsAppMessaging] usage fetch failed', e)
    } finally {
      usageLoading.value = false
    }
  }

  async function recordClientSend() {
    const headers = await getAuthHeaders()
    await $fetch(resolveApiPath('/api/whatsapp/record-send'), { method: 'POST', headers })
  }

  /**
   * Send receipt file directly to the provided email or WhatsApp number.
   * Email uses Resend (server). WhatsApp uses Cloud API when configured, else device share sheet.
   */
  async function deliverReceiptToContact(params: {
    contact: string
    file: File
    caption?: string
    receiptNumber?: string
    receiptData?: Record<string, unknown>
  }): Promise<DeliverReceiptResult> {
    if (!hasFeature.value) {
      toast.error('Receipt messaging is not available on your plan.')
      return { success: false, message: 'Plan does not include messaging' }
    }

    const headers = await getAuthHeaders()
    const attachmentBase64 = await blobToBase64(params.file)

    let data: DeliverReceiptApiResponse

    try {
      data = (await $fetch(resolveApiPath('/api/receipts/deliver'), {
        method: 'POST',
        headers,
        body: {
          contact: params.contact.trim(),
          attachmentBase64,
          attachmentMimeType: params.file.type || 'image/png',
          attachmentFilename: params.file.name,
          caption: params.caption,
          receiptNumber: params.receiptNumber,
          receiptData: params.receiptData,
        },
      })) as DeliverReceiptApiResponse
    } catch (e: unknown) {
      throw new Error(fetchErrorMessage(e))
    }

    await refreshUsage()

    if (data.success) {
      return {
        success: true,
        channel: data.channel,
        method: data.method,
        message: data.message,
      }
    }

    if (data.fallback === 'whatsapp_client' && data.normalizedPhone) {
      const fallback = await deliverReceiptViaClientWhatsApp({
        file: params.file,
        phone: data.normalizedPhone,
        caption: params.caption,
      })
      if (fallback.success) {
        try {
          await recordClientSend()
          await refreshUsage()
        } catch (e) {
          console.warn('[useWhatsAppMessaging] record client send failed', e)
        }
        const messageByMethod: Record<string, string> = {
          clipboard_whatsapp:
            'WhatsApp opened for this number. Paste the receipt image in the chat and send.',
          download_whatsapp:
            'WhatsApp opened. Attach the downloaded receipt file using 📎 in the chat.',
        }
        return {
          success: true,
          channel: 'whatsapp',
          method: fallback.method,
          message: messageByMethod[fallback.method] || 'Opened WhatsApp to complete sending.',
        }
      }
      throw new Error('Could not open WhatsApp share. Try again or attach the file manually.')
    }

    throw new Error(data.message || data.error || 'Could not deliver receipt')
  }

  function appOrigin(): string {
    const origin = config.public.appOrigin as string
    return origin?.replace(/\/$/, '') || ''
  }

  function upgradeMessageForPlan(p: SubscriptionPlan): string {
    if (
      planHasFeature(p, 'whatsapp_messaging') &&
      getPlanLimits(p).maxWhatsAppMessagesPerMonth < 0
    ) {
      return ''
    }
    return 'Upgrade to Storvv Medium for unlimited receipt delivery.'
  }

  onMounted(() => {
    if (hasFeature.value) void refreshUsage()
  })

  watch(plan, () => {
    if (hasFeature.value) void refreshUsage()
  })

  return {
    plan,
    hasFeature,
    hasBalanceFeature,
    monthlyLimit,
    usage,
    usageLoading,
    refreshUsage,
    deliverReceiptToContact,
    appOrigin,
    upgradeMessageForPlan,
  }
}
