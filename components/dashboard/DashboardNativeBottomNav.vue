<template>
  <nav
    class="dashboard-native-bottom-nav pointer-events-none fixed inset-x-0 bottom-0 z-[60]"
    aria-label="Main navigation"
  >
    <div :class="barClass" role="tablist">
      <div class="flex h-[3.25rem] items-stretch justify-around px-1.5">
        <NuxtLink
          v-for="item in primaryItems"
          :key="item.href"
          :to="item.href"
          role="tab"
          :aria-selected="isActive(item.href)"
          :class="[tabClass, isActive(item.href) ? tabActiveClass : tabInactiveClass]"
          @click="moreOpen = false"
        >
          <span v-if="isActive(item.href)" :class="tabIndicatorClass" aria-hidden="true" />
          <component
            :is="isActive(item.href) ? item.iconSolid : item.icon"
            class="h-[1.375rem] w-[1.375rem] shrink-0"
            :stroke-width="isActive(item.href) ? undefined : 1.75"
          />
          <span
            class="relative max-w-full truncate text-xs font-medium leading-none tracking-tight"
          >
            <span :class="isActive(item.href) ? 'font-semibold' : ''">
              {{ shortLabel(item.name) }}
            </span>
            <span
              v-if="showNativeComingSoon && item.name === 'Payment links'"
              class="absolute -right-1 -top-1 h-1.5 w-1.5 rounded-full bg-amber-500 ring-2 ring-white dark:ring-gray-950"
              aria-label="Coming soon"
            />
          </span>
        </NuxtLink>

        <button
          type="button"
          role="tab"
          :aria-selected="moreOpen"
          :aria-expanded="moreOpen"
          :class="[tabClass, moreOpen || moreHasActive ? tabActiveClass : tabInactiveClass]"
          @click="moreOpen = !moreOpen"
        >
          <span v-if="moreOpen || moreHasActive" :class="tabIndicatorClass" aria-hidden="true" />
          <component
            :is="moreOpen || moreHasActive ? Squares2X2IconSolid : Squares2X2Icon"
            class="h-[1.375rem] w-[1.375rem] shrink-0"
            :stroke-width="moreOpen || moreHasActive ? undefined : 1.75"
          />
          <span
            class="text-xs font-medium leading-none tracking-tight"
            :class="moreOpen || moreHasActive ? 'font-semibold' : ''"
          >
            More
          </span>
        </button>
      </div>
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
          :class="sheetBackdropClass"
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
          :class="sheetClass"
          :style="{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }"
          role="dialog"
          aria-label="More navigation"
        >
          <div :class="sheetHeaderClass">
            <div :class="sheetHandleClass" aria-hidden="true" />
            <p :class="sheetEyebrowClass">Menu</p>
            <p :class="sheetTitleClass">More</p>
          </div>

          <ul :class="sheetListClass">
            <li v-for="item in moreItems" :key="item.href">
              <NuxtLink
                :to="item.href"
                :class="[
                  sheetRowClass,
                  isActive(item.href) ? sheetRowActiveClass : sheetRowInactiveClass,
                ]"
                @click="moreOpen = false"
              >
                <span
                  :class="[sheetIconWrapClass, isActive(item.href) ? sheetIconWrapActiveClass : '']"
                >
                  <component
                    :is="isActive(item.href) ? item.iconSolid : item.icon"
                    class="h-[1.125rem] w-[1.125rem]"
                    :stroke-width="isActive(item.href) ? undefined : 1.75"
                  />
                </span>
                <span class="min-w-0 flex-1 text-sm font-medium leading-snug">{{ item.name }}</span>
                <span
                  v-if="showNativeComingSoon && item.name === 'Payment links'"
                  class="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
                >
                  Soon
                </span>
              </NuxtLink>
            </li>
            <li
              v-if="moreItems.length === 0"
              class="px-3 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
            >
              Main tabs cover everything here.
            </li>
          </ul>

          <div :class="sheetFooterClass">
            <button
              type="button"
              :class="[sheetRowClass, 'w-full text-red-600 dark:text-red-400']"
              @click="onSignOut"
            >
              <span
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50/90 text-red-600 dark:bg-red-500/10 dark:text-red-400"
              >
                <ArrowRightOnRectangleIcon class="h-[1.125rem] w-[1.125rem]" stroke-width="1.75" />
              </span>
              <span class="text-sm font-medium">Sign out</span>
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
import { Squares2X2Icon, ArrowRightOnRectangleIcon } from '@heroicons/vue/24/outline'
import { Squares2X2Icon as Squares2X2IconSolid } from '@heroicons/vue/24/solid'
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

const {
  barClass,
  tabClass,
  tabInactiveClass,
  tabActiveClass,
  tabIndicatorClass,
  sheetBackdropClass,
  sheetClass,
  sheetHeaderClass,
  sheetHandleClass,
  sheetEyebrowClass,
  sheetTitleClass,
  sheetListClass,
  sheetFooterClass,
  sheetRowClass,
  sheetRowActiveClass,
  sheetRowInactiveClass,
  sheetIconWrapClass,
  sheetIconWrapActiveClass,
} = useDashboardNativeNavChrome()

const { showNativeComingSoon } = usePaymentLinksLaunch()

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
