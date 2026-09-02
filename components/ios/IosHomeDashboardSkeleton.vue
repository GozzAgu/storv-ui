<template>
  <div class="ios-home-dashboard" aria-busy="true" aria-label="Loading dashboard">
    <div class="ios-skeleton ios-home-skeleton ios-home-skeleton--logo" />
    <div class="ios-skeleton ios-home-skeleton ios-home-skeleton--greeting" />
    <div class="ios-home-dashboard__section-head">
      <div class="ios-skeleton ios-home-skeleton ios-home-skeleton--title" />
    </div>
    <div class="ios-home-dashboard__metrics-grid">
      <div
        v-for="i in 4"
        :key="i"
        class="ios-skeleton ios-home-skeleton ios-home-skeleton--metric"
      />
    </div>
    <div class="ios-home-dashboard__section-head">
      <div class="ios-skeleton ios-home-skeleton ios-home-skeleton--title" />
    </div>
    <div class="ios-home-dashboard__feed">
      <div
        v-for="i in 3"
        :key="`feed-${i}`"
        class="ios-skeleton ios-home-skeleton ios-home-skeleton--feed"
      />
    </div>
  </div>
</template>
