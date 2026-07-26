<template>
  <div :class="rootClass">
    <component
      :is="icon"
      class="mb-3 h-8 w-8 shrink-0 text-gray-400 dark:text-gray-500"
      stroke-width="1.5"
      aria-hidden="true"
    />
    <p
      v-if="eyebrow"
      class="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-gray-500"
    >
      {{ eyebrow }}
    </p>
    <h3
      :class="[
        'max-w-md text-sm font-semibold tracking-tight text-gray-900 dark:text-gray-100',
        eyebrow ? 'mt-2' : '',
      ]"
    >
      {{ title }}
    </h3>
    <p
      v-if="description"
      class="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-gray-500 dark:text-gray-400"
    >
      {{ description }}
    </p>
    <ul
      v-if="tips?.length"
      class="mx-auto mt-3 max-w-md space-y-1.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400"
    >
      <li v-for="(tip, index) in tips" :key="index">
        {{ tip }}
      </li>
    </ul>
    <div v-if="$slots.default" class="mt-4 flex flex-wrap items-center justify-center gap-2">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

const props = withDefaults(
  defineProps<{
    icon: Component
    title: string
    description?: string
    /** Extra lines shown below the description (centered). */
    tips?: string[]
    eyebrow?: string
    /** Vertically fill the table body and center content (default on). */
    fill?: boolean
    extraClass?: string
  }>(),
  {
    fill: true,
    extraClass: '',
  }
)

const rootClass = computed(() => {
  const classes = [
    'dash-table-empty-state flex w-full min-w-0 flex-col items-center justify-center px-4 py-12 text-center sm:px-6 sm:py-16',
    props.extraClass,
  ]
  if (props.fill) {
    classes.push('dash-table-empty-state--fill')
  }
  return classes
})
</script>
