<script setup lang="ts">
/**
 * Fixed bar aligned with the main column (right of dashboard sidebar).
 * Teleports to <body> so it isn’t clipped by layout overflow.
 *
 * **Do not use `w-full` on the fixed shell:** with `position:fixed`, percentage width
 * uses the viewport, so `lg:left-64` + `width:100%` extends past the right edge and
 * clips controls. Width is implied by `left` + `right: 0` only.
 */
defineProps<{
  sidebarCollapsed: boolean
}>()
</script>

<template>
  <Teleport to="body">
    <div
      role="region"
      aria-label="Table pagination"
      class="pointer-events-auto fixed bottom-0 left-0 right-0 z-50 min-w-0 border-t border-gray-200/25 bg-gray-100/95 backdrop-blur-sm transition-[left] duration-300 dark:border-white/[0.05] dark:bg-[#07080c]/95 dark:backdrop-blur-sm"
      :class="[ sidebarCollapsed ? 'lg:left-[72px]' : 'lg:left-64', 'pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]', ]"
    >
      <div
        class="min-w-0 overflow-x-auto overflow-y-visible overscroll-x-contain py-1 pl-3 pr-3 [scrollbar-width:thin] sm:py-1.5 sm:pl-5 sm:pr-5 lg:pl-7 lg:pr-7 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300/80 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600/80"
      >
        <slot />
      </div>
    </div>
  </Teleport>
</template>
