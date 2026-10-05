<template>
  <div
    class="s-c s-tabs"
    :class="{ 's-tabs--block': block }"
    role="tablist"
    :aria-label="label"
    @keydown="onKeydown"
  >
    <button
      v-for="tab in tabs"
      :id="tabId(tab.value)"
      :key="tab.value"
      ref="tabRefs"
      type="button"
      role="tab"
      class="s-tabs__tab"
      :aria-selected="tab.value === model"
      :aria-controls="panelId"
      :tabindex="tab.value === model ? 0 : -1"
      :disabled="tab.disabled"
      @click="select(tab.value)"
    >
      <slot name="tab" :tab="tab">
        <component :is="tab.icon" v-if="tab.icon" :size="16" :stroke-width="1.75" aria-hidden="true" />
        {{ tab.label }}
        <span v-if="tab.count !== undefined" class="s-count">{{ tab.count }}</span>
      </slot>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, useId, type Component } from 'vue'

type STab = {
  value: string
  label: string
  count?: number
  icon?: Component
  disabled?: boolean
}

const props = defineProps<{
  tabs: STab[]
  /** Accessible name for the tab list. */
  label: string
  block?: boolean
  /** Id of the tab panel this list controls, if rendered. */
  panelId?: string
}>()

const model = defineModel<string>({ required: true })
const tabRefs = ref<HTMLButtonElement[]>([])
const baseId = useId()

function tabId(value: string) {
  return `s-tab-${baseId}-${value}`
}

function select(value: string) {
  model.value = value
}

function onKeydown(event: KeyboardEvent) {
  const enabled = props.tabs.filter((tab) => !tab.disabled)
  const index = enabled.findIndex((tab) => tab.value === model.value)
  let next = -1
  if (event.key === 'ArrowRight') next = (index + 1) % enabled.length
  else if (event.key === 'ArrowLeft') next = (index - 1 + enabled.length) % enabled.length
  else if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = enabled.length - 1
  if (next < 0) return
  event.preventDefault()
  const value = enabled[next]!.value
  select(value)
  tabRefs.value.find((el) => el.id === tabId(value))?.focus()
}
</script>
