<template>
  <div class="ios-analytics-skeleton" aria-busy="true" aria-label="Loading analytics">
    <div class="ios-home-skeleton ios-home-skeleton--title" />
    <div class="ios-home-skeleton ios-home-skeleton--bar" />
    <div class="ios-home-dashboard__metrics-grid">
      <div v-for="i in 6" :key="`metric-${i}`" class="ios-home-skeleton ios-home-skeleton--metric" />
    </div>
    <div class="ios-home-skeleton ios-analytics-skeleton__panel" />
    <div class="ios-home-skeleton ios-analytics-skeleton__chart" />
    <div class="ios-home-skeleton ios-analytics-skeleton__chart" />
    <div class="ios-home-skeleton ios-analytics-skeleton__panel" />
  </div>
</template>
