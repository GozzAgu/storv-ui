<template>
  <div class="s-store-picker">
    <div v-if="loading" class="s-store-picker__status" role="status">
      <SSpinner :size="16" />
      Loading stores…
    </div>

    <SButton v-else-if="stores.length === 0" variant="primary" to="/dashboard/branches">
      Add your first store
    </SButton>

    <div v-else class="s-store-picker__list" role="group" aria-label="Choose a store">
      <SButton
        v-for="store in stores"
        :key="store.id"
        :loading="switchingStoreId === store.id"
        :disabled="!!switchingStoreId && switchingStoreId !== store.id"
        @click="selectStore(store.id)"
      >
        <template v-if="switchingStoreId !== store.id" #leading>
          <Store :size="16" :stroke-width="1.75" aria-hidden="true" />
        </template>
        <span class="s-store-picker__name">{{ storePrimaryLabel(store) }}</span>
      </SButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Store } from '@lucide/vue'
import SButton from '~/components/s/SButton.vue'
import SSpinner from '~/components/s/SSpinner.vue'
import { useStoresStore } from '~/stores/stores'
import { useUserStore } from '~/stores/user'
import { useAppToast } from '~/composables/useAppToast'
import { getStoreSwitcherPrimaryLabel } from '~/utils/branch-name'

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

function storePrimaryLabel(store: { id?: string; name?: string | null }) {
  return getStoreSwitcherPrimaryLabel(store, stores.value) || 'Unnamed store'
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
