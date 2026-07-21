<template>
  <div :class="toolbarRowClass">
    <div
      v-if="$slots.filters || $slots.default"
      class="flex min-w-0 flex-1 flex-wrap items-center gap-2"
    >
      <slot name="filters" />
      <slot />
    </div>
    <div
      v-if="$slots.bulk"
      :class="[$slots.filters || $slots.default ? bulkActionsClass : 'flex flex-wrap items-center gap-2 lg:ml-auto lg:shrink-0']"
    >
      <slot name="bulk" />
    </div>
  </div>
</template>

<script setup lang="ts">
const { toolbarRowClass, bulkActionsClass } = useDashboardPageChrome()
</script>
