<template>
  <div class="dash-table-toolbar">
    <div v-if="$slots.heading" class="mb-3 min-w-0">
      <slot name="heading" />
    </div>
    <div
      v-if="$slots.filters || $slots.bulk || $slots.actions"
      class="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:gap-3"
    >
      <div v-if="$slots.filters" class="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        <slot name="filters" />
      </div>
      <div
        v-if="$slots.bulk || $slots.actions"
        class="flex flex-wrap items-center gap-2"
        :class="$slots.filters ? bulkActionsClass : 'flex flex-wrap items-center gap-2 lg:ml-auto lg:shrink-0'"
      >
        <slot name="bulk" />
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { bulkActionsClass } = useDashboardPageChrome()
</script>
