<template>
  <IosStatCard
    v-if="isCapacitorIos"
    :class="hero ? 'dash-kpi-hero' : ''"
    :label="label"
    :value="value"
    :subtext="subtext"
    :change="change"
    :change-positive="changePositive"
    :sparkline-data="sparklineData"
    :hero="hero"
    :accent="iosAccent"
  />
  <StatCard
    v-else
    :label="label"
    :value="value"
    :subtext="subtext"
    :subtext-class="subtextClass"
    :change="change"
    :change-positive="changePositive"
    :sparkline-data="sparklineData"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import StatCard from '~/components/ui/StatCard.vue'
import IosStatCard from '~/components/ios/IosStatCard.vue'
import { useIsCapacitorIos } from '~/composables/useNativeTableLayout'

const props = withDefaults(
  defineProps<{
    label: string
    value?: string | number
    subtext?: string
    subtextClass?: string
    change?: string | null
    changePositive?: boolean | null
    sparklineData?: number[]
    hero?: boolean
  }>(),
  {
    value: '',
    subtext: '',
    subtextClass: '',
    change: undefined,
    changePositive: null,
    sparklineData: undefined,
    hero: false,
  }
)

const { isCapacitorIos } = useIsCapacitorIos()

const iosAccent = computed(() => {
  if (props.subtextClass === 'warning') return 'warning'
  if (props.subtextClass === 'danger') return 'danger'
  if (props.subtextClass === 'success') return 'success'
  return 'default'
})
</script>
