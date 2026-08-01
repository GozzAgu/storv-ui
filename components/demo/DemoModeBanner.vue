<template>
  <div
    class="mb-4 flex flex-col gap-3 rounded-xl border border-primary-500/25 bg-primary-500/[0.06] px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-primary-400/20 dark:bg-primary-500/10"
    role="status"
  >
    <div class="min-w-0">
      <p class="text-sm font-semibold text-primary-900 dark:text-primary-100">Interactive demo</p>
      <p class="mt-0.5 text-xs text-gray-600 dark:text-gray-400">
        You are using the real Storvv dashboard with sample data saved in this browser. Try Analytics
        feature insights, Customer buybacks, Stock loans, Payment links, and the demo Assistant (canned tips).
        No sign-up required.
      </p>
    </div>
    <div class="flex shrink-0 flex-wrap gap-2">
      <button
        type="button"
        class="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10"
        @click="onReset"
      >
        Reset sample data
      </button>
      <NuxtLink
        to="/signup"
        class="rounded-full border border-[rgb(20_63_141/0.35)] bg-transparent px-3 py-1.5 text-xs font-semibold text-[#143f8d] hover:border-[#143f8d] hover:bg-[rgb(20_63_141/0.06)] dark:border-white/15 dark:text-gray-100 dark:hover:border-white/25 dark:hover:bg-white/[0.06]"
      >
        Create free account
      </NuxtLink>
      <NuxtLink
        to="/"
        class="rounded-lg px-3 py-1.5 text-xs font-semibold text-primary-700 hover:underline dark:text-primary-300"
        @click="onExit"
      >
        Exit demo
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { clearDemoSession } from '~/utils/demo-mode'
import { syncDemoToPinia } from '~/utils/demo-bridge'

function onExit() {
  clearDemoSession()
}

function onReset() {
  if (!import.meta.client) return
  if (!window.confirm('Reset all demo data to the sample store?')) return
  useDemoAppStore().reset()
  syncDemoToPinia()
}
</script>
