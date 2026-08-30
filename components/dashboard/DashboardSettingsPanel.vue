<template>
  <section
    :id="id"
    :class="[panelClass, iosGrouped ? 'dash-settings-panel--ios-grouped' : '']"
  >
    <header :class="panelHeaderClass">
      <div class="min-w-0 flex-1">
        <h2 :class="sectionTitleClass">{{ title }}</h2>
        <p v-if="subtitle && !iosGrouped" :class="sectionSubtitleClass">{{ subtitle }}</p>
      </div>
      <div v-if="$slots.actions || badge" class="flex shrink-0 flex-wrap items-center gap-2">
        <slot name="actions" />
        <span v-if="badge && !$slots.actions" :class="planBadgeClass">{{ badge }}</span>
      </div>
    </header>
    <div :class="compact ? panelBodyCompactClass : panelBodyClass">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  id?: string
  title: string
  subtitle?: string
  badge?: string
  compact?: boolean
  /** iOS Settings-style grouped section (uppercase label + inset list). */
  iosGrouped?: boolean
}>()

const { isCapacitorIos } = useIsCapacitorIos()
const iosGrouped = computed(() => props.iosGrouped ?? isCapacitorIos.value)

const {
  panelClass,
  panelHeaderClass,
  panelBodyClass,
  panelBodyCompactClass,
  sectionTitleClass,
  sectionSubtitleClass,
  planBadgeClass,
} = useDashboardSettingsChrome()
</script>
