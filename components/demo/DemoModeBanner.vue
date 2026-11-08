<template>
  <div class="s-c s-banner s-banner--neutral s-demo-banner" role="region" aria-label="Demo">
    <div class="s-banner__lead">
      <FlaskConical class="s-banner__icon" :size="16" :stroke-width="2" aria-hidden="true" />
      <p class="s-banner__text">
        <strong>You're exploring a demo.</strong>
        <span class="s-demo-banner__more">
          Sample data, saved only in this browser. Want help setting up your store?
        </span>
      </p>
    </div>
    <div class="s-banner__actions">
      <SButton size="sm" variant="ghost" class="s-demo-banner__reset" @click="onReset">
        Reset
      </SButton>
      <SButton size="sm" variant="ghost" @click="requestExit">
        Exit<span class="s-demo-banner__long">&nbsp;demo</span>
      </SButton>
      <SButton size="sm" variant="secondary" @click="open('demo_banner')">
        <template #leading><CalendarDays :size="14" aria-hidden="true" /></template>
        <span class="s-demo-banner__long">Book a walkthrough</span>
        <span class="s-demo-banner__short">Book a call</span>
      </SButton>
      <SButton size="sm" variant="primary" to="/signup" @click="trackDemoAction('signup_click')">
        <span class="s-demo-banner__long">Create free account</span>
        <span class="s-demo-banner__short">Sign up free</span>
      </SButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CalendarDays, FlaskConical } from '@lucide/vue'
import SButton from '~/components/s/SButton.vue'
import { useWalkthrough } from '~/composables/useWalkthrough'
import { useDemoConversionNudge } from '~/composables/useDemoConversionNudge'
import { resetDemoExtrasData, syncDemoToPinia } from '~/utils/demo-bridge'
import { trackDemoAction } from '~/utils/demo-tracker'

const { open } = useWalkthrough()
const { requestExit } = useDemoConversionNudge({ watchRoute: false })

async function onReset() {
  if (!import.meta.client) return
  if (!window.confirm('Reset all demo data to the sample store?')) return
  useDemoAppStore().reset()
  resetDemoExtrasData()
  await syncDemoToPinia()
  trackDemoAction('data_reset')
}
</script>

<style scoped>
@media (max-width: 720px) {
  .s-demo-banner__more {
    display: none;
  }
}

.s-demo-banner__short {
  display: none;
}

@media (max-width: 480px) {
  .s-demo-banner__reset,
  .s-demo-banner__long {
    display: none;
  }

  .s-demo-banner__short {
    display: inline;
  }
}
</style>
