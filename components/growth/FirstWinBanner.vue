<template>
  <section
    v-if="visible"
    class="mb-4 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.05] px-4 py-4 dark:border-emerald-400/20 dark:bg-emerald-500/[0.08]"
  >
    <p class="text-[10px] font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
      First win
    </p>
    <h2 class="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
      Add your first product, then record a sale
    </h2>
    <p class="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-400">
      Most shop owners who complete these two steps in their first session keep using Storvv. It takes about five minutes.
    </p>
    <div class="mt-3 flex flex-wrap gap-2">
      <NuxtLink
        to="/dashboard/inventory"
        class="inline-flex items-center rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
      >
        Add a product
      </NuxtLink>
      <NuxtLink
        to="/dashboard/receipts"
        class="inline-flex items-center rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-gray-200"
      >
        Record a sale
      </NuxtLink>
      <button
        type="button"
        class="text-xs font-medium text-gray-500 hover:text-gray-800 dark:text-gray-400"
        @click="dismiss"
      >
        Dismiss
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import { useInventoryStore } from '~/stores/inventory'
import { useReceiptsStore } from '~/stores/receipts'

const route = useRoute()
const authStore = useAuthStore()
const userStore = useUserStore()
const inventoryStore = useInventoryStore()
const receiptsStore = useReceiptsStore()

const dismissedLocal = ref(false)

function dismissKey(uid: string) {
  return `storvv-first-win-dismissed-${uid}`
}

const visible = computed(() => {
  const uid = authStore.currentUser?.uid
  if (!uid || userStore.userData?.role !== 'superAdmin') return false
  if (dismissedLocal.value) return false
  if (import.meta.client && localStorage.getItem(dismissKey(uid)) === '1') return false
  if (inventoryStore.totalItems > 0 && receiptsStore.receipts.length > 0) return false
  if (userStore.userData?.activationFunnel?.firstSaleAt) return false
  return route.query.welcome === '1' || route.query.firstWin === '1' || !userStore.userData?.activationFunnel?.firstInventoryItemAt
})

function dismiss() {
  const uid = authStore.currentUser?.uid
  if (uid && import.meta.client) localStorage.setItem(dismissKey(uid), '1')
  dismissedLocal.value = true
}
</script>
