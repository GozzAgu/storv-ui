<template>
  <aside
    id="shell-sidebar"
    ref="root"
    class="s-sidebar"
    :class="{ 's-sidebar--collapsed': collapsed, 's-sidebar--open': open }"
    aria-label="Main navigation"
  >
    <div class="s-sidebar__head">
      <NuxtLink :to="homeTo" class="s-sidebar__brand" aria-label="Storvv home">
        <img v-if="collapsed" src="/brand/storvv-symbol.png" alt="" class="s-sidebar__mark" />
        <img v-else :src="logoSrc" alt="" class="s-sidebar__logo" />
      </NuxtLink>
      <SIconButton class="s-sidebar__close" label="Close menu" @click="emit('close')">
        <X :size="20" :stroke-width="1.75" aria-hidden="true" />
      </SIconButton>
    </div>

    <div v-if="$slots.branch" class="s-sidebar__branch">
      <slot name="branch" />
    </div>

    <nav class="s-sidebar__nav" :class="{ 's-sidebar__nav--busy': busy }" aria-label="Sections">
      <div v-for="section in sections" :key="section.id" class="s-sidebar__section">
        <p v-if="section.label && !collapsed" class="s-sidebar__section-label">
          {{ section.label }}
        </p>
        <div v-else-if="section.label" class="s-sidebar__divider" role="separator" />
        <ul class="s-sidebar__list" role="list">
          <li v-for="item in section.items" :key="item.name">
            <ShellSidebarItem
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
      <ul class="s-sidebar__list" role="list">
        <li v-for="item in footerItems" :key="item.name">
          <ShellSidebarItem
            :item="item"
            :active="isActive(item)"
            :collapsed="collapsed"
            @tip="showTip"
            @untip="hideTip"
          />
        </li>
      </ul>
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
import { nextTick, ref, watch } from 'vue'
import { PanelLeftClose, PanelLeftOpen, X } from '@lucide/vue'
import ShellSidebarItem from '~/components/shell/ShellSidebarItem.vue'
import SIconButton from '~/components/s/SIconButton.vue'
import type { ShellNavItem, ShellNavSection } from '~/utils/shell-nav'

const props = defineProps<{
  sections: ShellNavSection[]
  footerItems: ShellNavItem[]
  isActive: (item: ShellNavItem) => boolean
  collapsed: boolean
  open: boolean
  busy?: boolean
  homeTo: string
  logoSrc: string
  version: string
}>()

const emit = defineEmits<{
  close: []
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

const root = ref<HTMLElement | null>(null)
let opener: HTMLElement | null = null

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
      await nextTick()
      root.value?.querySelector<HTMLElement>('.s-sidebar__close')?.focus()
    } else if (opener && root.value?.contains(document.activeElement)) {
      opener.focus()
      opener = null
    }
  }
)
</script>
