<template>
  <div
    :class="[
      authEntranceClass(entranceDelay),
      'auth-page-header mb-8 text-center lg:mb-9 lg:text-left',
    ]"
  >
    <a
      v-if="showMobileLogo"
      href="https://www.storvv.com"
      class="mb-5 inline-block rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/50 focus-visible:ring-offset-2 lg:hidden dark:focus-visible:ring-offset-dashboard-canvas"
    >
      <img
        :src="logoSource"
        alt="Storvv"
        class="mx-auto h-7 w-auto max-w-[120px] shrink-0 object-contain sm:h-8"
      />
    </a>
    <p
      v-if="eyebrow"
      class="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-600 dark:text-primary-400"
    >
      {{ eyebrow }}
    </p>
    <h1
      class="mt-1.5 text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-50 sm:text-2xl"
    >
      {{ title }}
    </h1>
    <p v-if="$slots.default" class="mt-2.5 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
      <slot />
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from '~/composables/useTheme'
import { authEntranceClass } from '~/utils/auth-entrance'

withDefaults(
  defineProps<{
    eyebrow?: string
    title: string
    showMobileLogo?: boolean
    entranceDelay?: number
  }>(),
  {
    showMobileLogo: true,
    entranceDelay: 40,
  }
)

const { actualTheme } = useTheme()
const logoSource = computed(() =>
  actualTheme.value === 'dark' ? '/storvv logo.png' : '/storvv logo 2.png'
)
</script>
