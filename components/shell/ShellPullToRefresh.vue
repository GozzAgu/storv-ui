<template>
  <div
    class="s-ptr"
    :class="{ 's-ptr--active': pullDistance > 0 || refreshing, 's-ptr--ready': readyToRefresh }"
    :style="{ '--s-ptr-offset': `${indicatorOffset}px` }"
    aria-hidden="true"
  >
    <span class="s-ptr__badge">
      <SSpinner v-if="refreshing" :size="16" />
      <ArrowDown v-else class="s-ptr__arrow" :size="16" :stroke-width="2" />
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { ArrowDown } from '@lucide/vue'
import SSpinner from '~/components/s/SSpinner.vue'
import { useHaptics } from '~/composables/useHaptics'
import { useDashboardPageRefreshHandler } from '~/composables/useDashboardPageRefresh'

const THRESHOLD = 72

const handler = useDashboardPageRefreshHandler()
const { impact, notify } = useHaptics()

const pullDistance = ref(0)
const refreshing = ref(false)
const readyToRefresh = computed(() => pullDistance.value >= THRESHOLD && !refreshing.value)
const indicatorOffset = computed(() =>
  refreshing.value ? 48 : Math.min(pullDistance.value * 0.45, 52)
)

let startY = 0
let tracking = false
let didHapticReady = false

const atTop = () => window.scrollY <= 0

function overlayOpen() {
  return !!document.querySelector('.s-dialog')
}

async function runRefresh() {
  if (refreshing.value || !handler.value) return
  refreshing.value = true
  try {
    await handler.value()
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
  if (refreshing.value || !handler.value || !atTop() || overlayOpen()) return
  tracking = true
  startY = e.touches[0]?.clientY ?? 0
  didHapticReady = false
}

function onTouchMove(e: TouchEvent) {
  if (!tracking || refreshing.value) return
  if (!atTop()) {
    pullDistance.value = 0
    return
  }
  const delta = Math.max(0, (e.touches[0]?.clientY ?? 0) - startY)
  pullDistance.value = Math.min(delta, 120)
  if (pullDistance.value >= THRESHOLD && !didHapticReady) {
    didHapticReady = true
    void impact('light')
  }
  if (pullDistance.value > 8) e.preventDefault()
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

onMounted(() => {
  document.addEventListener('touchstart', onTouchStart, { passive: true })
  document.addEventListener('touchmove', onTouchMove, { passive: false })
  document.addEventListener('touchend', onTouchEnd, { passive: true })
  document.addEventListener('touchcancel', onTouchEnd, { passive: true })
})

onUnmounted(() => {
  document.removeEventListener('touchstart', onTouchStart)
  document.removeEventListener('touchmove', onTouchMove)
  document.removeEventListener('touchend', onTouchEnd)
  document.removeEventListener('touchcancel', onTouchEnd)
})
</script>
