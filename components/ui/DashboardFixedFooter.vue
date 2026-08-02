<script setup lang="ts">
/**
 * Table pagination footer pinned to the viewport bottom (web + native).
 */
defineProps<{
  sidebarCollapsed: boolean
}>()

const { isNativeApp } = useCapacitorNativeApp()
</script>

<template>
  <Teleport to="body">
    <div
      role="region"
      aria-label="Table pagination"
      class="dashboard-fixed-footer pointer-events-auto fixed z-[52] min-w-0 transition-[left] duration-300"
      :class="[
        isNativeApp
          ? 'dashboard-fixed-footer--native'
          : [
              'dashboard-fixed-footer--web',
              sidebarCollapsed ? 'dashboard-fixed-footer--web-collapsed' : '',
            ],
      ]"
    >
      <div class="dashboard-fixed-footer__inner">
        <slot />
      </div>
    </div>
  </Teleport>
</template>
