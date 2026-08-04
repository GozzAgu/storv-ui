<template>
  <nav
    class="dashboard-native-bottom-nav pointer-events-none fixed inset-x-0 bottom-0 z-[60]"
    aria-label="Main navigation"
  >
    <div :class="barClass" role="tablist">
      <div ref="tabStripRef" :class="tabStripClass">
        <span
          class="native-tabbar__indicator"
          :class="{ 'native-tabbar__indicator--visible': indicatorReady }"
          :style="indicatorStyle"
          aria-hidden="true"
        />

        <NuxtLink
          v-for="(item, index) in primaryItems"
          :key="item.href"
          :ref="(el) => setTabRef(el, index)"
          :to="item.href"
          :prefetch="false"
          role="tab"
          :aria-selected="isActive(item.href)"
          :class="[tabClass, tabStateClass(isActive(item.href))]"
          @click="moreOpen = false"
        >
          <DashboardNavIcon
            :name="item.iconKey"
            :active="isActive(item.href)"
            size="md"
          />
          <span class="native-tabbar__label relative">
            {{ shortLabel(item.name) }}
            <span
              v-if="showNativeComingSoon && item.name === 'Payment links'"
              class="absolute -right-1.5 -top-1 h-1.5 w-1.5 rounded-full bg-amber-500 ring-2 ring-white/80 dark:ring-black/40"
              aria-label="Coming soon"
            />
          </span>
        </NuxtLink>

        <button
          :ref="(el) => setTabRef(el, primaryItems.length)"
          type="button"
          role="tab"
          :aria-selected="moreOpen || moreHasActive"
          :aria-expanded="moreOpen"
          :class="[tabClass, tabStateClass(moreOpen || moreHasActive)]"
          @click="moreOpen = !moreOpen"
        >
          <DashboardNavIcon
            name="more"
            :active="moreOpen || moreHasActive"
            size="md"
          />
          <span class="native-tabbar__label">More</span>
        </button>
      </div>
    </div>

    <DashboardNativeSheet
      v-model="moreOpen"
      title="More"
      eyebrow="Menu"
      variant="menu"
      mount="body"
      :show-close="false"
      body-padding="p-0"
      aria-label="More navigation"
      backdrop-label="Close menu"
    >
      <ul :class="sheetListClass">
        <li v-for="item in moreItems" :key="item.href">
          <NuxtLink
            :to="item.href"
            :prefetch="false"
            :class="[
              sheetRowClass,
              isActive(item.href) ? sheetRowActiveClass : sheetRowInactiveClass,
            ]"
            @click="moreOpen = false"
          >
            <span
              :class="[sheetIconWrapClass, isActive(item.href) ? sheetIconWrapActiveClass : '']"
            >
              <DashboardNavIcon
                :name="item.iconKey"
                :active="isActive(item.href)"
                size="sm"
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

      <template #footer>
        <button
          type="button"
          :class="[sheetRowClass, 'w-full text-red-600 dark:text-red-400']"
          @click="onSignOut"
        >
          <span
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50/90 text-red-600 dark:bg-red-500/10 dark:text-red-400"
          >
            <DashboardNavIcon name="sign-out" size="sm" />
          </span>
          <span class="text-sm font-medium">Sign out</span>
        </button>
      </template>
    </DashboardNativeSheet>
  </nav>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import { useRoute } from 'vue-router'
import DashboardNavIcon from '~/components/dashboard/DashboardNavIcon.vue'
import DashboardNativeSheet from '~/components/dashboard/DashboardNativeSheet.vue'
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
  tabStripClass,
  sheetListClass,
  sheetRowClass,
  sheetRowActiveClass,
  sheetRowInactiveClass,
  sheetIconWrapClass,
  sheetIconWrapActiveClass,
} = useDashboardNativeNavChrome()

const { showNativeComingSoon } = usePaymentLinksLaunch()

const route = useRoute()
const moreOpen = ref(false)
const tabStripRef = ref<HTMLElement | null>(null)
const tabRefs = ref<(HTMLElement | null)[]>([])
const indicatorReady = ref(false)
const indicatorStyle = ref({
  transform: 'translate3d(0, 0, 0)',
  width: '0px',
})

const visibleHrefs = computed(() =>
  [...props.primaryItems, ...props.moreItems].map((item) => item.href)
)

function isActive(href: string) {
  return isDashboardNavActive(route.path, href, visibleHrefs.value)
}

const moreHasActive = computed(() => props.moreItems.some((item) => isActive(item.href)))

const activeTabIndex = computed(() => {
  const moreIndex = props.primaryItems.length
  if (moreOpen.value || moreHasActive.value) return moreIndex
  const idx = props.primaryItems.findIndex((item) => isActive(item.href))
  return idx >= 0 ? idx : 0
})

function tabStateClass(active: boolean) {
  return active ? tabActiveClass : tabInactiveClass
}

function setTabRef(el: Element | ComponentPublicInstance | null, index: number) {
  const node = el instanceof HTMLElement ? el : (el as ComponentPublicInstance | null)?.$el
  tabRefs.value[index] = node instanceof HTMLElement ? node : null
}

function updateIndicator() {
  const tab = tabRefs.value[activeTabIndex.value]
  const strip = tabStripRef.value
  if (!tab || !strip) {
    indicatorReady.value = false
    return
  }

  const stripRect = strip.getBoundingClientRect()
  const tabRect = tab.getBoundingClientRect()
  const insetX = 4

  indicatorStyle.value = {
    transform: `translate3d(${tabRect.left - stripRect.left + insetX}px, 0, 0)`,
    width: `${Math.max(0, tabRect.width - insetX * 2)}px`,
  }
  indicatorReady.value = true
}

let resizeObserver: ResizeObserver | undefined

function scheduleIndicatorUpdate() {
  nextTick(() => {
    requestAnimationFrame(updateIndicator)
  })
}

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

watch([activeTabIndex, () => props.primaryItems.length], scheduleIndicatorUpdate)

watch(moreOpen, scheduleIndicatorUpdate)

onMounted(() => {
  scheduleIndicatorUpdate()

  if (typeof ResizeObserver !== 'undefined' && tabStripRef.value) {
    resizeObserver = new ResizeObserver(scheduleIndicatorUpdate)
    resizeObserver.observe(tabStripRef.value)
  }

  window.addEventListener('resize', scheduleIndicatorUpdate, { passive: true })
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  window.removeEventListener('resize', scheduleIndicatorUpdate)
})
</script>
