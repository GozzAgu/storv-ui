<template>
  <div ref="trackRef" class="s-slide" :aria-disabled="inactive">
    <span class="s-slide__label" :style="{ opacity: labelOpacity }" aria-hidden="true">
      {{ loading ? loadingLabel : label }}
    </span>
    <button
      type="button"
      class="s-slide__knob"
      :class="{ 's-slide__knob--settle': !dragging }"
      :style="{ transform: `translateX(${offset}px)` }"
      :aria-label="loading ? loadingLabel : label"
      :disabled="inactive"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="settle"
      @click="onClick"
    >
      <SSpinner v-if="loading" :size="18" />
      <ChevronsRight v-else :size="22" :stroke-width="2.25" aria-hidden="true" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ChevronsRight } from '@lucide/vue'
import SSpinner from '~/components/s/SSpinner.vue'
import { useHaptics } from '~/composables/useHaptics'

/**
 * Slide-to-confirm for irreversible money actions (charging a sale). Dragging the knob to
 * the end confirms; keyboard and VoiceOver users activate the knob directly instead.
 */
const props = withDefaults(
  defineProps<{
    label: string
    loadingLabel?: string
    disabled?: boolean
    loading?: boolean
  }>(),
  { loadingLabel: 'Processing…' }
)

const emit = defineEmits<{ confirm: [] }>()

const CONFIRM_RATIO = 0.85

const haptics = useHaptics()
const trackRef = ref<HTMLElement | null>(null)
const offset = ref(0)
const maxOffset = ref(0)
const dragging = ref(false)
let startX = 0
let armed = false

const inactive = computed(() => props.disabled || props.loading)
const labelOpacity = computed(() =>
  maxOffset.value ? Math.max(0, 1 - offset.value / (maxOffset.value * CONFIRM_RATIO)) : 1
)

function measure(knob: HTMLElement) {
  const track = trackRef.value
  if (!track) return 0
  const inset = knob.offsetLeft
  return Math.max(0, track.clientWidth - knob.offsetWidth - inset * 2)
}

function onPointerDown(event: PointerEvent) {
  if (inactive.value) return
  const knob = event.currentTarget as HTMLElement
  knob.setPointerCapture(event.pointerId)
  maxOffset.value = measure(knob)
  startX = event.clientX - offset.value
  armed = false
  dragging.value = true
}

function onPointerMove(event: PointerEvent) {
  if (!dragging.value) return
  offset.value = Math.min(maxOffset.value, Math.max(0, event.clientX - startX))
  const reached = offset.value >= maxOffset.value * CONFIRM_RATIO
  if (reached !== armed) {
    armed = reached
    if (reached) void haptics.impact('medium')
  }
}

function onPointerUp() {
  if (!dragging.value) return
  dragging.value = false
  if (armed) {
    offset.value = maxOffset.value
    emit('confirm')
  } else {
    offset.value = 0
  }
}

function settle() {
  dragging.value = false
  armed = false
  offset.value = 0
}

/** Pointer clicks have `detail >= 1` and must slide; keyboard / assistive activation has 0. */
function onClick(event: MouseEvent) {
  if (inactive.value || event.detail !== 0) return
  emit('confirm')
}

watch(
  () => props.loading,
  (loading) => {
    if (!loading) settle()
  }
)
</script>
