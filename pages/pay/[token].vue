<template>
  <div class="ds-root s-c s-pay">
    <main class="s-pay__inner">
      <div class="s-pay__brand">
        <span class="s-pay__brand-mark" aria-hidden="true">S</span>
        <span class="s-pay__brand-name">Storvv Checkout</span>
      </div>

      <div v-if="loading" class="s-pay__card s-pay__card--padded" aria-busy="true">
        <div class="s-pay__loading">
          <SSkeleton width="50%" height="20px" />
          <SSkeleton height="80px" />
          <SSkeleton height="40px" />
        </div>
        <p v-if="verifying" class="s-pay__status" role="status">
          <SSpinner :size="14" />
          Confirming your payment…
        </p>
      </div>

      <div v-else-if="!invoice || invoice.status === 'expired'" class="s-pay__card">
        <SEmptyState
          :title="invoice?.status === 'expired' ? 'Link expired' : 'Link not found'"
          :description="
            invoice?.status === 'expired'
              ? 'This payment link is no longer active.'
              : 'This payment link is invalid or has expired.'
          "
        >
          <template #icon><TriangleAlert :size="24" :stroke-width="1.75" /></template>
        </SEmptyState>
      </div>

      <div v-else-if="invoice.status === 'paid'" class="s-pay__card">
        <div class="s-pay__success">
          <span class="s-pay__success-icon" aria-hidden="true">
            <Check :size="28" :stroke-width="2.5" />
          </span>
          <h1 class="s-pay__success-title">Payment successful</h1>
          <p class="s-pay__success-text">
            {{ formatNaira(invoice.total) }} paid to {{ invoice.businessName }}
          </p>
        </div>
        <dl class="s-pay__details">
          <div class="s-pay__detail">
            <dt>Invoice</dt>
            <dd>{{ invoice.invoiceNumber }}</dd>
          </div>
          <div v-if="invoice.reference" class="s-pay__detail">
            <dt>Reference</dt>
            <dd class="s-pay__num">{{ invoice.reference }}</dd>
          </div>
          <div v-if="invoice.channel" class="s-pay__detail">
            <dt>Paid via</dt>
            <dd class="s-pay__capitalize">{{ invoice.channel.replace('_', ' ') }}</dd>
          </div>
        </dl>
      </div>

      <div v-else class="s-pay__card">
        <div class="s-pay__summary">
          <p class="s-pay__payee">Pay {{ invoice.businessName }}</p>
          <p class="s-pay__amount">{{ formatNaira(invoice.total) }}</p>
          <p class="s-pay__meta">{{ invoice.invoiceNumber }} · for {{ invoice.customerName }}</p>
        </div>

        <ul class="s-pay__items">
          <li v-for="(it, idx) in invoice.items" :key="idx" class="s-pay__item">
            <span class="s-pay__item-name">
              {{ it.name }} <span class="s-pay__item-qty">× {{ it.quantity }}</span>
            </span>
            <span class="s-pay__num">{{ formatNaira(it.unitPrice * it.quantity) }}</span>
          </li>
        </ul>

        <form class="s-pay__form" @submit.prevent="pay">
          <p v-if="paymentFailed" class="s-pay__alert" role="alert">
            <TriangleAlert :size="16" :stroke-width="1.75" aria-hidden="true" />
            <span>Your last payment didn't go through. Please try again.</span>
          </p>
          <SInput
            v-model="email"
            type="email"
            label="Email (for your receipt)"
            placeholder="you@example.com"
            autocomplete="email"
          />
          <SButton type="submit" variant="primary" size="lg" block :loading="processing" :disabled="!canPay">
            {{ processing ? 'Redirecting…' : `Pay ${formatNaira(invoice.total)}` }}
          </SButton>
          <p v-if="payError" class="s-pay__error" role="alert">{{ payError }}</p>
        </form>

        <p class="s-pay__foot">
          <Lock :size="14" :stroke-width="2" aria-hidden="true" />
          Secured by Paystack · No account needed
        </p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Check, Lock, TriangleAlert } from '@lucide/vue'
import SButton from '~/components/s/SButton.vue'
import SEmptyState from '~/components/s/SEmptyState.vue'
import SInput from '~/components/s/SInput.vue'
import SSkeleton from '~/components/s/SSkeleton.vue'
import SSpinner from '~/components/s/SSpinner.vue'
import { formatNaira } from '~/utils/naira'

definePageMeta({ layout: false })

interface PublicInvoice {
  businessName: string
  invoiceNumber: string
  customerName: string
  items: { name: string; unitPrice: number; quantity: number }[]
  total: number
  currency: string
  status: 'unpaid' | 'paid' | 'failed' | 'expired'
  reference?: string
  channel?: string
}

const route = useRoute()
const token = computed(() => String(route.params.token || ''))

const loading = ref(true)
const verifying = ref(false)
const processing = ref(false)
const payError = ref('')
const paymentFailed = ref(false)
const email = ref('')
const invoice = ref<PublicInvoice | null>(null)

const canPay = computed(() => email.value.includes('@') && email.value.length > 3)

const loadInvoice = async () => {
  try {
    const res = (await $fetch(`/api/pay/${token.value}`)) as { invoice: PublicInvoice }
    invoice.value = res.invoice
  } catch {
    invoice.value = null
  }
}

const pay = async () => {
  if (!canPay.value || processing.value) return
  processing.value = true
  payError.value = ''
  try {
    const res = (await $fetch(`/api/pay/${token.value}/initialize`, {
      method: 'POST',
      body: { email: email.value.trim() },
    })) as { authorizationUrl: string }
    window.location.href = res.authorizationUrl
  } catch (e) {
    payError.value =
      (e as { data?: { message?: string } })?.data?.message || 'Could not start payment. Try again.'
    processing.value = false
  }
}

onMounted(async () => {
  const reference = String(route.query.reference || route.query.trxref || '')
  if (reference) {
    // Returning from Paystack - confirm before showing status.
    verifying.value = true
    try {
      const res = (await $fetch(`/api/pay/${token.value}/verify`, { query: { reference } })) as {
        paid?: boolean
        status?: string
      }
      if (!res.paid && (res.status === 'failed' || res.status === 'pending')) {
        paymentFailed.value = true
      }
    } catch {
      /* fall through to load current state */
    } finally {
      verifying.value = false
    }
  }
  await loadInvoice()
  loading.value = false
})

useHead({ title: 'Pay securely · Storvv' })
</script>
