<template>
  <div class="dashboard-assistant">
    <Teleport v-if="!isNativeApp" to="body">
      <DraggableFabContainer
        v-show="!assistantStore.isOpen"
        storage-key="storvv-assistant-fab"
        layout="column"
        extra-class="dashboard-assistant__fab-mount"
        anchor-class="bottom-32 right-4 sm:bottom-36 sm:right-6"
      >
        <button
          type="button"
          class="dashboard-assistant__fab"
          :aria-expanded="assistantStore.isOpen"
          aria-controls="dashboard-assistant-panel"
          aria-label="Open Storvv Assistant"
          @click="assistantStore.toggle()"
        >
          <SparklesIcon class="h-6 w-6" stroke-width="1.75" />
          <span class="sr-only">Storvv Assistant</span>
        </button>
      </DraggableFabContainer>
    </Teleport>

    <DraggableFabContainer
      v-else
      storage-key="storvv-assistant-fab-native"
      layout="column"
      extra-class="dashboard-assistant__fab-mount"
      anchor-class="bottom-[calc(env(safe-area-inset-bottom,0px)+7.75rem)] right-4"
    >
      <button
        type="button"
        class="dashboard-assistant__fab dashboard-assistant__fab--native"
        :aria-expanded="assistantStore.isOpen"
        aria-controls="dashboard-assistant-panel"
        aria-label="Open Storvv Assistant"
        @click="assistantStore.toggle()"
      >
        <SparklesIcon class="h-6 w-6" stroke-width="1.75" />
        <span class="sr-only">Storvv Assistant</span>
      </button>
    </DraggableFabContainer>

    <!-- Native: keep sheet / side drawer -->
    <SidePanel
      v-if="isNativeApp"
      id="dashboard-assistant-panel"
      v-model="assistantStore.isOpen"
      title="Storvv Assistant"
      :subtitle="isDemoAssistant ? 'Demo mode: sample guidance only (no live AI or store data).' : 'Ask how to use inventory, sales, roles, and plans.'"
      eyebrow="Assistant"
      native-sheet-variant="assistant"
      size="md"
      dense
      content-padding="p-0"
      blur-backdrop
    >
      <DashboardAssistantBody variant="sheet" />
    </SidePanel>

    <!-- Web: floating chat card (Marsh-style) -->
    <Teleport v-else to="body">
      <Transition name="assistant-float">
        <div
          v-if="assistantStore.isOpen"
          id="dashboard-assistant-panel"
          class="dashboard-assistant__float"
          data-dashboard-teleport
          role="dialog"
          aria-modal="false"
          aria-labelledby="dashboard-assistant-float-title"
        >
          <header class="dashboard-assistant__float-header">
            <div class="dashboard-assistant__float-brand">
              <div class="dashboard-assistant__float-logo" aria-hidden="true">
                <span>S</span>
              </div>
              <h2 id="dashboard-assistant-float-title" class="dashboard-assistant__float-title">
                Storvv Assistant
              </h2>
            </div>
            <button
              type="button"
              class="dashboard-assistant__float-close"
              aria-label="Close assistant"
              @click="assistantStore.close()"
            >
              <XMarkIcon class="h-5 w-5" stroke-width="1.75" />
            </button>
          </header>

          <DashboardAssistantBody variant="float" />
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { SparklesIcon, XMarkIcon } from '~/utils/app-icons'
import SidePanel from '~/components/ui/SidePanel.vue'
import DraggableFabContainer from '~/components/ui/DraggableFabContainer.vue'
import DashboardAssistantBody from '~/components/dashboard/DashboardAssistantBody.vue'
import { useDashboardAssistant } from '~/composables/useDashboardAssistant'

const { isNativeApp, isDemoAssistant, assistantStore } = useDashboardAssistant()
</script>

<style scoped>
.dashboard-assistant__fab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3.25rem;
  height: 3.25rem;
  border-radius: 9999px;
  border: 1.5px solid rgb(20 63 141 / 0.35);
  background: transparent;
  color: rgb(20 63 141);
  box-shadow: none;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    background-color 0.18s ease;
}

.dashboard-assistant__fab:hover {
  transform: translateY(-1px);
  border-color: rgb(20 63 141);
  background: rgb(20 63 141 / 0.06);
}

html.dark .dashboard-assistant__fab {
  border-color: rgb(255 255 255 / 0.14);
  background: transparent;
  color: rgb(226 232 240);
  box-shadow: none;
}

html.dark .dashboard-assistant__fab:hover {
  border-color: rgb(255 255 255 / 0.22);
  background: rgb(255 255 255 / 0.06);
}
</style>

<style>
/* Web floating widget — unscoped so Teleport styles apply */
.dashboard-assistant__float {
  position: fixed;
  z-index: 1150;
  right: 1.5rem;
  bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  width: min(24.5rem, calc(100vw - 2rem));
  height: min(36rem, calc(100dvh - 3rem));
  overflow: hidden;
  border-radius: 1.375rem;
  background: #ffffff;
  color: #0f172a;
  box-shadow:
    0 4px 6px rgb(15 23 42 / 0.04),
    0 16px 40px rgb(15 23 42 / 0.12);
  border: 1px solid rgb(15 23 42 / 0.08);
}

html.dark .dashboard-assistant__float {
  /* Match dashboard cards / --saas-surface (not slate navy) */
  background: #12141c;
  color: #f8fafc;
  border-color: rgb(255 255 255 / 0.08);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.04),
    0 24px 64px rgb(0 0 0 / 0.45);
}

.dashboard-assistant__float-header {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1rem 1.125rem 0.875rem;
  border-bottom: 1px solid rgb(15 23 42 / 0.06);
}

html.dark .dashboard-assistant__float-header {
  border-bottom-color: rgb(255 255 255 / 0.06);
}

.dashboard-assistant__float-brand {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.625rem;
}

.dashboard-assistant__float-logo {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  background: #143f8d;
  color: #fff;
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

html.dark .dashboard-assistant__float-logo {
  background: rgb(154 181 227 / 0.18);
  color: #9ab5e3;
}

.dashboard-assistant__float-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.01em;
  color: inherit;
}

.dashboard-assistant__float-close {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: 0;
  border-radius: 9999px;
  background: transparent;
  color: #64748b;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.dashboard-assistant__float-close:hover {
  background: rgb(15 23 42 / 0.05);
  color: #0f172a;
}

html.dark .dashboard-assistant__float-close {
  color: #94a3b8;
}

html.dark .dashboard-assistant__float-close:hover {
  background: rgb(255 255 255 / 0.08);
  color: #f8fafc;
}

.dashboard-assistant__panel--float {
  flex: 1 1 auto;
  min-height: 0;
  height: auto;
  background: inherit;
}

.assistant-float-enter-active,
.assistant-float-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s cubic-bezier(0.22, 1, 0.36, 1);
  transform-origin: bottom right;
}

.assistant-float-enter-from,
.assistant-float-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.96);
}

@media (max-width: 640px) {
  .dashboard-assistant__float {
    right: 0.75rem;
    bottom: 0.75rem;
    width: calc(100vw - 1.5rem);
    height: min(34rem, calc(100dvh - 1.5rem));
  }
}
</style>
