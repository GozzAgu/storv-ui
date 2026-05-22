<template>
  <nav
    class="dashboard-native-bottom-nav pointer-events-none fixed inset-x-0 bottom-0 z-[60]"
    aria-label="Main navigation"
  >
    <div
      class="pointer-events-auto mx-3 mb-[max(0.5rem,env(safe-area-inset-bottom))] flex items-stretch justify-around gap-0.5 rounded-[1.35rem] border border-white/60 bg-white/75 px-1 py-1 shadow-[0_-4px_32px_rgb(15_23_42/0.08),0_8px_24px_rgb(15_23_42/0.06)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#0c0e14]/82 dark:shadow-[0_-8px_40px_rgb(0_0_0/0.45)]"
      role="tablist"
    >
      <NuxtLink
        v-for="item in primaryItems"
        :key="item.href"
        :to="item.href"
        role="tab"
        :aria-selected="isActive(item.href)"
        class="native-bottom-nav__tab group relative flex min-w-0 flex-1 flex-col items-center justify-center rounded-[1.1rem] px-1 py-2 transition-[transform,color] duration-200 active:scale-[0.94] motion-reduce:active:scale-100"
        :class="isActive(item.href) ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'"
        @click="moreOpen = false"
      >
        <span
          v-if="isActive(item.href)"
          class="absolute inset-x-1.5 inset-y-0.5 rounded-[0.95rem] bg-primary-500/12 ring-1 ring-inset ring-primary-500/20 dark:bg-primary-400/14 dark:ring-primary-400/25"
          aria-hidden="true"
        />
        <component
          :is="isActive(item.href) ? item.iconSolid : item.icon"
          class="relative z-[1] h-[1.35rem] w-[1.35rem] shrink-0 transition-transform duration-200 group-active:scale-95"
          :stroke-width="isActive(item.href) ? undefined : 1.75"
        />
        <span
          class="relative z-[1] mt-1 max-w-full truncate text-[10px] font-semibold leading-none tracking-tight"
          :class="isActive(item.href) ? 'text-primary-700 dark:text-primary-300' : ''"
        >
          {{ shortLabel(item.name) }}
        </span>
      </NuxtLink>

      <button
        type="button"
        role="tab"
        :aria-selected="moreOpen"
        :aria-expanded="moreOpen"
        class="native-bottom-nav__tab group relative flex min-w-0 flex-1 flex-col items-center justify-center rounded-[1.1rem] px-1 py-2 transition-[transform,color] duration-200 active:scale-[0.94] motion-reduce:active:scale-100"
        :class="moreOpen || moreHasActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'"
        @click="moreOpen = !moreOpen"
      >
        <span
          v-if="moreOpen || moreHasActive"
          class="absolute inset-x-1.5 inset-y-0.5 rounded-[0.95rem] bg-primary-500/12 ring-1 ring-inset ring-primary-500/20 dark:bg-primary-400/14 dark:ring-primary-400/25"
          aria-hidden="true"
        />
        <Squares2X2Icon
          class="relative z-[1] h-[1.35rem] w-[1.35rem] shrink-0"
          :stroke-width="moreOpen || moreHasActive ? undefined : 1.75"
        />
        <span
          class="relative z-[1] mt-1 text-[10px] font-semibold leading-none tracking-tight"
          :class="moreOpen || moreHasActive ? 'text-primary-700 dark:text-primary-300' : ''"
        >
          More
        </span>
      </button>
    </div>

    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <button
          v-if="moreOpen"
          type="button"
          class="native-bottom-nav__backdrop fixed inset-0 z-[58] bg-slate-950/40 backdrop-blur-[2px] dark:bg-black/55"
          aria-label="Close menu"
          @click="moreOpen = false"
        />
      </Transition>

      <Transition
        enter-active-class="transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
        enter-from-class="opacity-0 translate-y-full"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.4,0,1,1)]"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-full"
      >
        <div
          v-if="moreOpen"
          class="native-bottom-nav__sheet fixed inset-x-0 bottom-0 z-[59] max-h-[min(72dvh,520px)] overflow-hidden rounded-t-[1.75rem] border border-white/50 bg-white/95 shadow-[0_-12px_48px_rgb(15_23_42/0.14)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#11131a]/96 dark:shadow-[0_-16px_56px_rgb(0_0_0/0.5)]"
          :style="{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }"
          role="dialog"
          aria-label="More navigation"
        >
          <div class="mx-auto mt-2.5 h-1 w-10 rounded-full bg-gray-300/90 dark:bg-white/20" aria-hidden="true" />
          <div class="border-b border-gray-100/90 px-5 pb-3 pt-4 dark:border-white/10">
            <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500">
              Workspace
            </p>
            <p class="mt-0.5 text-base font-semibold tracking-tight text-gray-900 dark:text-gray-50">
              More options
            </p>
          </div>

          <ul class="native-bottom-nav__sheet-list max-h-[min(50dvh,380px)] overflow-y-auto overscroll-contain px-3 py-2">
            <li v-for="item in moreItems" :key="item.href">
              <NuxtLink
                :to="item.href"
                class="flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors active:bg-gray-100/90 dark:active:bg-white/[0.06]"
                :class="isActive(item.href) ? 'bg-primary-500/10 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300' : 'text-gray-800 dark:text-gray-200'"
                @click="moreOpen = false"
              >
                <span
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset"
                  :class="isActive(item.href) ? 'bg-primary-500/15 ring-primary-500/25 text-primary-600 dark:text-primary-400' : 'bg-gray-100/90 ring-gray-200/60 text-gray-600 dark:bg-white/[0.06] dark:ring-white/10 dark:text-gray-300'"
                >
                  <component
                    :is="isActive(item.href) ? item.iconSolid : item.icon"
                    class="h-5 w-5"
                    :stroke-width="isActive(item.href) ? undefined : 1.75"
                  />
                </span>
                <span class="min-w-0 flex-1 text-sm font-medium leading-snug">{{ item.name }}</span>
                <ChevronRightIcon class="h-4 w-4 shrink-0 opacity-40" stroke-width="2" />
              </NuxtLink>
            </li>
            <li v-if="moreItems.length === 0" class="px-3 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
              You’re all set — main tabs cover everything.
            </li>
          </ul>

          <div class="border-t border-gray-100/90 px-3 pt-2 dark:border-white/10">
            <button
              type="button"
              class="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium text-red-600 transition-colors active:bg-red-50/90 dark:text-red-400 dark:active:bg-red-500/10"
              @click="onSignOut"
            >
              <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50/90 text-red-600 ring-1 ring-inset ring-red-200/70 dark:bg-red-500/12 dark:text-red-400 dark:ring-red-500/25">
                <ArrowRightOnRectangleIcon class="h-5 w-5" stroke-width="1.75" />
              </span>
              Sign out
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </nav>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  Squares2X2Icon,
  ChevronRightIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/vue/24/outline'
import {
  isDashboardNavActive,
  nativeNavShortLabel,
  type DashboardNavItem,
} from '~/utils/dashboard-native-nav'

const props = defineProps<{
  primaryItems: DashboardNavItem[]
  moreItems: DashboardNavItem[]
}>()

const emit = defineEmits<{
  signOut: []
}>()

const route = useRoute()
const moreOpen = ref(false)

const visibleHrefs = computed(() =>
  [...props.primaryItems, ...props.moreItems].map((item) => item.href)
)

function isActive(href: string) {
  return isDashboardNavActive(route.path, href, visibleHrefs.value)
}

const moreHasActive = computed(() => props.moreItems.some((item) => isActive(item.href)))

function shortLabel(name: string) {
  return nativeNavShortLabel(name)
}

function onSignOut() {
  moreOpen.value = false
  emit('signOut')
}

watch(
  () => route.path,
  () => {
    moreOpen.value = false
  }
)
</script>
