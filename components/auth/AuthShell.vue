<template>
  <div class="flex min-h-screen flex-col bg-gray-50 dark:bg-slate-950 lg:flex-row">
    <!-- Mobile: short brand strip -->
    <div
      class="border-b border-white/10 bg-primary-900 px-4 py-3.5 text-center lg:hidden"
    >
      <p class="text-sm font-medium text-white/95">{{ mobileLine }}</p>
    </div>

    <!-- Desktop: solid brand column (flat, no gradients) -->
    <div
      class="relative hidden w-full max-w-lg flex-none flex-col justify-between bg-primary-900 px-10 py-12 text-white lg:flex xl:max-w-xl xl:px-14"
    >
      <div>
        <a
          href="https://www.storvv.com"
          class="inline-flex rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-primary-900"
        >
          <img
            src="/storvv logo.png"
            alt="Storvv"
            class="h-7 w-auto max-w-[140px] object-contain opacity-95 lg:h-9 lg:max-w-[180px] xl:h-10 xl:max-w-[200px]"
          />
        </a>

        <h2
          class="mt-10 text-2xl font-semibold leading-tight tracking-tight xl:mt-12 xl:text-[1.65rem] xl:leading-snug"
        >
          {{ panelTitle }}
        </h2>
        <p class="mt-3 max-w-sm text-sm leading-relaxed text-white/85">
          {{ panelDescription }}
        </p>

        <ul class="mt-10 space-y-4">
          <li
            v-for="(item, i) in featureItems"
            :key="i"
            class="flex gap-3.5"
          >
            <span
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/12 ring-1 ring-white/15"
            >
              <component :is="item.icon" class="h-5 w-5 text-white" />
            </span>
            <p class="pt-0.5 text-sm leading-snug text-white/90">
              {{ item.text }}
            </p>
          </li>
        </ul>
      </div>

      <p class="text-[11px] font-medium tracking-wide text-white/45">
        Secure sign-in · Encrypted connection
      </p>
    </div>

    <!-- Form column -->
    <div
      class="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-10 lg:px-12 lg:py-12"
    >
      <div class="w-full" :class="contentWidthClass">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'
import {
  ChartBarSquareIcon,
  CubeIcon,
  ShieldCheckIcon,
} from '@heroicons/vue/24/outline'

export interface AuthShellFeature {
  icon: Component
  text: string
}

const defaultFeatures: AuthShellFeature[] = [
  {
    icon: CubeIcon,
    text: 'Track inventory and departments without spreadsheet chaos.',
  },
  {
    icon: ChartBarSquareIcon,
    text: 'See receipts, stock levels, and branch activity in one workspace.',
  },
  {
    icon: ShieldCheckIcon,
    text: 'Roles and permissions built for store managers and staff.',
  },
]

const props = withDefaults(
  defineProps<{
    mobileLine: string
    panelTitle: string
    panelDescription: string
    features?: AuthShellFeature[]
    contentWidthClass?: string
  }>(),
  {
    contentWidthClass: 'max-w-[400px]',
  }
)

const featureItems = computed(() =>
  props.features && props.features.length > 0 ? props.features : defaultFeatures
)
</script>
