<script setup lang="ts">
import { nextTick, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import DashboardNativeTableViewToggle from '~/components/dashboard/DashboardNativeTableViewToggle.vue'
import {
  ensureNativeTableShellKey,
  findDashboardTableShells,
  isCapacitorIosDocument,
  setNativeTableLayoutMode,
  syncNativeTableShellLayout,
  type NativeTableLayoutMode,
} from '~/utils/native-table-cards'

type ToggleHost = {
  key: string
  anchor: HTMLElement
  mode: NativeTableLayoutMode
}

const route = useRoute()
const toggleHosts = ref<ToggleHost[]>([])

function refreshNativeTableLayouts() {
  if (!import.meta.client || !isCapacitorIosDocument()) {
    toggleHosts.value = []
    return
  }

  const hosts: ToggleHost[] = []
  const shells = findDashboardTableShells()

  shells.forEach((shell, index) => {
    const key = ensureNativeTableShellKey(shell, route.path, index)
    const mode = syncNativeTableShellLayout(shell, key)

    if (shell.querySelector('[data-native-table-layout-toggle]')) return

    let anchor = shell.querySelector('[data-native-table-toggle-anchor]') as HTMLElement | null
    if (!anchor) {
      anchor = document.createElement('div')
      anchor.dataset.nativeTableToggleAnchor = ''
      anchor.className =
        'dash-native-table-toggle-anchor flex shrink-0 items-center justify-end px-4 pb-2 pt-1 sm:px-5'

      const toolbar = shell.querySelector('.dash-table-toolbar')
      if (toolbar) {
        toolbar.insertAdjacentElement('afterend', anchor)
      } else {
        const header = shell.querySelector('.dash-card__header, [class*="tableSectionHeader"]')
        if (header instanceof HTMLElement) {
          header.classList.add('flex-wrap', 'gap-2', 'items-center', 'justify-between')
          anchor.className = 'dash-native-table-toggle-anchor flex shrink-0 items-center'
          header.appendChild(anchor)
        } else {
          shell.insertBefore(anchor, shell.firstChild)
        }
      }
    }

    hosts.push({ key, anchor, mode })
  })

  toggleHosts.value = hosts
}

function onHostLayoutChange(key: string, mode: NativeTableLayoutMode) {
  setNativeTableLayoutMode(key, mode)
  const host = toggleHosts.value.find((h) => h.key === key)
  if (host) host.mode = mode
}

onMounted(() => {
  nextTick(refreshNativeTableLayouts)
})

watch(
  () => route.fullPath,
  () => nextTick(refreshNativeTableLayouts)
)

const nuxtApp = useNuxtApp()
nuxtApp.hook('page:finish', () => {
  nextTick(refreshNativeTableLayouts)
})
</script>

<template>
  <Teleport v-for="host in toggleHosts" :key="host.key" :to="host.anchor">
    <DashboardNativeTableViewToggle
      :model-value="host.mode"
      @update:model-value="(mode) => onHostLayoutChange(host.key, mode)"
    />
  </Teleport>
</template>
