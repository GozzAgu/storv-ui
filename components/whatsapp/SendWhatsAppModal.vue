<template>
  <Modal
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    size="md"
    :title="modalTitle"
  >
    <template #default>
      <div v-if="!hasFeature" class="space-y-3">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Receipt delivery is not available on your current plan.
        </p>
      </div>

      <div v-else class="space-y-4">
        <p v-if="usage && !usage.unlimited" class="text-[11px] text-gray-500 dark:text-gray-400">
          {{ usage.count }} / {{ usage.limit }} WhatsApp sends this month on Storvv Micro.
          <LimitUpgradeHint
            v-if="!usage.canSend"
            message="Unlimited WhatsApp sends on Storvv Medium."
            class="mt-1 block"
          />
        </p>

        <p class="text-xs text-gray-600 dark:text-gray-400">
          {{
            isReceiptMode
              ? 'The receipt image or PDF is sent directly to the phone number or email you enter below.'
              : 'A payment reminder image is sent to the customer’s phone or email.'
          }}
        </p>

        <div v-if="isReceiptMode" class="grid grid-cols-2 gap-2">
          <button
            type="button"
            :class="format === 'pdf' ? activeFormatClass : inactiveFormatClass"
            @click="format = 'pdf'"
          >
            PDF
          </button>
          <button
            type="button"
            :class="format === 'image' ? activeFormatClass : inactiveFormatClass"
            @click="format = 'image'"
          >
            Image (PNG)
          </button>
        </div>

        <div>
          <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Phone number or email
          </label>
          <input
            v-model="contactInput"
            type="text"
            inputmode="email"
            placeholder="e.g. 08012345678 or customer@email.com"
            class="w-full rounded-sm bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary-400 dark:!bg-dashboard-card dark:text-gray-100"
          />
          <p
            v-if="contactInput && !contactValid"
            class="mt-1 text-[11px] text-amber-600 dark:text-amber-400"
          >
            Enter a valid mobile number or email address.
          </p>
          <p v-else-if="detectedChannel" class="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            Will send via {{ detectedChannel === 'email' ? 'email' : 'WhatsApp' }}.
          </p>
        </div>

        <div>
          <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Short message (optional)
          </label>
          <input
            v-model="captionInput"
            type="text"
            maxlength="200"
            :placeholder="defaultCaption"
            class="w-full rounded-sm bg-white px-3 py-2 text-sm dark:!bg-dashboard-card dark:text-gray-100"
          />
        </div>

        <div
          v-if="isReceiptMode && receiptForCapture"
          class="pointer-events-none fixed -left-[9999px] top-0 w-[480px] opacity-0"
          aria-hidden="true"
        >
          <ReceiptShareSurface
            ref="shareSurfaceRef"
            :receipt="receiptForCapture"
            :business-name="resolvedBusinessName"
            :branch-name="branchName"
            :store-logo-url="storeLogoUrl"
          />
        </div>

        <p v-if="preparing" class="text-[11px] text-gray-500 dark:text-gray-400">
          Preparing {{ format === 'pdf' ? 'PDF' : 'image' }}…
        </p>
      </div>
    </template>

    <template #footer>
      <IosDrawerActions :show-primary="hasFeature" @cancel="emit('update:modelValue', false)">
        <template #primary>
          <Button
            size="sm"
            :disabled="sendDisabled"
            extra-class="!rounded-[var(--ios-radius-md)] !border-0 !bg-[#25D366] !text-white hover:!bg-[#1da851]"
            @click="handleSend"
          >
            <span v-if="sending || preparing">{{ preparing ? 'Preparing…' : 'Sending…' }}</span>
            <span v-else>Send receipt</span>
          </Button>
        </template>
      </IosDrawerActions>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import Modal from '~/components/ui/Modal.vue'
import Button from '~/components/ui/Button.vue'
import IosDrawerActions from '~/components/ios/IosDrawerActions.vue'
import ReceiptShareSurface from '~/components/receipts/ReceiptShareSurface.vue'
import type { Receipt } from '~/stores/receipts'
import type { WhatsAppTemplateVars } from '~/types/whatsapp'
import { detectContactChannel, isValidContact } from '~/utils/contact-detect'
import { blobToFile } from '~/utils/file-share'
import {
  captureReceiptElementAsPng,
  captureReceiptElementAsPdf,
} from '~/composables/useReceiptImageCapture'
import { generatePaymentReminderImage } from '~/utils/payment-reminder-image'
import type { WhatsAppShareAttachmentFormat } from '~/composables/useWhatsAppFileShare'
import LimitUpgradeHint from '~/components/subscription/LimitUpgradeHint.vue'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    mode?: 'receipt' | 'payment_reminder'
    phone?: string
    email?: string
    templateVars?: WhatsAppTemplateVars
    getReceiptElement?: () => HTMLElement | null | Promise<HTMLElement | null>
    getReceiptPdfBlob?: () => Promise<Blob>
    receiptForCapture?: Receipt | null
    receiptData?: Receipt | Record<string, unknown>
    businessName?: string
    branchName?: string
    /** @deprecated use businessName */
    storeName?: string
    storeLogoUrl?: string
    receiptNumber?: string
  }>(),
  {
    mode: 'receipt',
    phone: '',
    email: '',
    templateVars: () => ({}),
    receiptForCapture: null,
    receiptData: () => ({}),
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  sent: []
}>()

