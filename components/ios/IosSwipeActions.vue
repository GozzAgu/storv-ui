<template>
  <div
    class="ios-swipe-actions"
    :class="{ 'ios-swipe-actions--open': open }"
    @touchstart.passive="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
    @touchcancel="onTouchEnd"
  >
    <div class="ios-swipe-actions__panel" aria-hidden="true">
      <button
        v-for="action in actions"
        :key="action.id"
        type="button"
        class="ios-swipe-actions__btn"
        :class="`ios-swipe-actions__btn--${action.tone ?? 'default'}`"
        :aria-label="action.label"
        @click.stop="onAction(action)"
      >
        <component :is="action.icon" v-if="action.icon" class="h-4 w-4" aria-hidden="true" />
        <span class="ios-swipe-actions__btn-label">{{ action.shortLabel ?? action.label }}</span>
      </button>
    </div>
    <div class="ios-swipe-actions__content" :style="contentStyle">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Component } from 'vue'
import { useIosHaptics } from '~/composables/useIosHaptics'

export type IosSwipeAction = {
  id: string
  label: string
  shortLabel?: string
  tone?: 'default' | 'primary' | 'danger'
  icon?: Component
  onSelect: () => void
}

const props = withDefaults(
  defineProps<{
    actions: IosSwipeAction[]
    actionWidth?: number
  }>(),
  { actionWidth: 72 }
)

const { impact } = useIosHaptics()

const open = ref(false)
const offsetX = ref(0)
const maxReveal = computed(() => props.actions.length * props.actionWidth)

let startX = 0
let startOffset = 0
let tracking = false

const contentStyle = computed(() => ({
  transform: `translateX(${-offsetX.value}px)`,
}))

function clamp(value: number) {
  return Math.max(0, Math.min(value, maxReveal.value))
}

function onTouchStart(e: TouchEvent) {
  startX = e.touches[0]?.clientX ?? 0
  startOffset = offsetX.value
  tracking = true
}

function onTouchMove(e: TouchEvent) {
  if (!tracking) return
  const x = e.touches[0]?.clientX ?? 0
  const delta = startX - x
  offsetX.value = clamp(startOffset + delta)
  open.value = offsetX.value > maxReveal.value * 0.35
}

function onTouchEnd() {
  if (!tracking) return
  tracking = false
  if (offsetX.value > maxReveal.value * 0.45) {
    offsetX.value = maxReveal.value
    open.value = true
    void impact('light')
  } else {
    offsetX.value = 0
    open.value = false
  }
}

function onAction(action: IosSwipeAction) {
  void impact('medium')
  offsetX.value = 0
  open.value = false
  action.onSelect()
}

function close() {
  offsetX.value = 0
  open.value = false
}

defineExpose({ close })
</script>
