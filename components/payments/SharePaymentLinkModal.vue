<template>
  <Modal
    :model-value="modelValue"
    size="md"
    title="Share payment link"
    subtitle="Send this to your customer on any channel. They can pay without an account."
    @update:model-value="(v: boolean) => emit('update:modelValue', v)"
  >
    <div v-if="link" class="space-y-4">
      <!-- Link -->
      <div class="flex items-center gap-2 rounded-lg bg-gray-50 p-1.5 ring-1 ring-gray-200 dark:bg-white/[0.04] dark:ring-white/10">
        <span class="min-w-0 flex-1 truncate px-2 text-xs text-gray-600 dark:text-gray-300">{{ link.url }}</span>
        <button type="button" class="btn-primary btn-sm" @click="copyLink">
          {{ copied ? 'Copied ✓' : 'Copy' }}
        </button>
      </div>

      <!-- QR -->
      <div class="flex flex-col items-center gap-2 py-1">
        <div class="rounded-xl bg-white p-3 ring-1 ring-gray-200 dark:ring-white/10">
          <img v-if="qrDataUrl" :src="qrDataUrl" alt="Scan to pay" class="h-36 w-36" width="144" height="144" />
          <div v-else class="h-36 w-36 animate-pulse rounded bg-gray-100" />
        </div>
        <a
          v-if="qrDataUrl"
          :href="qrDataUrl"
          :download="`${link.invoiceNumber}-qr.png`"
          class="text-[11px] font-medium text-gray-500 underline-offset-2 hover:text-gray-700 hover:underline dark:text-gray-400 dark:hover:text-gray-200"
        >
          Scan to pay · download QR
        </a>
      </div>

      <!-- Share channels -->
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <a :href="whatsappUrl" target="_blank" rel="noopener" class="share-btn bg-[#25D366]/10 text-[#1a8c46] dark:text-[#34d77f]">WhatsApp</a>
        <a :href="telegramUrl" target="_blank" rel="noopener" class="share-btn bg-[#229ED9]/10 text-[#1c7fb0] dark:text-[#4cb8ec]">Telegram</a>
        <a :href="facebookUrl" target="_blank" rel="noopener" class="share-btn bg-[#1877F2]/10 text-[#1565d8] dark:text-[#5b9bf5]">Facebook</a>
        <button type="button" class="share-btn bg-gray-100 text-gray-700 dark:bg-white/[0.06] dark:text-gray-200" @click="copyLink">Copy link</button>
      </div>

      <!-- Message preview -->
      <div class="rounded-lg bg-gray-50 p-3 ring-1 ring-gray-100 dark:bg-white/[0.03] dark:ring-white/[0.06]">
        <p class="mb-1 text-[10px] font-medium uppercase tracking-wide text-gray-400">Message preview</p>
        <p class="whitespace-pre-line text-xs text-gray-700 dark:text-gray-300">{{ message }}</p>
      </div>
    </div>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <button type="button" class="btn-secondary" @click="emit('update:modelValue', false)">Close</button>
        <a v-if="link" class="btn-primary" :href="link.url" target="_blank" rel="noopener">Open checkout page</a>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import QRCode from 'qrcode'
import Modal from '~/components/ui/Modal.vue'
import { formatNaira } from '~/utils/naira'

export interface ShareableLink {
  url: string
  invoiceNumber: string
  customerName: string
  customerPhone: string
  total: number
}

const props = defineProps<{ modelValue: boolean; link: ShareableLink | null }>()
const emit = defineEmits<{ 'update:modelValue': [boolean] }>()

const copied = ref(false)

const message = computed(() => {
  if (!props.link) return ''
  const name = props.link.customerName ? `Hi ${props.link.customerName},\n\n` : ''
  return `${name}Here is your invoice ${props.link.invoiceNumber} for ${formatNaira(props.link.total)}.\n\nPay securely here:\n${props.link.url}`
})

const whatsappUrl = computed(() => {
  const phone = (props.link?.customerPhone || '').replace(/\D/g, '')
  const base = phone ? `https://wa.me/${phone}` : 'https://wa.me/'
  return `${base}?text=${encodeURIComponent(message.value)}`
})
const telegramUrl = computed(
  () => `https://t.me/share/url?url=${encodeURIComponent(props.link?.url || '')}&text=${encodeURIComponent(message.value)}`
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

const copyLink = async () => {
  if (!props.link?.url) return
  try {
    await navigator.clipboard.writeText(props.link.url)
    copied.value = true
    setTimeout(() => (copied.value = false), 1600)
  } catch {
    /* ignore */
  }
}
</script>

<style scoped>
.share-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.625rem;
  padding: 0.5rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  transition: filter 0.15s ease;
}
.share-btn:hover {
  filter: brightness(0.97);
}
</style>
