<template>
  <div
    v-if="isCapacitorIos"
    class="ios-ptr-indicator"
    :class="{ 'ios-ptr-indicator--active': pullDistance > 0, 'ios-ptr-indicator--ready': readyToRefresh }"
    :style="{ transform: `translateY(${indicatorOffset}px)` }"
    aria-hidden="true"
  >
    <span
      class="ios-ptr-indicator__spinner"
      :class="{ 'ios-ptr-indicator__spinner--spinning': refreshing }"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useIosHaptics } from '~/composables/useIosHaptics'
import { useIosPullToRefreshHandler } from '~/composables/useIosPullToRefresh'

const props = defineProps<{
  scrollTarget: HTMLElement | null
}>()

const { isCapacitorIos } = useIsCapacitorIos()
const ptrHandler = useIosPullToRefreshHandler()
const { impact, notify } = useIosHaptics()

const pullDistance = ref(0)
const refreshing = ref(false)
const readyToRefresh = computed(() => pullDistance.value >= 72 && !refreshing.value)
const indicatorOffset = computed(() =>
  refreshing.value ? 48 : Math.min(pullDistance.value * 0.45, 52)
)

let startY = 0
let tracking = false
let didHapticReady = false

function canPull(el: HTMLElement) {
  return el.scrollTop <= 0
}

async function runRefresh() {
  if (refreshing.value || !ptrHandler.value) return
  refreshing.value = true
  pullDistance.value = 72
  try {
    await ptrHandler.value()
    await notify('success')
  } catch {
    await notify('error')
  } finally {
    refreshing.value = false
    pullDistance.value = 0
    didHapticReady = false
  }
}

function onTouchStart(e: TouchEvent) {
  const el = props.scrollTarget
  if (!el || refreshing.value || !ptrHandler.value) return
  if (!canPull(el)) return
  tracking = true
  startY = e.touches[0]?.clientY ?? 0
  didHapticReady = false
}

function onTouchMove(e: TouchEvent) {
  if (!tracking || refreshing.value) return
  const el = props.scrollTarget
  if (!el || !canPull(el)) {
    pullDistance.value = 0
    return
  }
  const y = e.touches[0]?.clientY ?? 0
  const delta = Math.max(0, y - startY)
  pullDistance.value = Math.min(delta, 120)
  if (pullDistance.value >= 72 && !didHapticReady) {
    didHapticReady = true
    void impact('light')
  }
  if (pullDistance.value > 8) {
    e.preventDefault()
  }
}

function onTouchEnd() {
  if (!tracking) return
  tracking = false
  if (readyToRefresh.value) {
    void runRefresh()
    return
  }
  pullDistance.value = 0
  didHapticReady = false
}

function bind(el: HTMLElement | null) {
  if (!el || !isCapacitorIos.value) return
  el.addEventListener('touchstart', onTouchStart, { passive: true })
  el.addEventListener('touchmove', onTouchMove, { passive: false })
  el.addEventListener('touchend', onTouchEnd, { passive: true })
  el.addEventListener('touchcancel', onTouchEnd, { passive: true })
}

function unbind(el: HTMLElement | null) {
  if (!el) return
  el.removeEventListener('touchstart', onTouchStart)
  el.removeEventListener('touchmove', onTouchMove)
  el.removeEventListener('touchend', onTouchEnd)
  el.removeEventListener('touchcancel', onTouchEnd)
}

watch(
  () => props.scrollTarget,
  (next, prev) => {
    unbind(prev)
    bind(next)
  }
)

onMounted(() => bind(props.scrollTarget))
onUnmounted(() => unbind(props.scrollTarget))
</script>
