<template>
  <div class="s-bottomnav" :class="{ 's-bottomnav--expanded': expanded }">
    <div
      v-if="expanded"
      class="s-bottomnav__backdrop"
      aria-hidden="true"
      @click="expanded = false"
    />

    <div class="s-bottomnav__dock">
      <Transition name="s-bottomnav-swap" mode="out-in">
        <div
          v-if="expanded"
          id="shell-bottomnav-more"
          key="more"
          class="s-bottomnav__panel"
          role="group"
          aria-labelledby="shell-bottomnav-more-title"
        >
          <p id="shell-bottomnav-more-title" class="s-bottomnav__panel-title">More</p>
          <section
            v-for="section in moreSections"
            :key="section.id"
            class="s-bottomnav__section"
            :aria-labelledby="section.label ? `shell-bottomnav-more-${section.id}` : undefined"
          >
            <h2
              v-if="section.label"
              :id="`shell-bottomnav-more-${section.id}`"
              class="s-bottomnav__section-label"
            >
              {{ section.label }}
            </h2>
            <div class="s-bottomnav__grid">
              <NuxtLink
                v-for="item in section.items"
                :key="item.name"
                :to="item.href"
                class="s-bottomnav__tile"
                :class="{ 's-bottomnav__tile--active': isActive(item) }"
                :aria-current="isActive(item) ? 'page' : undefined"
                @click="expanded = false"
              >
                <span class="s-bottomnav__tile-icon">
                  <component
                    :is="DASHBOARD_NAV_ICONS[item.iconKey]"
                    :size="22"
                    :stroke-width="1.75"
                    aria-hidden="true"
                  />
                </span>
                <span class="s-bottomnav__tile-label">{{ item.label }}</span>
              </NuxtLink>
            </div>
          </section>
        </div>

        <nav
          v-else
          key="bar"
          class="s-bottomnav__bar"
          aria-label="Primary"
          :style="{
            '--s-bottomnav-count': String(items.length),
            '--s-bottomnav-index': String(lensIndex),
          }"
        >
          <span
            class="s-bottomnav__lens"
            :class="{ 's-bottomnav__lens--hidden': shownIndex < 0 }"
            aria-hidden="true"
          />
          <NuxtLink
            v-for="(item, index) in items"
            :key="item.name"
            :to="item.href"
            class="s-bottomnav__item"
            :class="{ 's-bottomnav__item--active': shownIndex === index }"
            :aria-current="isActive(item) ? 'page' : undefined"
            @click="onTabClick($event, index)"
          >
            <StorvvMark v-if="item.iconKey === 'dashboard'" :size="22" />
            <component
              :is="DASHBOARD_NAV_ICONS[item.iconKey]"
              v-else
              :size="22"
              :stroke-width="1.85"
              aria-hidden="true"
            />
            <span class="s-bottomnav__label">{{ item.label }}</span>
          </NuxtLink>
        </nav>
      </Transition>

      <button
        type="button"
        class="s-bottomnav__toggle"
        :class="{
          's-bottomnav__toggle--open': expanded,
          's-bottomnav__toggle--dot': !expanded && moreActive,
        }"
        :aria-label="expanded ? 'Close more destinations' : 'More destinations'"
        :aria-expanded="expanded"
        aria-controls="shell-bottomnav-more"
        @click="toggle"
      >
        <Plus class="s-bottomnav__toggle-icon" :size="22" :stroke-width="2" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Plus } from '@lucide/vue'
import { useHaptics } from '~/composables/useHaptics'
import { DASHBOARD_NAV_ICONS } from '~/utils/dashboard-nav-icons'
import StorvvMark from '~/components/shell/StorvvMark.vue'
import type { ShellNavItem, ShellNavSection } from '~/utils/shell-nav'

/**
 * Phone tab bar: a glass capsule for the main destinations (a lens slides behind the current one)
 * plus a round button
 * that expands into a grid of every other destination.
 */
const props = defineProps<{
  items: ShellNavItem[]
  moreSections: ShellNavSection[]
  isActive: (item: ShellNavItem) => boolean
}>()

const haptics = useHaptics()
const route = useRoute()
const router = useRouter()
const expanded = ref(false)

const activeIndex = computed(() => props.items.findIndex((item) => props.isActive(item)))
const moreActive = computed(() => activeIndex.value < 0)

/* The lens moves on tap rather than when the next page has loaded, so it never lags the finger */
const pendingIndex = ref<number | null>(null)
const shownIndex = computed(() => pendingIndex.value ?? activeIndex.value)
/* Hidden on "More" pages, it stays where it was so it fades back in place instead of sliding from the left */
const lensIndex = ref(Math.max(activeIndex.value, 0))
watch(shownIndex, (index) => {
  if (index >= 0) lensIndex.value = index
})

function onTabClick(event: MouseEvent, index: number) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  pendingIndex.value = index
}

const removeAfterEach = router.afterEach(() => {
  pendingIndex.value = null
})

function toggle() {
  expanded.value = !expanded.value
  void haptics.selection()
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && expanded.value) expanded.value = false
}

watch(
  () => route.fullPath,
  () => {
    expanded.value = false
  }
)

onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  removeAfterEach()
})
</script>
