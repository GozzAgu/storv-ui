<template>
  <label
    v-bind="delegatedAttrs"
    :class="[ 'relative inline-flex items-center cursor-pointer group', disabled && 'opacity-50 cursor-not-allowed', wrapperClass ]"
  >
    <input
      type="checkbox"
      :checked="modelValue"
      :disabled="disabled"
      @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
      class="sr-only peer"
    />
    <div
      :class="[ 'relative flex items-center justify-center rounded-sm border-2 transition-all duration-200 ease-out', 'transform', size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5', modelValue ? 'bg-gradient-to-br from-primary-400 to-primary-500 border-primary-400 scale-100' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 group-hover:border-primary-400 dark:group-hover:border-primary-500 scale-100', !disabled && 'group-hover:scale-105 active:scale-95', disabled && 'cursor-not-allowed' ]"
    >
      <!-- Checkmark -->
      <transition
        enter-active-class="transition-all duration-200 ease-out"
        enter-from-class="opacity-0 scale-75 rotate-12"
        enter-to-class="opacity-100 scale-100 rotate-0"
        leave-active-class="transition-all duration-150 ease-in"
        leave-from-class="opacity-100 scale-100 rotate-0"
        leave-to-class="opacity-0 scale-75 -rotate-12"
      >
        <svg
          v-if="modelValue"
          class="text-white"
          :class="[ size === 'sm' ? 'w-2.5 h-2.5' : size === 'lg' ? 'w-4 h-4' : 'w-3 h-3' ]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="3"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </transition>
    </div>
    <!-- Animated background glow on check -->
    <transition
      enter-active-class="transition-opacity duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="absolute inset-0 rounded-sm bg-primary-400/20 pointer-events-none animate-ripple"
        :class="[ size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5' ]"
      ></div>
    </transition>
    <!-- Label text -->
    <span
      v-if="$slots.default || label"
      :class="[ 'ml-3 text-sm font-medium transition-colors duration-200', modelValue ? 'text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300', labelClass ]"
    >
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>

<script setup lang="ts">
import { computed, useAttrs } from 'vue'

defineOptions({ inheritAttrs: false })

const attrs = useAttrs()

const delegatedAttrs = computed(() => {
  const raw = { ...(attrs as Record<string, unknown>) }
  delete raw.title
  return raw
})

interface Props {
  modelValue: boolean
  label?: string
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  wrapperClass?: string
  labelClass?: string
}

withDefaults(defineProps<Props>(), {
  modelValue: false,
  disabled: false,
  size: 'md',
})

defineEmits<{
  'update:modelValue': [value: boolean]
}>()
</script>

<style scoped>
@keyframes ripple {
  0% {
    transform: scale(1);
    opacity: 0.4;
  }
  100% {
    transform: scale(2.5);
    opacity: 0;
  }
}

.animate-ripple {
  animation: ripple 0.6s ease-out;
}
</style>

