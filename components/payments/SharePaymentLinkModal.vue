<template>
  <SDialog
    :open="modelValue"
    size="md"
    title="Share payment link"
    description="Send this to your customer on any channel. They can pay without an account."
    @update:open="(v: boolean) => emit('update:modelValue', v)"
  >
    <div v-if="link" class="s-c s-paylink-share">
      <SButton variant="primary" size="lg" block :loading="sharing" @click="shareViaSystem">
        <template #leading><Share2 :size="16" :stroke-width="2" aria-hidden="true" /></template>
        {{ sharing ? 'Opening share…' : nativeShareLabel }}
      </SButton>

      <div class="s-paylink-share__link">
        <span class="s-paylink-share__url">{{ link.url }}</span>
        <SButton size="sm" variant="primary" @click="copyLink">
          <template #leading>
            <component :is="copied ? Check : Copy" :size="14" :stroke-width="2" aria-hidden="true" />
          </template>
          {{ copied ? 'Copied' : 'Copy' }}
        </SButton>
      </div>

      <div class="s-paylink-share__qr">
        <div class="s-paylink-share__qr-frame">
          <img
            v-if="qrDataUrl"
            :src="qrDataUrl"
            alt="Scan to pay"
            class="s-paylink-share__qr-img"
            width="144"
            height="144"
          />
          <SSkeleton v-else width="144px" height="144px" />
        </div>
        <a
          v-if="qrDataUrl"
          :href="qrDataUrl"
          :download="`${link.invoiceNumber}-qr.png`"
          class="s-link s-paylink-share__download"
        >
          <Download :size="14" :stroke-width="2" aria-hidden="true" />
          Scan to pay · download QR
        </a>
      </div>

      <div class="s-paylink-share__channels">
        <SButton @click="shareWhatsApp">
          <template #leading><MessageCircle :size="16" :stroke-width="1.75" aria-hidden="true" /></template>
          WhatsApp
        </SButton>
        <a :href="telegramUrl" target="_blank" rel="noopener" class="s-c s-btn s-btn--secondary">
          <Send :size="16" :stroke-width="1.75" aria-hidden="true" />
          <span>Telegram</span>
        </a>
        <a :href="facebookUrl" target="_blank" rel="noopener" class="s-c s-btn s-btn--secondary">
          <ExternalLink :size="16" :stroke-width="1.75" aria-hidden="true" />
          <span>Facebook</span>
        </a>
        <SButton @click="copyLink">
          <template #leading><Copy :size="16" :stroke-width="1.75" aria-hidden="true" /></template>
          Copy link
        </SButton>
      </div>

      <div class="s-paylink-share__preview">
        <p class="s-paylink-share__preview-label">Message preview</p>
        <p class="s-paylink-share__preview-text">{{ message }}</p>
      </div>
    </div>

    <template #footer>
      <SButton @click="emit('update:modelValue', false)">Close</SButton>
      <SButton v-if="link" variant="primary" @click="openCheckout">
        <template #leading><ExternalLink :size="16" :stroke-width="2" aria-hidden="true" /></template>
        Open checkout page
      </SButton>
    </template>
  </SDialog>
</template>

<script setup lang="ts">
import SDialog from '~/components/s/SDialog.vue'
import { ref, computed, watch } from 'vue'
import QRCode from 'qrcode'
import { Check, Copy, Download, ExternalLink, MessageCircle, Send, Share2 } from '@lucide/vue'
import SButton from '~/components/s/SButton.vue'
import SSkeleton from '~/components/s/SSkeleton.vue'
import { buildPaymentLinkShareMessage } from '~/utils/payment-link-share'
import { usePaymentLinkShare } from '~/composables/usePaymentLinkShare'
import { isCapacitorNative } from '~/utils/capacitor-env'

export interface ShareableLink {
  url: string
  invoiceNumber: string
  customerName: string
  customerPhone: string
  total: number
}

const props = defineProps<{
  modelValue: boolean
  link: ShareableLink | null
  autoShare?: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [boolean]; shared: ['system' | 'whatsapp' | 'clipboard'] }>()

const copied = ref(false)
const { sharing, share, shareWhatsApp: openWhatsAppShare } = usePaymentLinkShare()

const nativeShareLabel = computed(() =>
  isCapacitorNative() ? 'Share to WhatsApp or apps' : 'Share link'
)

const message = computed(() => {
  if (!props.link) return ''
  return buildPaymentLinkShareMessage(props.link)
})

const telegramUrl = computed(
  () =>
    `https://t.me/share/url?url=${encodeURIComponent(
      props.link?.url || ''
    )}&text=${encodeURIComponent(message.value)}`
)
const facebookUrl = computed(
  () => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(props.link?.url || '')}`
)

const qrDataUrl = ref('')
watch(
  () => props.link?.url,
  async (url) => {
    if (!url) {
      qrDataUrl.value = ''
      return
    }
    try {
      qrDataUrl.value = await QRCode.toDataURL(url, {
        margin: 1,
        width: 288,
        color: { dark: '#0f172a', light: '#ffffff' },
      })
    } catch {
      qrDataUrl.value = ''
    }
  },
  { immediate: true }
)

async function shareViaSystem() {
  if (!props.link) return
  const result = await share(props.link)
  if (result === 'system' || result === 'whatsapp' || result === 'clipboard') {
    emit('shared', result)
  }
}

function shareWhatsApp() {
  if (!props.link) return
  openWhatsAppShare(props.link)
  emit('shared', 'whatsapp')
}

function openCheckout() {
  if (!props.link?.url) return
  window.open(props.link.url, '_blank', 'noopener,noreferrer')
}

const copyLink = async () => {
  if (!props.link?.url) return
  try {
    await navigator.clipboard.writeText(message.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 1600)
    emit('shared', 'clipboard')
  } catch {
    /* ignore */
  }
}

watch(
  () => [props.modelValue, props.link?.url, props.autoShare] as const,
  async ([open, url, autoShare]) => {
    if (!open || !url || !autoShare || !props.link) return
    await shareViaSystem()
  }
)
</script>
