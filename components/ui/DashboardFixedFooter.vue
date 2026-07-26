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
      class="dashboard-fixed-footer pointer-events-auto fixed inset-x-0 z-[52] min-w-0 border-t border-gray-200/70 bg-gray-50/92 backdrop-blur-md transition-[left] duration-300 dark:border-white/[0.06] dark:bg-[#07080c]/92"
      :class="[
        isNativeApp
          ? 'dashboard-fixed-footer--native'
          : [sidebarCollapsed ? 'lg:left-[72px]' : 'lg:left-64', 'bottom-0'],
      ]"
    >
      <div
        class="dashboard-fixed-footer__inner mx-auto min-w-0 max-w-[1600px] overflow-x-auto overscroll-x-contain px-3 py-2.5 [scrollbar-width:thin] sm:px-5 sm:py-3 lg:pl-7 lg:pr-7 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300/80 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600/80"
      >
        <slot />
      </div>
    </div>
  </Teleport>
</template>
