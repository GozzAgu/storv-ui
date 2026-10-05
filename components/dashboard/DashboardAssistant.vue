<template>
  <div>
    <Teleport to="body">
      <Transition name="s-assistant-panel">
        <div
          v-if="assistantStore.isOpen"
          id="dashboard-assistant-panel"
          class="s-c s-assistant-panel"
          data-dashboard-teleport
          role="dialog"
          aria-modal="false"
          aria-labelledby="dashboard-assistant-float-title"
          @keydown.esc="assistantStore.close()"
        >
          <header class="s-assistant-panel__head">
            <SAvatar aria-hidden="true">S</SAvatar>
            <h2 id="dashboard-assistant-float-title" class="s-assistant-panel__title">
              Storvv Assistant
            </h2>
            <SIconButton label="Close assistant" size="sm" @click="assistantStore.close()">
              <X :size="18" :stroke-width="1.75" aria-hidden="true" />
            </SIconButton>
          </header>

          <DashboardAssistantBody variant="float" />
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { X } from '@lucide/vue'
import SAvatar from '~/components/s/SAvatar.vue'
import SIconButton from '~/components/s/SIconButton.vue'
import DashboardAssistantBody from '~/components/dashboard/DashboardAssistantBody.vue'
import { useDashboardAssistant } from '~/composables/useDashboardAssistant'

const { assistantStore } = useDashboardAssistant()
</script>
