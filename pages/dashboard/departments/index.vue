<script setup lang="ts">
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
 resolveStoreDepartmentsPath(storesStore.currentStoreId, storesStore.stores[0]?.id) ??
 '/dashboard'

await navigateTo(target, { replace: true })
</script>

<template>
 <div class="flex min-h-[40vh] items-center justify-center text-sm text-gray-500 dark:text-gray-400">
 Opening departments…
 </div>
</template>
