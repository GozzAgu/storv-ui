<template>
  <div class="auth-shell-root flex min-h-screen flex-col bg-[#f4f6f9] dark:bg-slate-950 lg:flex-row">
    <!-- Mobile: short brand strip -->
    <div
      class="relative overflow-hidden border-b border-white/10 bg-gradient-to-r from-primary-900 via-primary-900 to-[#0a1733] px-4 py-3.5 text-center lg:hidden"
    >
      <div
        class="pointer-events-none absolute -right-8 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full bg-primary-400/20 blur-2xl"
        aria-hidden="true"
      />
      <p class="relative text-sm font-medium text-white/95">{{ mobileLine }}</p>
    </div>

    <!-- Desktop: brand column with depth + soft motion -->
    <div
      class="relative hidden w-full max-w-lg flex-none flex-col justify-between overflow-hidden bg-gradient-to-br from-primary-900 via-primary-900 to-[#050d22] px-10 py-12 text-white lg:flex xl:max-w-xl xl:px-14"
    >
      <div
        class="pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        <div
          class="absolute -right-24 -top-28 h-[22rem] w-[22rem] rounded-full bg-primary-500/20 blur-3xl motion-reduce:animate-none animate-auth-glow-drift"
        />
        <div
          class="absolute -bottom-40 -left-28 h-[28rem] w-[28rem] rounded-full bg-blue-600/15 blur-3xl motion-reduce:animate-none animate-auth-glow-drift [animation-delay:-7s]"
        />
        <div
          class="absolute inset-0 opacity-[0.35] bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[length:56px_56px] [mask-image:radial-gradient(ellipse_85%_70%_at_50%_40%,black_20%,transparent_100%)]"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
      </div>

      <div class="relative z-10">
        <a
          href="https://www.storvv.com"
          :class="authEntranceClass() + ' inline-flex rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-primary-900'"
        >
          <img
            src="/storvv logo.png"
            alt="Storvv"
            class="h-10 w-auto max-h-10 max-w-[200px] origin-left object-contain opacity-95 will-change-transform sm:h-11 sm:max-h-11 sm:max-w-[240px] sm:scale-110 lg:scale-125 lg:max-w-[280px]"
          />
        </a>

        <h2
          :class="authEntranceClass(60) + ' mt-10 text-2xl font-semibold leading-tight tracking-tight xl:mt-12 xl:text-[1.65rem] xl:leading-snug'"
        >
          {{ panelTitle }}
        </h2>
        <p
          :class="authEntranceClass(120) + ' mt-3 max-w-sm text-sm leading-relaxed text-white/85'"
        >
          {{ panelDescription }}
        </p>

        <ul class="mt-10 space-y-4">
          <li
            v-for="(item, i) in featureItems"
            :key="i"
            :class="authEntranceClass(180 + i * 70) + ' group flex gap-3.5'"
          >
            <span
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-white/10 transition duration-300 ease-out group-hover:bg-white/16"
            >
              <component :is="item.icon" class="h-5 w-5 text-white/95 transition-transform duration-300 group-hover:scale-105" />
            </span>
            <p class="pt-0.5 text-sm leading-snug text-white/90 transition-colors duration-200 group-hover:text-white">
              {{ item.text }}
            </p>
          </li>
        </ul>
      </div>

      <p
        :class="authEntranceClass(420) + ' relative z-10 text-[11px] font-medium tracking-wide text-white/45'"
      >
        Secure sign-in · Encrypted connection
      </p>
    </div>

    <!-- Form column -->
    <div
      class="relative flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-10 lg:px-12 lg:py-12"
    >
      <div class="auth-shell-theme-toggle absolute right-4 top-4 z-10 sm:right-6 sm:top-6 lg:right-12 lg:top-10">
        <ThemeToggle />
      </div>
      <div
        class="pointer-events-none absolute inset-0 opacity-40 dark:opacity-20"
        aria-hidden="true"
      >
        <div
          class="absolute left-1/2 top-[12%] h-[min(42rem,55vw)] w-[min(42rem,90vw)] -translate-x-1/2 rounded-full bg-primary-200/60 blur-3xl dark:bg-primary-900/30"
        />
      </div>
      <div class="relative z-[1] w-full" :class="contentWidthClass">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, type Component } from 'vue'
import ThemeToggle from '~/components/ui/ThemeToggle.vue'
import { authEntranceClass } from '~/utils/auth-entrance'
import { markCapacitorDocument } from '~/utils/capacitor-env'
import {
  ChartBarSquareIcon,
  CubeIcon,
  ShieldCheckIcon,
} from '@heroicons/vue/24/outline'

interface AuthShellFeature {
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

onMounted(() => {
  markCapacitorDocument()
})
</script>
