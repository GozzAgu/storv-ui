<template>
  <DashboardSettingsPanel
    title="If you cancel"
    subtitle="What happens to your data when auto-renew stops."
    compact
  >
    <ul class="space-y-2 text-[11px] leading-relaxed text-gray-600 dark:text-gray-400">
      <li>
        <span class="font-medium text-gray-800 dark:text-gray-200">During your paid period:</span>
        Full access continues until the date shown on your plan card.
      </li>
      <li>
        <span class="font-medium text-gray-800 dark:text-gray-200">After it ends:</span>
        Your account moves to Storvv Micro (one branch, core inventory and sales).
      </li>
      <li>
        <span class="font-medium text-gray-800 dark:text-gray-200">Your data:</span>
        Storvv keeps your inventory, sales history, and customers. Export anytime below before or after canceling.
      </li>
      <li>
        <span class="font-medium text-gray-800 dark:text-gray-200">Branches over plan limits:</span>
        Oldest branches stay active first; extras are hidden until you upgrade again.
      </li>
    </ul>
  </DashboardSettingsPanel>
</template>

<script setup lang="ts">
import DashboardSettingsPanel from '~/components/dashboard/DashboardSettingsPanel.vue'
</script>
