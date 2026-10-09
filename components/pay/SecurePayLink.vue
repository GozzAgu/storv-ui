<template>
  <div v-if="loading" class="s-pay__card s-pay__card--padded" aria-busy="true">
    <div class="s-pay__loading">
      <SSkeleton width="50%" height="20px" />
      <SSkeleton height="80px" />
      <SSkeleton height="40px" />
    </div>
  </div>

  <div v-else-if="!view" class="s-pay__card">
    <SEmptyState
      :title="unavailable ? 'Payment unavailable' : 'Link not found'"
      :description="
        unavailable
          ? 'Payments are temporarily unavailable. Please try again later.'
          : 'This payment link is not valid. Ask the shop for a new one.'
      "
    >
      <template #icon><TriangleAlert :size="24" :stroke-width="1.75" /></template>
    </SEmptyState>
  </div>

  <div v-else-if="view.status === 'expired'" class="s-pay__card">
    <SEmptyState
      title="Link expired"
      :description="`This link from ${view.storeName} has expired. Ask the shop for a new one.`"
    >
      <template #icon><TriangleAlert :size="24" :stroke-width="1.75" /></template>
    </SEmptyState>
  </div>

  <div v-else-if="view.status === 'paid'" class="s-pay__card">
    <div class="s-pay__success">
      <span class="s-pay__success-icon" aria-hidden="true">
        <Check :size="28" :stroke-width="2.5" />
      </span>
      <h1 class="s-pay__success-title">Already paid</h1>
      <p class="s-pay__success-text">This link to {{ view.storeName }} has been paid.</p>
    </div>
  </div>

  <div v-else class="s-pay__card">
    <div class="s-pay__summary">
      <p class="s-pay__payee">Pay {{ view.storeName }}</p>
      <p class="s-pay__amount">{{ formatNaira(koboToNaira(view.amountKobo)) }}</p>
      <p class="s-pay__meta">{{ view.receiptNumber }} · link expires {{ expiresLabel }}</p>
    </div>

    <form class="s-pay__form" @submit.prevent="pay">
      <SInput
        v-model="email"
        type="email"
        label="Email (for your Paystack receipt)"
        placeholder="you@example.com"
        autocomplete="email"
      />
      <SButton
        type="submit"
        variant="primary"
        size="lg"
        block
        :loading="processing"
        :disabled="!canPay"
      >
        {{ processing ? 'Redirecting…' : `Pay ${formatNaira(koboToNaira(view.amountKobo))}` }}
      </SButton>
      <p v-if="payError" class="s-pay__error" role="alert">{{ payError }}</p>
    </form>

    <p class="s-pay__foot">
      <Lock :size="14" :stroke-width="2" aria-hidden="true" />
      Secured by Paystack · No account needed
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Check, Lock, TriangleAlert } from '@lucide/vue'
import SButton from '~/components/s/SButton.vue'
import SEmptyState from '~/components/s/SEmptyState.vue'
import SInput from '~/components/s/SInput.vue'
import SSkeleton from '~/components/s/SSkeleton.vue'
import { koboToNaira } from '~/utils/money-kobo'
import { formatNaira } from '~/utils/naira'

type PublicLinkView =
  | {
      status: 'active'
      amountKobo: number
      currency: string
      storeName: string
      receiptNumber: string
      expiresAt: string
    }
  | { status: 'paid' | 'expired'; storeName: string }

const props = defineProps<{ token: string }>()

const loading = ref(true)
const processing = ref(false)
const unavailable = ref(false)
const payError = ref('')
const email = ref('')
const view = ref<PublicLinkView | null>(null)

const canPay = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()))

const expiresLabel = computed(() => {
  if (view.value?.status !== 'active') return ''
  return new Date(view.value.expiresAt).toLocaleString('en-NG', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
})

const errorMessage = (e: unknown, fallback: string) =>
  (e as { data?: { message?: string } })?.data?.message || fallback

const load = async () => {
  try {
    view.value = await $fetch<PublicLinkView>(`/api/paylink/${props.token}`)
  } catch (e) {
    const status = (e as { statusCode?: number })?.statusCode
    unavailable.value = status === 503 || status === 429
    view.value = null
  } finally {
    loading.value = false
  }
}

const pay = async () => {
  if (!canPay.value || processing.value) return
  processing.value = true
  payError.value = ''
  try {
    const res = await $fetch<{ authorizationUrl: string }>(`/api/paylink/${props.token}/checkout`, {
      method: 'POST',
      body: { email: email.value.trim() },
    })
    if (!res.authorizationUrl.startsWith('https://checkout.paystack.com/')) {
      throw new Error('Unexpected checkout address')
    }
    window.location.assign(res.authorizationUrl)
  } catch (e) {
    payError.value = errorMessage(e, 'Could not start payment. Try again.')
    processing.value = false
    if ((e as { statusCode?: number })?.statusCode === 409) await load()
  }
}

onMounted(load)
</script>
