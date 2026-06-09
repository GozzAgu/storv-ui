<template>
  <div class="min-h-dvh bg-gradient-to-b from-gray-50 to-gray-100 px-4 py-8 dark:from-[#0b0d12] dark:to-[#070809] sm:py-12">
    <div class="mx-auto w-full max-w-md">
      <!-- Brand -->
      <div class="mb-5 flex items-center justify-center gap-2">
        <div class="flex h-7 w-7 items-center justify-center rounded-md bg-gray-900 text-xs font-bold text-white dark:bg-white dark:text-gray-900">S</div>
        <span class="text-sm font-semibold text-gray-700 dark:text-gray-200">Storvv Checkout</span>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 dark:bg-[#12151c] dark:ring-white/[0.06]">
        <div class="space-y-3">
          <div class="h-5 w-1/2 animate-pulse rounded bg-gray-100 dark:bg-white/[0.06]" />
          <div class="h-20 animate-pulse rounded bg-gray-100 dark:bg-white/[0.06]" />
          <div class="h-10 animate-pulse rounded bg-gray-100 dark:bg-white/[0.06]" />
        </div>
        <p v-if="verifying" class="mt-3 text-center text-xs text-gray-400">Confirming your payment…</p>
      </div>

      <!-- Not found / expired -->
      <div v-else-if="!invoice || invoice.status === 'expired'" class="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-200 dark:bg-[#12151c] dark:ring-white/[0.06]">
        <ExclamationTriangleIcon class="mx-auto mb-3 h-10 w-10 text-amber-500" />
        <h1 class="text-base font-semibold text-gray-900 dark:text-gray-50">
          {{ invoice?.status === 'expired' ? 'Link expired' : 'Link not found' }}
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ invoice?.status === 'expired' ? 'This payment link is no longer active.' : 'This payment link is invalid or has expired.' }}
        </p>
      </div>

      <!-- Paid (success) -->
      <div v-else-if="invoice.status === 'paid'" class="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 dark:bg-[#12151c] dark:ring-white/[0.06]">
        <div class="bg-emerald-50 px-6 py-7 text-center dark:bg-emerald-500/[0.08]">
          <div class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white">
            <CheckIcon class="h-7 w-7" stroke-width="2.5" />
          </div>
          <h1 class="text-lg font-semibold text-gray-900 dark:text-gray-50">Payment successful</h1>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
            {{ formatNaira(invoice.total) }} paid to {{ invoice.businessName }}
          </p>
        </div>
        <div class="space-y-2 px-6 py-5 text-sm">
          <div class="flex justify-between"><span class="text-gray-500 dark:text-gray-400">Invoice</span><span class="font-medium text-gray-900 dark:text-gray-100">{{ invoice.invoiceNumber }}</span></div>
          <div v-if="invoice.reference" class="flex justify-between"><span class="text-gray-500 dark:text-gray-400">Reference</span><span class="font-medium tabular-nums text-gray-900 dark:text-gray-100">{{ invoice.reference }}</span></div>
          <div v-if="invoice.channel" class="flex justify-between"><span class="text-gray-500 dark:text-gray-400">Paid via</span><span class="font-medium capitalize text-gray-900 dark:text-gray-100">{{ invoice.channel.replace('_', ' ') }}</span></div>
        </div>
      </div>

      <!-- Checkout (unpaid) -->
      <div v-else class="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 dark:bg-[#12151c] dark:ring-white/[0.06]">
        <div class="border-b border-gray-100 px-6 py-5 dark:border-white/[0.06]">
          <p class="text-[11px] font-medium uppercase tracking-wide text-gray-400">Pay {{ invoice.businessName }}</p>
          <p class="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-gray-50">{{ formatNaira(invoice.total) }}</p>
          <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{{ invoice.invoiceNumber }} · for {{ invoice.customerName }}</p>
        </div>

        <ul class="divide-y divide-gray-50 px-6 dark:divide-white/[0.04]">
          <li v-for="(it, idx) in invoice.items" :key="idx" class="flex items-center justify-between py-3 text-sm">
            <span class="text-gray-700 dark:text-gray-200">{{ it.name }} <span class="text-gray-400">× {{ it.quantity }}</span></span>
            <span class="tabular-nums text-gray-900 dark:text-gray-100">{{ formatNaira(it.unitPrice * it.quantity) }}</span>
          </li>
        </ul>

        <div class="space-y-3 px-6 py-5">
          <div
            v-if="paymentFailed"
            class="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-xs text-red-700 dark:bg-red-500/10 dark:text-red-300"
          >
            <ExclamationTriangleIcon class="mt-0.5 h-4 w-4 shrink-0" />
            <span>Your last payment didn't go through. Please try again.</span>
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">Email (for your receipt)</label>
            <input
              v-model="email"
              type="email"
              placeholder="you@example.com"
              class="w-full rounded-lg bg-white px-3 py-2 text-sm text-gray-900 ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400/40 dark:bg-white/[0.04] dark:text-gray-100 dark:ring-white/10"
            />
          </div>
          <button type="button" class="btn-primary w-full justify-center py-2.5" :disabled="!canPay || processing" @click="pay">
            <span v-if="processing" class="flex items-center gap-2">
              <span class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Redirecting…
            </span>
            <span v-else>Pay {{ formatNaira(invoice.total) }}</span>
          </button>
          <p v-if="payError" class="text-center text-xs font-medium text-red-500">{{ payError }}</p>
        </div>

        <div class="flex items-center justify-center gap-1.5 border-t border-gray-100 px-6 py-3 dark:border-white/[0.06]">
          <LockClosedIcon class="h-3.5 w-3.5 text-gray-400" />
          <span class="text-[11px] text-gray-400">Secured by Paystack · No account needed</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { CheckIcon, LockClosedIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
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
    payError.value = (e as { data?: { message?: string } })?.data?.message || 'Could not start payment. Try again.'
    processing.value = false
  }
}

onMounted(async () => {
  const reference = String(route.query.reference || route.query.trxref || '')
  if (reference) {
    // Returning from Paystack — confirm before showing status.
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