const { hasFeature, usage, refreshUsage, deliverReceiptToContact } = useWhatsAppMessaging()
const toast = useAppToast()

const contactInput = ref('')
const captionInput = ref('')
const format = ref<WhatsAppShareAttachmentFormat>('image')
const sending = ref(false)
const preparing = ref(false)
const shareSurfaceRef = ref<InstanceType<typeof ReceiptShareSurface> | null>(null)

const resolvedBusinessName = computed(
  () =>
    props.businessName?.trim() ||
    props.storeName?.trim() ||
    props.templateVars?.storeName?.trim() ||
    'Store'
)
const branchName = computed(() => props.branchName?.trim() || '')

const activeFormatClass =
  'rounded-sm border-0 bg-primary-50 px-3 py-2 text-xs font-medium text-primary-800 dark:bg-primary-950/40 dark:text-primary-200'
const inactiveFormatClass =
  'rounded-sm bg-white px-3 py-2 text-xs font-medium text-gray-600 dark:!bg-dashboard-card dark:text-gray-400'

const isReceiptMode = computed(() => props.mode === 'receipt')
const modalTitle = computed(() =>
  props.mode === 'payment_reminder' ? 'Send payment reminder' : 'Send receipt to customer'
)
const contactValid = computed(() => isValidContact(contactInput.value))
const detectedChannel = computed(() => detectContactChannel(contactInput.value))

const sendDisabled = computed(
  () =>
    sending.value ||
    preparing.value ||
    !contactValid.value ||
    (usage.value != null && !usage.value.canSend)
)

const defaultCaption = computed(() => {
  if (props.mode === 'payment_reminder') {
    return `Payment reminder: ${props.templateVars?.balanceDue || 'balance due'}`
  }
  const store = props.templateVars?.storeName || resolvedBusinessName.value || 'our store'
  return `Your receipt from ${store}`
})

function initialContact(): string {
  return (props.phone || props.email || '').trim()
}

watch(
  () => props.modelValue,
  async (open) => {
    if (!open) return
    contactInput.value = initialContact()
    captionInput.value = defaultCaption.value
    format.value = 'image'
    await refreshUsage()
    await nextTick()
  }
)

watch(
  () => [props.phone, props.email] as const,
  () => {
    if (props.modelValue && !contactInput.value.trim()) {
      contactInput.value = initialContact()
    }
  }
)

async function resolveReceiptElement(): Promise<HTMLElement | null> {
  if (props.getReceiptElement) {
    return await props.getReceiptElement()
  }
  await nextTick()
  return shareSurfaceRef.value?.getElement() ?? null
}

async function buildReceiptFile(): Promise<File> {
  const num =
    props.templateVars?.receiptNumber ||
    props.receiptNumber ||
    props.receiptForCapture?.receiptNumber ||
    'receipt'
  const baseName = `receipt-${num}`.replace(/[^\w.-]+/g, '_')

  if (format.value === 'pdf' && props.getReceiptPdfBlob) {
    const blob = await props.getReceiptPdfBlob()
    return blobToFile(blob, `${baseName}.pdf`)
  }

  const el = await resolveReceiptElement()
  if (!el) throw new Error('Receipt preview is not ready. Try again.')

  preparing.value = true
  try {
    if (format.value === 'pdf') {
      const blob = await captureReceiptElementAsPdf(el)
      return blobToFile(blob, `${baseName}.pdf`)
    }
    const blob = await captureReceiptElementAsPng(el)
    return blobToFile(blob, `${baseName}.png`)
  } finally {
    preparing.value = false
  }
}

async function buildPaymentReminderFile(): Promise<File> {
  const blob = await generatePaymentReminderImage({
    storeName: props.templateVars?.storeName || resolvedBusinessName.value || 'Store',
    customerName: props.templateVars?.customerName || 'Customer',
    balanceDue: props.templateVars?.balanceDue || '',
  })
  return blobToFile(blob, 'payment-reminder.png')
}

const handleSend = async () => {
  if (!contactValid.value) return
  sending.value = true
  try {
    const file = isReceiptMode.value ? await buildReceiptFile() : await buildPaymentReminderFile()
    const receiptData =
      props.receiptData && Object.keys(props.receiptData).length > 0
        ? props.receiptData
        : props.receiptForCapture
        ? {
            ...props.receiptForCapture,
            storeBranchName: branchName.value || props.receiptForCapture.storeBranchName,
          }
        : undefined

    const result = await deliverReceiptToContact({
      contact: contactInput.value.trim(),
      file,
      caption: captionInput.value.trim() || defaultCaption.value,
      receiptNumber:
        props.receiptNumber ||
        props.receiptForCapture?.receiptNumber ||
        props.templateVars?.receiptNumber,
      receiptData: receiptData as Record<string, unknown> | undefined,
      storeId: props.receiptForCapture?.storeId,
      receiptId: props.receiptForCapture?.id,
    })

    if (result.success) {
      toast.success(result.message || 'Receipt sent successfully.')
      emit('sent')
      emit('update:modelValue', false)
    }
  } catch (e: unknown) {
    toast.error(e instanceof Error ? e.message : 'Could not send receipt')
  } finally {
    sending.value = false
    preparing.value = false
  }
}
</script>
