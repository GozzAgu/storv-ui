<template>
  <div class="ds-root s-c s-pay">
    <main class="s-pay__inner">
      <div class="s-pay__brand">
        <span class="s-pay__brand-mark" aria-hidden="true">S</span>
        <span class="s-pay__brand-name">Storvv Checkout</span>
      </div>

      <div v-if="status === 'loading'" class="s-pay__card s-pay__card--padded" aria-busy="true">
        <p class="s-pay__status" role="status">
          <SSpinner :size="14" />
          Checking your payment…
        </p>
      </div>

      <div v-else-if="status === 'paid'" class="s-pay__card">
        <div class="s-pay__success">
          <span class="s-pay__success-icon" aria-hidden="true">
            <Check :size="28" :stroke-width="2.5" />
          </span>
          <h1 class="s-pay__success-title">Payment received</h1>
          <p class="s-pay__success-text">
            {{ storeName }} has your payment. You can close this page.
          </p>
        </div>
      </div>

      <div v-else-if="status === 'pending'" class="s-pay__card s-pay__card--padded">
        <p class="s-pay__status" role="status">
          <SSpinner v-if="polling" :size="14" />
          {{
            polling
              ? 'Confirming your payment with Paystack…'
              : `We're still confirming your payment. ${storeName} will see it as soon as Paystack confirms it, so you can close this page.`
          }}
        </p>
      </div>

      <div v-else class="s-pay__card">
        <SEmptyState
          :title="status === 'expired' ? 'Link expired' : 'Payment not found'"
          :description="
            status === 'expired'
              ? 'This payment link expired. If you were charged, contact the shop with your Paystack receipt.'
              : 'We could not find this payment. If you were charged, contact the shop with your Paystack receipt.'
          "
        >
          <template #icon><TriangleAlert :size="24" :stroke-width="1.75" /></template>
        </SEmptyState>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { Check, TriangleAlert } from '@lucide/vue'
import SEmptyState from '~/components/s/SEmptyState.vue'
import SSpinner from '~/components/s/SSpinner.vue'

definePageMeta({ layout: false })

type ReturnStatus = 'paid' | 'pending' | 'expired' | 'unavailable'

const POLL_MS = 3_000
const MAX_POLLS = 10

const route = useRoute()
const status = ref<ReturnStatus | 'loading'>('loading')
const storeName = ref('the shop')
const polling = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null
let polls = 0

const check = async () => {
  const reference = String(route.query.ref || '')
  try {
    const res = await $fetch<{ status: ReturnStatus; storeName: string }>('/api/paylink/return', {
      query: { ref: reference },
    })
    status.value = res.status
    storeName.value = res.storeName || 'the shop'
  } catch {
    status.value = 'unavailable'
  }
  polls += 1
  polling.value = status.value === 'pending' && polls < MAX_POLLS
  if (polling.value) timer = setTimeout(check, POLL_MS)
}

onMounted(check)
onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})

useHead({
  title: 'Payment status · Storvv',
  meta: [{ name: 'referrer', content: 'no-referrer' }],
})
</script>
