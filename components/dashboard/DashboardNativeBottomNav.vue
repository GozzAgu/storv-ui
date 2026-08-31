<template>
  <nav
    class="dashboard-native-bottom-nav pointer-events-none fixed inset-x-0 bottom-0 z-[60]"
    aria-label="Main navigation"
  >
    <div :class="barClass" role="tablist">
      <div :class="tabStripClass">
        <NuxtLink
          v-for="item in primaryItems"
          :key="item.href"
          :to="item.href"
          :prefetch="false"
          role="tab"
          :aria-selected="isActive(item.href)"
          :class="[tabClass, tabStateClass(isActive(item.href))]"
          :aria-label="shortLabel(item.name)"
          @click="onPrimaryTabClick"
        >
          <span class="native-tabbar__icon-wrap">
            <DashboardNavIcon
              :name="item.iconKey"
              :active="isActive(item.href)"
              size="md"
            />
          </span>
          <span class="native-tabbar__label">{{ shortLabel(item.name) }}</span>
        </NuxtLink>

        <button
          type="button"
          role="tab"
          :aria-selected="moreOpen || moreHasActive"
          :aria-expanded="moreOpen"
          :class="[tabClass, tabStateClass(moreOpen || moreHasActive)]"
          aria-label="More"
          @click="onMoreTabClick"
        >
          <span class="native-tabbar__icon-wrap">
            <DashboardNavIcon
              name="more"
              :active="moreOpen || moreHasActive"
              size="md"
            />
          </span>
          <span class="native-tabbar__label">More</span>
        </button>
      </div>
    </div>

    <IosDrawer
      v-model="moreOpen"
      title="More"
      variant="menu"
      footer-variant="menu"
      mount="body"
      :show-close="false"
      body-padding="p-0"
      aria-label="More navigation"
      backdrop-label="Close menu"
    >
      <div :class="sheetListClass">
        <section
          v-for="group in moreGroups"
          :key="group.id"
          class="native-more-sheet__section"
        >
          <p :class="sheetSectionLabelClass">{{ group.label }}</p>
          <ul class="native-bottom-nav__sheet-list px-2 pb-1">
            <li v-for="item in group.items" :key="item.href">
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
                <span :class="['min-w-0 flex-1', sheetRowLabelClass]">{{ item.name }}</span>
                <span
                  v-if="showNativeComingSoon && item.name === 'Payment links'"
                  :class="sheetBadgeClass"
                >
                  Soon
                </span>
              </NuxtLink>
            </li>
          </ul>
        </section>

        <p
          v-if="moreGroups.length === 0"
          :class="[sheetRowLabelClass, 'px-3 py-8 text-center ios-type-secondary']"
        >
          Main tabs cover everything here.
        </p>
      </div>

      <template #footer>
        <Button
          type="button"
          variant="outline"
          size="sm"
          extra-class="ios-drawer-sign-out"
          @click="onSignOut"
        >
          <DashboardNavIcon name="sign-out" size="sm" />
          Sign out
        </Button>
      </template>
    </IosDrawer>
  </nav>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import DashboardNavIcon from '~/components/dashboard/DashboardNavIcon.vue'
import IosDrawer from '~/components/ios/IosDrawer.vue'
import Button from '~/components/ui/Button.vue'
import {
  isDashboardNavActive,
  nativeNavShortLabel,
  type DashboardNavItem,
} from '~/utils/dashboard-native-nav'
import { groupNativeMoreNavItems } from '~/utils/dashboard-native-more-groups'
import { useDashboardNativeNavChrome } from '~/composables/useDashboardNativeNavChrome'
import { usePaymentLinksLaunch } from '~/composables/usePaymentLinksLaunch'
import { useIosHaptics } from '~/composables/useIosHaptics'

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
  sheetSectionLabelClass,
  sheetRowLabelClass,
  sheetBadgeClass,
} = useDashboardNativeNavChrome()

const { impact } = useIosHaptics()
const { showNativeComingSoon } = usePaymentLinksLaunch()

const route = useRoute()
const moreOpen = ref(false)

const moreGroups = computed(() => groupNativeMoreNavItems(props.moreItems))

const visibleHrefs = computed(() =>
  [...props.primaryItems, ...props.moreItems].map((item) => item.href)
)

function isActive(href: string) {
  return isDashboardNavActive(route.path, href, visibleHrefs.value)
}

const moreHasActive = computed(() => props.moreItems.some((item) => isActive(item.href)))

function tabStateClass(active: boolean) {
  return active ? tabActiveClass : tabInactiveClass
}

function onPrimaryTabClick() {
  moreOpen.value = false
  void impact('light')
}

function onMoreTabClick() {
  moreOpen.value = !moreOpen.value
  void impact('light')
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
</script>
