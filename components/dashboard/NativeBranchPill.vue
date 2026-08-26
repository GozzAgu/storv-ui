<template>
  <StoreSelector v-if="canSwitchStore" variant="command-pill" class="min-w-0 max-w-full" />
  <div
    v-else
    class="native-command-header__branch-readonly"
    :title="storeLabel"
  >
    <BuildingStorefrontIcon class="h-3.5 w-3.5 shrink-0 opacity-70" stroke-width="1.75" />
    <span class="truncate">{{ storeLabel }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { BuildingStorefrontIcon } from '~/utils/app-icons'
import StoreSelector from '~/components/ui/StoreSelector.vue'
import { useStoresStore } from '~/stores/stores'
import { useUserStore } from '~/stores/user'
import { getStoreBranchShortLabel } from '~/utils/store-branch-label'

const storesStore = useStoresStore()
const userStore = useUserStore()

const canSwitchStore = computed(() => userStore.userData?.role === 'superAdmin')

const storeLabel = computed(() => {
  const store = storesStore.currentStore
  if (!store) return 'No store selected'
  return getStoreBranchShortLabel(store.name) || store.name
})
</script>
