<template>
  <section :class="cardClass">
    <div :class="[cardHeaderClass, 'dash-card__header--compact']">
      <div class="flex min-w-0 items-start gap-2.5">
        <div :class="insightIconClass">
          <component :is="insight.icon" class="h-4 w-4" stroke-width="1.75" aria-hidden="true" />
        </div>
        <div class="min-w-0">
          <h2 :class="cardTitleClass">{{ insight.title }}</h2>
          <p :class="cardDescClass">{{ insight.description }}</p>
        </div>
      </div>
      <NuxtLink v-if="insight.href && insight.linkLabel" :to="insight.href" :class="cardLinkClass">
        {{ insight.linkLabel }}
      </NuxtLink>
    </div>

    <p v-if="insight.highlight" :class="[insightHighlightClass, numClass]">
      {{ insight.highlight }}
    </p>

    <dl v-if="insight.metrics.length > 0" :class="metricCellsClass">
      <div v-for="metric in insight.metrics" :key="metric.label" :class="metricCellClass">
        <dt>{{ metric.label }}</dt>
        <dd :class="numClass">{{ metric.value }}</dd>
      </div>
    </dl>
  </section>
</template>

<script setup lang="ts">
import type { AnalyticsFeatureInsight } from '~/composables/useAnalyticsFeatureInsights'

defineProps<{
  insight: AnalyticsFeatureInsight
  cardClass?: string
  cardHeaderClass?: string
  cardTitleClass?: string
  cardDescClass?: string
  cardLinkClass?: string
  insightIconClass?: string
  insightHighlightClass?: string
  metricCellsClass?: string
  metricCellClass?: string
  numClass?: string
}>()
</script>
