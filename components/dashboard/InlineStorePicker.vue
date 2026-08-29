<template>
  <div class="mt-4 flex w-full max-w-md flex-col items-center gap-3">
    <p class="text-xs text-gray-500 dark:text-gray-400">
      {{ stores.length === 0 ? 'No stores yet' : 'Choose a store to continue' }}
    </p>

    <div
      v-if="loading"
      class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400"
    >
      <svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      Loading stores…
    </div>

    <div v-else-if="stores.length === 0" class="text-center">
      <NuxtLink
        to="/dashboard/settings"
        class="text-xs font-medium text-primary-700 hover:underline dark:text-primary-300"
      >
        Add your first store in Settings
      </NuxtLink>
    </div>

    <div v-else class="flex w-full flex-wrap justify-center gap-2">
      <button
        v-for="store in stores"
        :key="store.id"
        type="button"
        class="inline-flex min-h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-800 transition-colors hover:border-primary-400 hover:bg-primary-50/60 disabled:cursor-wait disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-gray-100 dark:hover:border-primary-500/40 dark:hover:bg-primary-500/10"
        :disabled="switchingStoreId === store.id"
        @click="selectStore(store.id)"
      >
        <BuildingStorefrontIcon class="h-3.5 w-3.5 shrink-0 opacity-70" stroke-width="1.6" />
        <span class="truncate max-w-[10rem]">
          {{ switchingStoreId === store.id ? 'Switching…' : branchLabel(store.name) }}
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { BuildingStorefrontIcon } from '~/utils/app-icons'
import { useStoresStore } from '~/stores/stores'
import { useUserStore } from '~/stores/user'
import { useAppToast } from '~/composables/useAppToast'
import { getStoreBranchShortLabel } from '~/utils/store-branch-label'

const storesStore = useStoresStore()
const userStore = useUserStore()
const toast = useAppToast()
const { canUse: canUseBusinessCapability } = useBusinessCapabilities()

const switchingStoreId = ref<string | null>(null)

const loading = computed(() => storesStore.loading)
const { eligibleStores } = usePlanEligibleStores()
const stores = computed(() =>
  userStore.userData?.role === 'superAdmin' ? eligibleStores.value : storesStore.stores
)

function branchLabel(name: string | null | undefined) {
  return getStoreBranchShortLabel(name) || 'Unnamed store'
}

async function selectStore(storeId: string) {
  if (switchingStoreId.value) return

  if (
    userStore.userData?.role === 'superAdmin' &&
    !canUseBusinessCapability('multiLocationAdmin') &&
    storeId !== storesStore.currentStoreId
  ) {
    toast.error('Branches are not available on your workspace style.')
    return
  }

  try {
    switchingStoreId.value = storeId

    const [departmentsModule, staffModule, inventoryModule, receiptsModule, customersModule] =
      await Promise.all([
        import('~/stores/departments'),
        import('~/stores/staff'),
        import('~/stores/inventory'),
        import('~/stores/receipts'),
        import('~/stores/customers'),
      ])

    const departmentsStore = departmentsModule.useDepartmentsStore()
    const staffStore = staffModule.useStaffStore()
    const inventoryStore = inventoryModule.useInventoryStore()
    const receiptsStore = receiptsModule.useReceiptsStore()
    const customersStore = customersModule.useCustomersStore()

    departmentsStore.loading = true
    staffStore.loading = true
    inventoryStore.loading = true
    receiptsStore.loading = true
    customersStore.loading = true

    await storesStore.setCurrentStore(storeId)

    const storeName = branchLabel(storesStore.getStoreById(storeId)?.name)
    toast.success(`Switched to ${storeName}`)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to switch store'
    toast.error(message)
  } finally {
    switchingStoreId.value = null
  }
}

onMounted(async () => {
  if (storesStore.stores.length === 0 && !storesStore.loading) {
    await storesStore.fetchStores()
  }
  if (!storesStore.currentStoreId) {
    await storesStore.initializeCurrentStore()
  }
})
</script>
