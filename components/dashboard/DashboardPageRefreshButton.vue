<template>
  <button
    type="button"
    class="dash-topnav__icon-btn group relative inline-flex shrink-0 cursor-pointer disabled:cursor-wait disabled:opacity-60"
    :class="extraClass"
    aria-label="Refresh page"
    title="Refresh"
    :disabled="busy"
    @click="onRefresh"
  >
    <ArrowPathIcon
      class="h-4 w-4 text-gray-600 transition-colors group-hover:text-gray-900 dark:text-gray-300 dark:group-hover:text-gray-100"
      :class="busy ? 'animate-spin' : ''"
      stroke-width="1.75"
      aria-hidden="true"
    />
  </button>
</template>

<script setup lang="ts">
import { ArrowPathIcon } from '~/utils/app-icons'
import {
  runDefaultDashboardRefresh,
  useDashboardPageRefreshHandler,
} from '~/composables/useDashboardPageRefresh'
import { useAppToast } from '~/composables/useAppToast'

withDefaults(
  defineProps<{
    extraClass?: string
  }>(),
  { extraClass: '' }
)

const handler = useDashboardPageRefreshHandler()
const toast = useAppToast()
const busy = ref(false)

async function onRefresh() {
  if (busy.value) return
  busy.value = true
  try {
    if (handler.value) {
      await handler.value()
    } else {
      await runDefaultDashboardRefresh()
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Could not refresh'
    toast.error(message)
  } finally {
    busy.value = false
  }
}
</script>
