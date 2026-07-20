<template>
  <section
    :class="[
      compact
        ? 'rounded-lg bg-gray-50/80 px-4 py-5 text-center dark:bg-white/[0.03]'
        : 'rounded-xl border border-dashed border-primary-200/80 bg-primary-50/35 px-6 py-12 text-center dark:border-primary-500/20 dark:bg-primary-500/[0.06]',
    ]"
  >
    <div
      :class="[
        'mx-auto flex items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-500/15 dark:text-primary-400',
        compact ? 'h-10 w-10' : 'h-12 w-12',
      ]"
    >
      <CreditCardIcon :class="compact ? 'h-5 w-5' : 'h-6 w-6'" aria-hidden="true" />
    </div>
    <p
      :class="[
        'font-semibold uppercase tracking-[0.14em] text-primary-700 dark:text-primary-300',
        compact ? 'mt-3 text-[10px]' : 'mt-4 text-xs',
      ]"
    >
      Coming soon
    </p>
    <h2 v-if="!compact" class="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-50">
      Payment links
    </h2>
    <p
      :class="[
        'mx-auto leading-relaxed text-gray-600 dark:text-gray-400',
        compact ? 'mt-2 max-w-sm text-xs' : 'mt-2 max-w-md text-sm',
      ]"
    >
      Pay-by-link checkout is on the way. You'll connect your bank, send secure links, and
      auto-create receipts when customers pay.
    </p>
    <p v-if="!compact" class="mx-auto mt-3 max-w-md text-xs text-gray-500 dark:text-gray-500">
      We're finishing the last pieces - check back soon.
    </p>
  </section>
</template>

<script setup lang="ts">
import { CreditCardIcon } from '@heroicons/vue/24/outline'

withDefaults(
  defineProps<{
    compact?: boolean
  }>(),
  { compact: false }
)
</script>
