<template>
  <section
    v-if="visible"
    class="rounded-xl border border-primary-500/20 bg-primary-500/[0.04] px-4 py-4 dark:border-primary-400/15 dark:bg-primary-500/[0.07] sm:px-5"
    aria-labelledby="getting-started-heading"
  >
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-700/80 dark:text-primary-300/80">
          Getting started
        </p>
        <h2 id="getting-started-heading" class="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
          Set up your store in {{ steps.length }} steps
        </h2>
        <p class="mt-1 text-xs text-gray-600 dark:text-gray-400">
          {{ completedCount }} of {{ steps.length }} complete
        </p>
      </div>
      <button
        type="button"
        class="text-[11px] font-medium text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
        @click="dismiss"
      >
        Dismiss
      </button>
    </div>

    <div class="mt-1.5 h-1 overflow-hidden rounded-full bg-gray-200/80 dark:bg-white/10">
      <div
        class="h-full rounded-full bg-primary-600 transition-all duration-300 dark:bg-primary-500"
        :style="{ width: `${progressPercent}%` }"
      />
    </div>

    <ol class="mt-4 space-y-2">
      <li
        v-for="step in steps"
        :key="step.id"
        class="flex items-start gap-3 rounded-lg border border-transparent px-1 py-1.5"
        :class="step.done ? 'opacity-80' : ''"
      >
        <span
          class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
          :class="
            step.done
              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
              : 'bg-gray-200/80 text-gray-600 dark:bg-white/10 dark:text-gray-300'
          "
          aria-hidden="true"
        >
          <CheckIcon v-if="step.done" class="h-3 w-3" stroke-width="2.5" />
          <span v-else>{{ step.order }}</span>
        </span>
        <div class="min-w-0 flex-1">
          <p class="text-xs font-medium text-gray-900 dark:text-gray-100">
            {{ step.title }}
          </p>
          <p class="mt-0.5 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
            {{ step.description }}
          </p>
        </div>
        <NuxtLink
          v-if="!step.done"
          :to="step.href"
          class="shrink-0 text-[11px] font-semibold text-primary-700 hover:underline dark:text-primary-300"
        >
          {{ step.cta }}
        </NuxtLink>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { CheckIcon } from '~/utils/app-icons'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import { useInventoryStore } from '~/stores/inventory'
import { useReceiptsStore } from '~/stores/receipts'
import { useDepartmentsStore } from '~/stores/departments'
import { useStoresStore } from '~/stores/stores'
import { resolveStoreDepartmentsPath } from '~/utils/department-routes'

interface ChecklistStep {
  id: string
  order: number
  title: string
  description: string
  href: string
  cta: string
  done: boolean
}

const authStore = useAuthStore()
const userStore = useUserStore()
const inventoryStore = useInventoryStore()
const receiptsStore = useReceiptsStore()
const departmentsStore = useDepartmentsStore()
const storesStore = useStoresStore()
const { canUse: canUseBusinessCapability } = useBusinessCapabilities()

const dismissed = ref(false)

function dismissStorageKey(uid: string) {
  return `storvv-getting-started-dismissed-${uid}`
}

function readDismissed(uid: string | undefined) {
  if (!import.meta.client || !uid) return false
  return localStorage.getItem(dismissStorageKey(uid)) === '1'
}

function writeDismissed(uid: string) {
  if (!import.meta.client) return
  localStorage.setItem(dismissStorageKey(uid), '1')
}

const hasCategory = computed(() => inventoryStore.folders.length > 0)
const hasProduct = computed(() => inventoryStore.totalItems > 0)
const hasSale = computed(() => receiptsStore.receipts.length > 0)
const hasStaff = computed(() => {
  const storeId = storesStore.currentStoreId
  if (!storeId) return false
  return departmentsStore.departments
    .filter((dept) => dept.storeId === storeId)
    .some((dept) => (dept.staffCount || 0) > 0)
})

const staffDepartmentsHref = computed(() => {
  const storeId = storesStore.currentStoreId || storesStore.stores[0]?.id
  return resolveStoreDepartmentsPath(storeId, storesStore.stores[0]?.id) ?? '/dashboard/settings'
})

const steps = computed((): ChecklistStep[] => {
  const allSteps: ChecklistStep[] = [
    {
      id: 'category',
      order: 1,
      title: 'Create an inventory category',
      description: 'Group products so your team can find stock quickly.',
      href: '/dashboard/inventory',
      cta: 'Add category',
      done: hasCategory.value,
    },
    {
      id: 'product',
      order: 2,
      title: 'Add your first product',
      description: 'Open a category and add at least one item to sell.',
      href: hasCategory.value
        ? `/dashboard/inventory/${inventoryStore.folders[0]?.id ?? ''}`
        : '/dashboard/inventory',
      cta: 'Add product',
      done: hasProduct.value,
    },
    {
      id: 'sale',
      order: 3,
      title: 'Record a sale',
      description: 'Create a receipt to start tracking revenue and payments.',
      href: '/dashboard/receipts',
      cta: 'Create sale',
      done: hasSale.value,
    },
    {
      id: 'staff',
      order: 4,
      title: 'Invite a team member',
      description: 'Add staff to a department so they can sign in with their role.',
      href: staffDepartmentsHref.value,
      cta: 'Add staff',
      done: hasStaff.value,
    },
  ]

  if (!canUseBusinessCapability('staffManagement')) {
    return allSteps.filter((step) => step.id !== 'staff')
  }

  return allSteps
})

const completedCount = computed(() => steps.value.filter((step) => step.done).length)
const allComplete = computed(() => completedCount.value === steps.value.length)
const progressPercent = computed(() =>
  steps.value.length === 0 ? 0 : Math.round((completedCount.value / steps.value.length) * 100)
)

const visible = computed(() => {
  if (dismissed.value) return false
  if (!userStore.isSuperAdmin) return false
  if (!userStore.hasCompletedOnboarding) return false
  if (allComplete.value) return false
  return true
})

function dismiss() {
  dismissed.value = true
  const uid = authStore.currentUser?.uid
  if (uid) writeDismissed(uid)
}

onMounted(() => {
  dismissed.value = readDismissed(authStore.currentUser?.uid)
})

watch(
  () => authStore.currentUser?.uid,
  (uid) => {
    dismissed.value = readDismissed(uid)
  }
)
</script>
