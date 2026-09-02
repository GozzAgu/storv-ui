<template>
  <section :class="['dash-card dash-chart-skeleton', extraClass]" aria-hidden="true">
    <div class="dash-chart-skeleton__head">
      <div class="min-w-0 flex-1 space-y-2">
        <span class="dash-skeleton dash-skeleton--line dash-skeleton--line-title" />
        <span class="dash-skeleton dash-skeleton--line dash-skeleton--line-meta" />
      </div>
      <span v-if="showControl" class="dash-skeleton dash-skeleton--line dash-skeleton--select" />
    </div>
    <div v-if="variant === 'bars'" class="dash-chart-skeleton__bars">
      <div v-for="i in 4" :key="i" class="dash-chart-skeleton__bar-row">
        <div class="flex items-center justify-between gap-3">
          <span class="dash-skeleton dash-skeleton--line dash-skeleton--line-meta" />
          <span class="dash-skeleton dash-skeleton--line" style="width: 4.5rem" />
        </div>
        <span class="dash-skeleton dash-skeleton--bar" />
      </div>
    </div>
    <div v-else-if="variant === 'list'" class="dash-chart-skeleton__list">
      <div v-for="i in 5" :key="i" class="dash-chart-skeleton__list-row">
        <span
          class="dash-skeleton"
          :class="leading === 'avatar' ? 'dash-skeleton--avatar' : 'dash-skeleton--thumb'"
        />
        <div class="min-w-0 flex-1 space-y-1.5">
          <span class="dash-skeleton dash-skeleton--line dash-skeleton--line-title" />
          <span class="dash-skeleton dash-skeleton--line dash-skeleton--line-meta" />
        </div>
        <span class="dash-skeleton dash-skeleton--line" style="width: 3.5rem" />
      </div>
    </div>
    <div v-else class="dash-skeleton dash-skeleton--chart" />
  </section>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'chart' | 'bars' | 'list'
    leading?: 'icon' | 'avatar'
    showControl?: boolean
    extraClass?: string
  }>(),
  {
    variant: 'chart',
    leading: 'icon',
    showControl: false,
    extraClass: '',
  }
)
</script>
