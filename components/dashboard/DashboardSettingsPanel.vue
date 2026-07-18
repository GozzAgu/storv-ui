<template>
  <section :class="panelClass">
    <header :class="panelHeaderClass">
      <div class="min-w-0 flex-1">
        <h2 :class="sectionTitleClass">{{ title }}</h2>
        <p v-if="subtitle" :class="sectionSubtitleClass">{{ subtitle }}</p>
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
defineProps<{
  title: string
  subtitle?: string
  badge?: string
  compact?: boolean
}>()

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
