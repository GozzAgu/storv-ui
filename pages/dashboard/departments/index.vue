<script setup lang="ts">
import SSpinner from '~/components/s/SSpinner.vue'
import { resolveStoreDepartmentsPath } from '~/utils/department-routes'
import { useStoresStore } from '~/stores/stores'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
  ssr: false,
})

const storesStore = useStoresStore()

if (import.meta.client) {
  await storesStore.initializeCurrentStore()
}

const target =
  resolveStoreDepartmentsPath(storesStore.currentStoreId, storesStore.stores[0]?.id) ?? '/dashboard'

await navigateTo(target, { replace: true })
</script>

<template>
  <div class="ds-root s-c s-page s-redirect" role="status">
    <SSpinner :size="16" />
    Opening departments…
  </div>
</template>
