<template>
  <div
    class="mb-4 flex flex-col gap-3 rounded-3xl border border-[rgb(26_21_35/0.1)] bg-white/60 px-4 py-3 shadow-[inset_0_1px_0_rgb(255_255_255/0.9)] backdrop-blur-[28px] sm:flex-row sm:items-center sm:justify-between dark:border-0 dark:bg-[#1e1e1e] dark:shadow-none dark:backdrop-blur-none"
    role="status"
  >
    <div class="min-w-0">
      <p class="text-sm font-semibold text-[#1a1523] dark:text-white">Interactive demo</p>
      <p class="mt-0.5 text-xs text-[#1a1523]/55 dark:text-white/60">
        Sandbox preview with fictional sample data stored only in this browser - not a live store or
        signed-in account. Try Enterprise workflows: inventory, sales, buybacks, stock loans,
        multi-store sync, payment links, departments, analytics, activity logs, and the demo
        Assistant.
      </p>
    </div>
    <div class="flex shrink-0 flex-wrap gap-2">
      <button
        type="button"
        class="rounded-full border border-[rgb(26_21_35/0.16)] bg-transparent px-3 py-1.5 text-xs font-semibold text-[#1a1523] hover:bg-[rgb(26_21_35/0.06)] dark:border-white/20 dark:text-white dark:hover:bg-white/10"
        @click="onReset"
      >
        Reset sample data
      </button>
      <NuxtLink
        to="/signup"
        class="rounded-full border-0 bg-[#1a1523] px-3 py-1.5 text-xs font-semibold text-[#f4f1ea] hover:bg-black dark:bg-[#f4f1ea] dark:text-[#1a1523] dark:hover:bg-white"
      >
        Create free account
      </NuxtLink>
      <NuxtLink
        to="/"
        class="rounded-full px-3 py-1.5 text-xs font-semibold text-[#1a1523]/60 hover:text-[#1a1523] dark:text-white/70 dark:hover:text-white"
        @click="onExit"
      >
        Exit demo
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { clearDemoSession } from '~/utils/demo-mode'
import { resetDemoExtrasData, syncDemoToPinia } from '~/utils/demo-bridge'

function onExit() {
  clearDemoSession()
}

async function onReset() {
  if (!import.meta.client) return
  if (!window.confirm('Reset all demo data to the sample store?')) return
  useDemoAppStore().reset()
  resetDemoExtrasData()
  await syncDemoToPinia()
}
</script>

