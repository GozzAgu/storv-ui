<template>
  <main class="ds-root s-c s-receipt-public">
    <div class="s-receipt-public__inner">
      <div v-if="loading" class="s-receipt-public__state" role="status">
        <SSpinner :size="24" />
        <p>Loading receipt…</p>
      </div>

      <div v-else-if="error" class="s-receipt-public__error" role="alert">
        {{ error }}
      </div>

      <article v-else-if="receipt" class="s-receipt-doc">
        <header class="s-receipt-doc__header">
          <h1 class="s-receipt-doc__title">{{ receipt.storeName || 'Store' }}</h1>
          <p class="s-receipt-doc__label">Receipt</p>
          <p class="s-receipt-doc__number">#{{ receipt.receiptNumber }}</p>
          <p class="s-receipt-doc__fine">{{ formattedDate }}</p>
        </header>

        <section class="s-receipt-doc__section">
          <p class="s-receipt-doc__label">Customer</p>
          <p class="s-receipt-doc__value s-receipt-doc__value--strong">
            {{ receipt.customerName }}
          </p>
        </section>

        <section class="s-receipt-doc__section">
          <div class="s-receipt-doc__table-wrap">
            <table class="s-receipt-doc__table">
              <thead>
                <tr>
                  <th scope="col">Item</th>
                  <th scope="col" class="s-receipt-doc__center">Qty</th>
                  <th scope="col" class="s-receipt-doc__num">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in receipt.items || []" :key="idx">
                  <td class="s-receipt-doc__item-name">{{ item.itemName }}</td>
                  <td class="s-receipt-doc__center">{{ item.quantity }}</td>
                  <td class="s-receipt-doc__num s-receipt-doc__strong">
                    {{ formatMoney(item.price * item.quantity) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="s-receipt-doc__totals">
            <div class="s-receipt-doc__grand">
              <span>Total</span>
              <span>{{ formatMoney(receipt.total) }}</span>
            </div>
            <p v-if="receipt.paymentMethod" class="s-receipt-doc__fine s-receipt-doc__end">
              Paid via {{ receipt.paymentMethod }}
            </p>
          </div>
        </section>

        <footer class="s-receipt-doc__footer">
          <p>Thank you for your business</p>
          <p class="s-receipt-doc__fine">Powered by Storvv</p>
        </footer>
      </article>
    </div>
  </main>
</template>

<script setup lang="ts">
import SSpinner from '~/components/s/SSpinner.vue'

definePageMeta({ layout: false })

interface PublicReceiptItem {
  itemName: string
  quantity: number
  price: number
}

interface PublicReceipt {
  storeName?: string
  receiptNumber?: string
  customerName?: string
  date?: unknown
  total?: number
  paymentMethod?: string
  items?: PublicReceiptItem[]
}

interface ShareReceiptResponse {
  success: boolean
  receipt?: PublicReceipt
}

const route = useRoute()
const token = computed(() => String(route.params.token || ''))

const loading = ref(true)
const error = ref('')
const receipt = ref<PublicReceipt | null>(null)

const formattedDate = computed(() => {
  if (!receipt.value?.date) return ''
  const d = receipt.value.date as { _seconds?: number } | string
  if (typeof d === 'object' && d && '_seconds' in d) {
    return new Date((d._seconds as number) * 1000).toLocaleString()
  }
  return new Date(d as string).toLocaleString()
})

function formatMoney(amount: unknown) {
  const n = Number(amount) || 0
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'NGN' }).format(n)
}

onMounted(async () => {
  if (!token.value) {
    error.value = 'Invalid link'
    loading.value = false
    return
  }
  try {
    const data = (await $fetch(`/api/receipts/share/${token.value}`)) as ShareReceiptResponse
    if (!data.success || !data.receipt) {
      error.value = 'Receipt not found'
    } else {
      receipt.value = data.receipt
    }
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }; statusMessage?: string }
    error.value = err?.data?.message || err?.statusMessage || 'This link is invalid or has expired'
  } finally {
    loading.value = false
  }
})

useHead({
  title: () =>
    receipt.value?.receiptNumber ? `Receipt #${receipt.value.receiptNumber}` : 'Receipt',
})
</script>
