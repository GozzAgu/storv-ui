<template>
  <header :class="[pageHeaderClass, iosContextOnly ? 'dash-page-header--ios-context' : '']">
    <div v-if="!iosContextOnly || $slots.actions" class="flex flex-col gap-3">
      <div v-if="!iosContextOnly && $slots.eyebrow" class="min-w-0">
        <slot name="eyebrow" />
      </div>
      <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div v-if="!iosContextOnly" class="min-w-0 flex-1">
          <slot name="title" />
        </div>
        <div v-if="$slots.actions" class="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          <slot name="actions" />
        </div>
      </div>
      <div
        v-if="!iosContextOnly && $slots.description"
        class="dash-page-header__description min-w-0 w-full"
      >
        <slot name="description" />
      </div>
    </div>
    <div
      v-if="$slots.toolbar || $slots.filters || $slots.bulk"
      :class="toolbarDividerClass"
    >
      <DashboardToolbarRow>
        <template v-if="$slots.filters" #filters>
          <slot name="filters" />
        </template>
        <template v-if="!$slots.filters && $slots.toolbar">
          <slot name="toolbar" />
        </template>
        <template v-if="$slots.bulk" #bulk>
          <slot name="bulk" />
        </template>
      </DashboardToolbarRow>
    </div>
  </header>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    /** Hide title/eyebrow/description — command header shows screen context on iOS. */
    iosContextOnly?: boolean
  }>(),
  { iosContextOnly: false }
)

const { pageHeaderClass, toolbarDividerClass } = useDashboardPageChrome()
</script>
