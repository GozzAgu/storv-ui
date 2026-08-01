<template>
  <component
    :is="tag"
    :class="['ios-native-list-row', disabled ? 'pointer-events-none opacity-50' : '']"
    v-bind="linkAttrs"
  >
    <span
      v-if="icon || $slots.icon"
      class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200"
    >
      <slot name="icon">
        <component :is="icon" v-if="icon" class="h-5 w-5" aria-hidden="true" />
      </slot>
    </span>

    <span class="min-w-0 flex-1">
      <span class="block text-[17px] font-medium leading-snug text-gray-900 dark:text-gray-100">
        {{ title }}
      </span>
      <span
        v-if="subtitle"
        class="mt-0.5 block text-sm leading-snug text-gray-500 dark:text-gray-400"
      >
        {{ subtitle }}
      </span>
    </span>

    <span v-if="value" class="shrink-0 text-sm text-gray-500 dark:text-gray-400">
      {{ value }}
    </span>

    <span v-if="showChevron" class="ios-native-list-row__chevron" aria-hidden="true">
      <svg class="h-4 w-4" viewBox="0 0 16 16" fill="none">
        <path
          d="M6 4l4 4-4 4"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </span>

    <slot name="trailing" />
  </component>
</template>

<script setup lang="ts">
import { computed, resolveComponent } from 'vue'
import type { Component } from 'vue'

const props = withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    value?: string
    to?: string
    href?: string
    icon?: Component
    showChevron?: boolean
    disabled?: boolean
  }>(),
  {
    subtitle: '',
    value: '',
    to: '',
    href: '',
    icon: undefined,
    showChevron: true,
    disabled: false,
  }
)

const tag = computed(() => {
  if (props.to) return resolveComponent('NuxtLink')
  if (props.href) return 'a'
  return 'button'
})

const linkAttrs = computed(() => {
  if (props.to) return { to: props.to, type: undefined }
  if (props.href) return { href: props.href, type: undefined }
  return { type: 'button' as const }
})
</script>
