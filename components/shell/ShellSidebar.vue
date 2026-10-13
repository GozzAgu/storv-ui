<template>
  <aside
    id="shell-sidebar"
    ref="rootEl"
    class="s-sidebar"
    :class="{ 's-sidebar--collapsed': collapsed, 's-sidebar--lens': lensReady }"
    aria-label="Main navigation"
    @click="onNavClick"
    @transitionend.self="updateLens"
  >
    <div class="s-sidebar__head">
      <NuxtLink :to="homeTo" class="s-sidebar__brand" aria-label="Storvv home">
        <img v-if="collapsed" src="/brand/storvv-symbol.png" alt="" class="s-sidebar__mark" />
        <img v-else :src="logoSrc" alt="" class="s-sidebar__logo" />
      </NuxtLink>
    </div>

    <div v-if="$slots.branch" class="s-sidebar__branch">
      <slot name="branch" />
    </div>

    <nav
      ref="navEl"
      class="s-sidebar__nav"
      :class="{ 's-sidebar__nav--busy': busy }"
      aria-label="Sections"
    >
      <span
        class="s-sidebar__lens"
        :class="lensClass"
        :style="lensStyle(navLens)"
        aria-hidden="true"
      />
      <div v-for="section in sections" :key="section.id" class="s-sidebar__section">
        <p v-if="section.label && !collapsed" class="s-sidebar__section-label">
          {{ section.label }}
        </p>
        <div v-else-if="section.label" class="s-sidebar__divider" role="separator" />
        <ul class="s-sidebar__list" role="list">
          <li v-for="item in section.items" :key="item.name">
            <ShellSidebarItem
              :class="{ 's-nav-item--lensed': lensReady && item.name === targetName }"
              :item="item"
              :active="isActive(item)"
              :collapsed="collapsed"
              @tip="showTip"
              @untip="hideTip"
            />
          </li>
        </ul>
      </div>
    </nav>

    <div class="s-sidebar__foot">
      <div ref="footEl" class="s-sidebar__foot-nav">
        <span
          class="s-sidebar__lens"
          :class="lensClass"
          :style="lensStyle(footLens)"
          aria-hidden="true"
        />
        <ul class="s-sidebar__list" role="list">
          <li v-for="item in footerItems" :key="item.name">
            <ShellSidebarItem
              :class="{ 's-nav-item--lensed': lensReady && item.name === targetName }"
              :item="item"
              :active="isActive(item)"
              :collapsed="collapsed"
              @tip="showTip"
              @untip="hideTip"
            />
          </li>
        </ul>
      </div>
      <div class="s-sidebar__meta">
        <SIconButton
          class="s-sidebar__collapse"
          :label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
          :aria-expanded="!collapsed"
          aria-controls="shell-sidebar"
          @click="emit('toggle-collapse')"
          @mouseenter="collapsed && showTip($event, 'Expand sidebar')"
          @mouseleave="hideTip"
        >
          <PanelLeftOpen v-if="collapsed" :size="20" :stroke-width="1.75" aria-hidden="true" />
          <PanelLeftClose v-else :size="20" :stroke-width="1.75" aria-hidden="true" />
        </SIconButton>
        <span v-if="!collapsed" class="s-sidebar__version">v{{ version }}</span>
      </div>
    </div>

    <div v-if="tip" class="s-tooltip" role="tooltip" :style="{ top: `${tip.top}px` }">
      {{ tip.text }}
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { PanelLeftClose, PanelLeftOpen } from '@lucide/vue'
import ShellSidebarItem from '~/components/shell/ShellSidebarItem.vue'
import SIconButton from '~/components/s/SIconButton.vue'
import type { ShellNavItem, ShellNavSection } from '~/utils/shell-nav'

const props = defineProps<{
  sections: ShellNavSection[]
  footerItems: ShellNavItem[]
  isActive: (item: ShellNavItem) => boolean
  collapsed: boolean
  busy?: boolean
  homeTo: string
  logoSrc: string
  version: string
}>()

const emit = defineEmits<{
  'toggle-collapse': []
}>()

const tip = ref<{ text: string; top: number } | null>(null)

function showTip(event: Event, text: string) {
  if (!props.collapsed) return
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  tip.value = { text, top: Math.round(rect.top + rect.height / 2) }
}

function hideTip() {
  tip.value = null
}

watch(() => props.collapsed, hideTip)

/*
 * Selection lens: one highlight per list that glides to the selected item. It moves on click rather
 * than once the next page has loaded, and items keep their own highlight until it has measured.
 * Only the vertical position is measured: width follows the list in CSS, so collapsing the sidebar
 * (an animated width) never leaves the lens measured mid-animation.
 */
type Lens = { y: number; height: number; visible: boolean }

const router = useRouter()
const rootEl = ref<HTMLElement | null>(null)
const navEl = ref<HTMLElement | null>(null)
const footEl = ref<HTMLElement | null>(null)
const navLens = ref<Lens | null>(null)
const footLens = ref<Lens | null>(null)
const lensReady = ref(false)
const lensAnimated = ref(false)
const pendingName = ref<string | null>(null)

const activeName = computed(() => {
  const items = [...props.sections.flatMap((section) => section.items), ...props.footerItems]
  return items.find((item) => props.isActive(item))?.name ?? null
})
const targetName = computed(() => pendingName.value ?? activeName.value)
const lensClass = computed(() => ({ 's-sidebar__lens--animated': lensAnimated.value }))

function lensStyle(lens: Lens | null) {
  if (!lens) return { opacity: '0' }
  return {
    height: `${lens.height}px`,
    transform: `translate3d(0, ${lens.y}px, 0)`,
    opacity: lens.visible ? '1' : '0',
  }
}

function measure(container: HTMLElement | null, current: Lens | null): Lens | null {
  if (!container) return current
  const name = targetName.value
  const link = name
    ? Array.from(container.querySelectorAll<HTMLElement>('.s-nav-item')).find(
        (el) => el.dataset.navName === name
      )
    : undefined
  if (!link) return current ? { ...current, visible: false } : null
  const box = container.getBoundingClientRect()
  const rect = link.getBoundingClientRect()
  return {
    y: rect.top - box.top + container.scrollTop,
    height: rect.height,
    visible: true,
  }
}

function updateLens() {
  navLens.value = measure(navEl.value, navLens.value)
  footLens.value = measure(footEl.value, footLens.value)
}

function onNavClick(event: MouseEvent) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  const link = (event.target as HTMLElement | null)?.closest<HTMLElement>('.s-nav-item')
  if (link?.dataset.navName) pendingName.value = link.dataset.navName
}

watch([targetName, () => props.collapsed, () => props.sections, () => props.footerItems], () => {
  void nextTick(updateLens)
})

let resizeObserver: ResizeObserver | null = null
const removeAfterEach = router.afterEach(() => {
  pendingName.value = null
})

onMounted(async () => {
  await nextTick()
  updateLens()
  lensReady.value = true
  /* First placement is instant; only later moves glide */
  window.setTimeout(() => {
    lensAnimated.value = true
  }, 50)
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(updateLens)
    if (rootEl.value) resizeObserver.observe(rootEl.value)
    if (navEl.value) resizeObserver.observe(navEl.value)
    if (footEl.value) resizeObserver.observe(footEl.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  removeAfterEach()
})
</script>
