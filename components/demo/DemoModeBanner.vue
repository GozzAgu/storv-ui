<template>
  <div class="s-c s-banner s-banner--info" role="status">
    <div class="s-banner__lead">
      <FlaskConical class="s-banner__icon" :size="16" :stroke-width="2" aria-hidden="true" />
      <p class="s-banner__text">
        <strong>Interactive demo.</strong> Fictional sample data stored only in this browser, not a
        live store or signed-in account.
      </p>
    </div>
    <div class="s-banner__actions">
      <SButton size="sm" variant="ghost" @click="onReset">Reset sample data</SButton>
      <SButton size="sm" variant="ghost" to="/" @click="onExit">Exit demo</SButton>
      <SButton size="sm" variant="primary" to="/signup">Create free account</SButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FlaskConical } from '@lucide/vue'
import SButton from '~/components/s/SButton.vue'
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
