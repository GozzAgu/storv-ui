<script setup lang="ts">
/**
 * Table pagination footer.
 * - Web: fixed to viewport bottom (teleported), aligned with sidebar.
 * - Native iOS/Android: inline at the end of page content (not fixed).
 */
defineProps<{
  sidebarCollapsed: boolean
}>()

const { isNativeApp } = useCapacitorNativeApp()
</script>

<template>
  <!-- Native: scrolls with content at the bottom of the page -->
  <div
    v-if="isNativeApp"
    role="region"
    aria-label="Table pagination"
    class="dashboard-inline-footer mt-4 w-full shrink-0 border-t border-gray-200/40 bg-white/95 py-2 dark:border-white/[0.08] dark:bg-[#07080c]/95"
  >
    <div
      class="min-w-0 overflow-x-auto overscroll-x-contain px-3 [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300/80 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600/80"
    >
      <slot />
    </div>
  </div>

  <!-- Web: fixed bar teleported to body -->
  <Teleport v-else to="body">
    <div
      role="region"
      aria-label="Table pagination"
      class="dashboard-fixed-footer pointer-events-auto fixed bottom-0 left-0 right-0 z-50 min-w-0 border-t border-gray-200/25 bg-gray-100/95 backdrop-blur-sm transition-[left] duration-300 dark:border-white/[0.05] dark:bg-[#07080c]/95 dark:backdrop-blur-sm"
      :class="[
        sidebarCollapsed ? 'lg:left-[72px]' : 'lg:left-64',
        'pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]',
      ]"
    >
      <div
        class="min-w-0 overflow-x-auto overflow-y-visible overscroll-x-contain py-1 pl-3 pr-3 [scrollbar-width:thin] sm:py-1.5 sm:pl-5 sm:pr-5 lg:pl-7 lg:pr-7 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300/80 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600/80"
      >
        <slot />
      </div>
    </div>
  </Teleport>
</template>
