<template>
  <div class="text-center" :class="compact ? 'py-4 sm:py-6' : 'py-6 sm:py-8'">
    <div
      :class="[
        'mx-auto flex items-center justify-center rounded-sm mb-3 sm:mb-4',
        iconBgClass,
        compact ? 'w-14 h-14' : 'w-16 h-16 sm:w-20 sm:h-20'
      ]"
    >
      <component
        :is="icon"
        :class="[
          'text-gray-500 dark:text-gray-400',
          compact ? 'w-7 h-7' : 'w-8 h-8 sm:w-10 sm:h-10'
        ]"
      />
    </div>
    <h3 :class="['font-semibold text-gray-900 dark:text-gray-100 mb-1.5', compact ? 'text-sm' : 'text-sm sm:text-base']">
      {{ title }}
    </h3>
    <p v-if="description" :class="['text-gray-500 dark:text-gray-400 px-4', compact ? 'text-xs' : 'text-xs sm:text-sm', descriptionClass]">
      {{ description }}
    </p>
    <div v-if="$slots.default" :class="compact ? 'mt-3' : 'mt-4'">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    icon: any
    title: string
    description?: string
    compact?: boolean
    iconBgClass?: string
    descriptionClass?: string
  }>(),
  {
    iconBgClass: 'bg-gray-100 dark:bg-gray-700/80',
    descriptionClass: '',
  }
)
</script>
