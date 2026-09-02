<template>
  <div class="ios-analytics-skeleton" aria-busy="true" aria-label="Loading analytics">
    <div class="ios-skeleton ios-home-skeleton ios-home-skeleton--title" />
    <div class="ios-analytics-period-card">
      <div class="ios-skeleton ios-home-skeleton ios-home-skeleton--bar" />
    </div>
    <div class="ios-analytics-actions">
      <div class="ios-skeleton ios-skeleton--line" style="width: 4.5rem; height: 2.5rem; border-radius: 12px; margin-left: auto" />
    </div>
    <div class="ios-home-dashboard__metrics-grid">
      <div
        v-for="i in 6"
        :key="`metric-${i}`"
        class="ios-skeleton ios-home-skeleton ios-home-skeleton--metric"
      />
    </div>
    <div class="ios-skeleton ios-home-skeleton ios-analytics-skeleton__panel" />
    <div class="ios-skeleton ios-home-skeleton ios-analytics-skeleton__chart" />
    <div class="ios-skeleton ios-home-skeleton ios-analytics-skeleton__chart" />
    <div class="ios-skeleton ios-home-skeleton ios-analytics-skeleton__panel" />
  </div>
</template>
