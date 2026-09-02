<template>
  <div
    :class="[
      'dash-empty-state flex flex-col items-center justify-center text-center',
      compact ? 'dash-empty-state--compact py-4 sm:py-6' : 'py-6 sm:py-8',
      fill ? 'min-h-[min(40vh,18rem)] flex-1' : '',
    ]"
  >
    <div class="dash-empty-state__mark">
      <component
        :is="icon"
        :class="[
          'dash-empty-state__icon shrink-0 text-gray-400 dark:text-gray-500',
          compact ? 'h-7 w-7' : 'h-8 w-8',
        ]"
        stroke-width="1.5"
        aria-hidden="true"
      />
    </div>
    <p
      v-if="eyebrow"
      class="dash-empty-state__eyebrow text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-gray-500"
    >
      {{ eyebrow }}
    </p>
    <h3
      :class="[
        'dash-empty-state__title max-w-md font-semibold tracking-tight text-gray-900 dark:text-gray-100',
        compact ? 'text-sm' : 'text-sm sm:text-base',
        eyebrow ? 'mt-2' : 'mb-1.5',
      ]"
    >
      {{ title }}
    </h3>
    <p
      v-if="description"
      :class="[
        'dash-empty-state__desc mx-auto max-w-md leading-relaxed text-gray-500 dark:text-gray-400',
        compact ? 'text-xs' : 'text-xs sm:text-sm',
        descriptionClass,
      ]"
    >
      {{ description }}
    </p>
    <ul
      v-if="tips?.length"
      class="dash-empty-state__tips mx-auto mt-3 max-w-md space-y-1.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400"
    >
      <li v-for="(tip, index) in tips" :key="index" class="dash-empty-state__tip">
        {{ tip }}
      </li>
    </ul>
    <div
      v-if="$slots.default"
      :class="['dash-empty-state__actions', compact ? 'mt-3' : 'mt-4']"
    >
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

withDefaults(
  defineProps<{
    icon: Component
    title: string
    description?: string
    tips?: string[]
    eyebrow?: string
    compact?: boolean
    fill?: boolean
    descriptionClass?: string
  }>(),
  {
    descriptionClass: '',
    fill: false,
  }
)
</script>
