<template>
  <div class="ios-inventory-item-detail">
    <div class="ios-inventory-item-detail__hero">
      <div class="ios-inventory-item-detail__glyph" aria-hidden="true">
        <CubeIcon class="h-7 w-7" stroke-width="1.5" />
      </div>
      <h2 :class="titleClass">{{ name }}</h2>
      <p v-if="subtitle" :class="subtitleClass">{{ subtitle }}</p>
    </div>

    <div v-if="stats.length" class="ios-inventory-item-detail__stats">
      <div v-for="stat in stats" :key="stat.label" class="ios-inventory-item-detail__stat">
        <span :class="statLabelClass">{{ stat.label }}</span>
        <span :class="statValueClass">{{ stat.value }}</span>
      </div>
    </div>

    <slot name="banner" />

    <IosGroupedSection v-if="detailRows.length" label="Details">
      <div
        v-for="(row, index) in detailRows"
        :key="row.label"
        class="ios-inventory-detail-row"
        :class="{ 'ios-inventory-detail-row--border': index < detailRows.length - 1 }"
      >
        <span :class="rowLabelClass">{{ row.label }}</span>
        <span :class="rowValueClass">{{ row.value }}</span>
      </div>
    </IosGroupedSection>

    <IosGroupedSection v-if="actions.length" label="Actions">
      <IosNativeListRow
        v-for="action in actions"
        :key="action.id"
        :title="action.label"
        :subtitle="action.subtitle"
        :show-chevron="false"
        @click="action.onSelect"
      />
    </IosGroupedSection>
  </div>
</template>

<script setup lang="ts">
import { CubeIcon } from '~/utils/app-icons'
import IosGroupedSection from '~/components/ios/IosGroupedSection.vue'
import IosNativeListRow from '~/components/ios/IosNativeListRow.vue'
import { buildIosTextClass } from '~/composables/useIosTypography'

export type IosInventoryDetailRow = {
  label: string
  value: string
}

export type IosInventoryDetailStat = {
  label: string
  value: string
}

export type IosInventoryDetailAction = {
  id: string
  label: string
  subtitle?: string
  onSelect: () => void
}

defineProps<{
  name: string
  subtitle?: string
  stats: IosInventoryDetailStat[]
  detailRows: IosInventoryDetailRow[]
  actions?: IosInventoryDetailAction[]
}>()

const titleClass = buildIosTextClass('title2')
const subtitleClass = `${buildIosTextClass('footnote', { secondary: true })} text-gray-500 dark:text-gray-400`
const statLabelClass = `${buildIosTextClass('caption2', { secondary: true })} uppercase tracking-wide`
const statValueClass = `${buildIosTextClass('headline', { tabular: true })} text-gray-900 dark:text-gray-100`
const rowLabelClass = `${buildIosTextClass('footnote', { secondary: true })} ios-inventory-detail-row__label`
const rowValueClass = `${buildIosTextClass('body', { tabular: true })} ios-inventory-detail-row__value`
</script>
