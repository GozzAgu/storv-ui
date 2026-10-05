<template>
  <span v-if="lines <= 1" class="s-skeleton" :class="{ 's-skeleton--circle': circle }" :style="style" aria-hidden="true" />
  <span v-else class="s-skeleton-stack" aria-hidden="true">
    <span
      v-for="n in lines"
      :key="n"
      class="s-skeleton"
      :style="{ height: height, width: n === lines ? '60%' : '100%' }"
    />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    width?: string
    height?: string
    circle?: boolean
    lines?: number
  }>(),
  { width: '100%', height: '16px', lines: 1 }
)

const style = computed(() => ({
  width: props.circle ? props.height : props.width,
  height: props.height,
}))
</script>
