<template>
  <div
    class="border-b border-gray-100/90 bg-gradient-to-b from-gray-50/90 to-white px-2.5 py-2.5 dark:border-gray-800/70 dark:from-white/[0.03] dark:to-transparent sm:px-5 sm:py-3.5"
  >
    <div v-if="$slots.heading" class="mb-2 min-w-0 sm:mb-3 lg:mb-0 lg:flex lg:items-start lg:justify-between lg:gap-6">
      <slot name="heading" />
    </div>
    <div class="flex w-full min-w-0 flex-col gap-2 sm:gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
      <div
        class="flex min-w-0 flex-1 flex-wrap items-center gap-2 lg:max-w-[min(100%,48rem)] xl:max-w-none"
      >
        <slot name="filters" />
      </div>
      <div class="flex min-w-0 flex-wrap items-center justify-end gap-2 lg:shrink-0">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>
