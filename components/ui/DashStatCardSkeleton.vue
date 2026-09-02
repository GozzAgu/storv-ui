<template>
  <div
    class="dash-stat-card dash-stat-card--skeleton"
    :class="hero ? 'dash-kpi-hero' : ''"
    aria-hidden="true"
  >
    <div class="dash-stat-card__body">
      <span class="dash-skeleton dash-skeleton--line dash-skeleton--line-label" />
      <div class="dash-stat-card__row">
        <span class="dash-skeleton dash-skeleton--line dash-skeleton--line-value" />
      </div>
      <span class="dash-skeleton dash-skeleton--line dash-skeleton--line-sub" />
      <span v-if="hero" class="dash-skeleton dash-skeleton--spark" />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    hero?: boolean
  }>(),
  {
    hero: false,
  }
)
</script>
