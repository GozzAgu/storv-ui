<template>
  <div class="flex flex-col items-center justify-center px-6 py-12 text-center">
    <div
      class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400"
    >
      <slot name="icon">
        <component :is="icon" v-if="icon" class="h-8 w-8" aria-hidden="true" />
      </slot>
    </div>
    <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100">{{ title }}</h3>
    <p v-if="description" class="mt-2 max-w-sm text-[15px] leading-relaxed text-gray-500 dark:text-gray-400">
      {{ description }}
    </p>
    <div v-if="$slots.action || actionLabel" class="mt-6">
      <slot name="action">
        <button
          v-if="actionLabel"
          type="button"
          class="rounded-xl bg-[#143f8d] px-5 py-2.5 text-sm font-semibold text-white dark:bg-[#4876c7]"
          @click="$emit('action')"
        >
          {{ actionLabel }}
        </button>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

withDefaults(
  defineProps<{
    title: string
    description?: string
    actionLabel?: string
    icon?: Component
  }>(),
  {
    description: '',
    actionLabel: '',
    icon: undefined,
  }
)

defineEmits<{
  action: []
}>()
</script>
