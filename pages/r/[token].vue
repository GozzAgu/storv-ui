<template>
 <div class="min-h-screen bg-gray-50 px-4 py-10 dark:bg-slate-950">
 <div class="mx-auto max-w-lg">
 <div v-if="loading" class="py-16 text-center text-sm text-gray-500">Loading receipt…</div>

 <div
 v-else-if="error"
 class="rounded-sm border border-red-200 bg-red-50 px-4 py-6 text-center text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200"
 >
 {{ error }}
 </div>

 <article
 v-else-if="receipt"
 class="overflow-hidden rounded-sm bg-white shadow-sm dark:border-gray-800 dark:bg-slate-900"
 >
 <header class="border-b border-gray-100 px-6 py-5 text-center dark:border-gray-800">
 <h1 class="text-sm font-semibold text-gray-900 dark:text-gray-100">
 {{ receipt.storeName || 'Store' }}
 </h1>
 <p class="mt-1 text-[10px] uppercase tracking-wider text-gray-500">Receipt</p>
 <p class="mt-2 text-base font-semibold text-gray-900 dark:text-gray-50">
 #{{ receipt.receiptNumber }}
 </p>
 <p class="mt-1 text-xs text-gray-500">{{ formattedDate }}</p>
 </header>

 <section class="border-b border-gray-100 px-6 py-4 dark:border-gray-800">
 <p class="text-[10px] font-medium uppercase tracking-wider text-gray-500">Customer</p>
 <p class="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">{{ receipt.customerName }}</p>
 </section>

 <section class="px-6 py-4">
 <table class="w-full text-xs">
 <thead>
 <tr class="border-b border-gray-200 text-left text-[10px] uppercase tracking-wider text-gray-500">
 <th class="pb-2">Item</th>
 <th class="pb-2 text-center">Qty</th>
 <th class="pb-2 text-right">Total</th>
 </tr>
 </thead>
 <tbody>
 <tr
 v-for="(item, idx) in receipt.items || []"
 :key="idx"
 class="border-b border-gray-100 dark:border-gray-800"
 >
 <td class="py-2 pr-2 text-gray-900 dark:text-gray-100">{{ item.itemName }}</td>
 <td class="py-2 text-center text-gray-600">{{ item.quantity }}</td>
 <td class="py-2 text-right font-medium tabular-nums text-gray-900 dark:text-gray-100">
 {{ formatMoney(item.price * item.quantity) }}
 </td>
 </tr>
 </tbody>
 </table>
 <p class="mt-4 text-right text-sm font-semibold text-gray-900 dark:text-gray-50">
 Total: {{ formatMoney(receipt.total) }}
 </p>
 <p v-if="receipt.paymentMethod" class="mt-1 text-right text-[11px] text-gray-500">
 Paid via {{ receipt.paymentMethod }}
 </p>
 </section>

 <footer class="border-t border-gray-100 bg-gray-50 px-6 py-4 text-center dark:border-gray-800 dark:bg-slate-900/80">
 <p class="text-xs text-gray-600 dark:text-gray-400">Thank you for your business</p>
 <p class="mt-1 text-[10px] text-gray-400">Powered by Storvv</p>
 </footer>
 </article>
 </div>
 </div>
</template>

<script setup lang="ts">
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
 title: () => (receipt.value?.receiptNumber ? `Receipt #${receipt.value.receiptNumber}` : 'Receipt'),
})
</script>
