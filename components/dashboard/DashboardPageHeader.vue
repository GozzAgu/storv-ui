<template>
 <header :class="pageHeaderClass">
 <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
 <div class="min-w-0">
 <slot name="eyebrow" />
 <slot name="title" />
 <slot name="description" />
 </div>
 <div v-if="$slots.actions" class="flex shrink-0 items-center gap-2 sm:justify-end">
 <slot name="actions" />
 </div>
 </div>
 <div v-if="$slots.toolbar" :class="toolbarDividerClass">
 <DashboardToolbarRow>
 <slot name="toolbar" />
 </DashboardToolbarRow>
 </div>
 </header>
</template>

<script setup lang="ts">
const { pageHeaderClass, toolbarDividerClass } = useDashboardPageChrome()
</script>
