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
          aria-label="More destinations"
        >
          <NuxtLink
            v-for="item in moreItems"
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

        <nav v-else key="bar" class="s-bottomnav__bar" aria-label="Primary">
          <NuxtLink
            v-for="item in items"
            :key="item.name"
            :to="item.href"
            class="s-bottomnav__item"
            :class="{ 's-bottomnav__item--active': isActive(item) }"
            :aria-current="isActive(item) ? 'page' : undefined"
            :aria-label="item.label"
          >
            <component
              :is="DASHBOARD_NAV_ICONS[item.iconKey]"
              :size="22"
              :stroke-width="isActive(item) ? 2 : 1.75"
              aria-hidden="true"
            />
          </NuxtLink>
        </nav>
      </Transition>

      <button
        type="button"
        class="s-bottomnav__toggle"
        :class="{ 's-bottomnav__toggle--dot': !expanded && moreActive }"
        :aria-label="expanded ? 'Close more destinations' : 'More destinations'"
        :aria-expanded="expanded"
        aria-controls="shell-bottomnav-more"
        @click="toggle"
      >
        <X v-if="expanded" :size="22" :stroke-width="2" aria-hidden="true" />
        <Plus v-else :size="22" :stroke-width="2" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Plus, X } from '@lucide/vue'
import { useHaptics } from '~/composables/useHaptics'
import { DASHBOARD_NAV_ICONS } from '~/utils/dashboard-nav-icons'
import type { ShellNavItem } from '~/utils/shell-nav'

/**
 * Phone tab bar: an icon-only glass capsule for the main destinations plus a round button
 * that expands into a grid of every other destination.
 */
const props = defineProps<{
  items: ShellNavItem[]
  moreItems: ShellNavItem[]
  isActive: (item: ShellNavItem) => boolean
}>()

const haptics = useHaptics()
const route = useRoute()
const expanded = ref(false)

const moreActive = computed(() => !props.items.some((item) => props.isActive(item)))

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
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>
