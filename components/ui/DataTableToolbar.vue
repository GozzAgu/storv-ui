<template>
  <div ref="root" class="dash-table-toolbar">
    <div
      v-if="$slots.heading"
      class="mb-3 flex min-w-0 items-start justify-between gap-2"
    >
      <div class="min-w-0 flex-1">
        <slot name="heading" />
      </div>
      <DashboardNativeTableViewToggle
        v-if="showIosTableToggle && !hasFilterRow"
        v-model="layoutMode"
        data-native-table-layout-toggle
        class="shrink-0"
        @update:model-value="setLayoutMode"
      />
    </div>
    <div
      v-if="hasFilterRow"
      class="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:gap-3"
    >
      <div v-if="$slots.filters" class="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        <slot name="filters" />
      </div>
      <div
        v-if="$slots.bulk || $slots.actions || (showIosTableToggle && hasFilterRow)"
        class="flex flex-wrap items-center gap-2"
        :class="
          $slots.filters
            ? bulkActionsClass
            : 'flex flex-wrap items-center gap-2 lg:ml-auto lg:shrink-0'
        "
      >
        <slot name="bulk" />
        <slot name="actions" />
        <DashboardNativeTableViewToggle
          v-if="showIosTableToggle && hasFilterRow"
          v-model="layoutMode"
          data-native-table-layout-toggle
          class="shrink-0"
          @update:model-value="setLayoutMode"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, useSlots, watch } from 'vue'
import { useRoute } from 'vue-router'
import DashboardNativeTableViewToggle from '~/components/dashboard/DashboardNativeTableViewToggle.vue'
import { useNativeTableLayout } from '~/composables/useNativeTableLayout'

const props = defineProps<{
  /** Unique key when a page has multiple tables (defaults to route path). */
  nativeTableKey?: string
}>()

const { bulkActionsClass } = useDashboardPageChrome()
const route = useRoute()
const root = ref<HTMLElement | null>(null)

const storageKey = computed(() => props.nativeTableKey ?? route.path)
const { isCapacitorIos, layoutMode, bindShell, setLayoutMode } = useNativeTableLayout(storageKey)

const slots = useSlots()
const showIosTableToggle = computed(() => isCapacitorIos.value)
const hasFilterRow = computed(() => !!(slots.filters || slots.bulk || slots.actions))

function attachShell() {
  if (!root.value) return
  const shell = root.value.closest(
    '.data-table-shell, .dash-table-shell, .activity-log-shell'
  ) as HTMLElement | null
  bindShell(shell)
}

onMounted(() => {
  attachShell()
})

watch(storageKey, () => attachShell())
</script>
