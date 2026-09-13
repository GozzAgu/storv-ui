<template>
  <!--
    On Capacitor iOS the title / back chrome lives in the fixed global top bar.
    This component only registers that chrome (and teleports trailing actions).
  -->
  <Teleport v-if="isCapacitorIos && hasTrailingSlot && trailingReady" to="#ios-global-top-bar-trailing">
    <slot name="trailing" />
  </Teleport>

  <!-- Non-iOS / web fallback keeps an in-page nav bar when needed -->
  <header v-if="!isCapacitorIos" class="ios-page-nav-bar">
    <div class="ios-page-nav-bar__side">
      <slot name="leading">
        <DashboardBackButton
          v-if="showBack"
          :to="backTo"
          :label="backLabel"
          variant="icon"
          :fallback-to="fallbackTo"
        />
        <span v-else class="ios-page-nav-bar__spacer" aria-hidden="true" />
      </slot>
    </div>
    <h1 class="ios-page-nav-bar__title">{{ title }}</h1>
    <div class="ios-page-nav-bar__side ios-page-nav-bar__side--trailing">
      <slot name="trailing">
        <span class="ios-page-nav-bar__spacer" aria-hidden="true" />
      </slot>
    </div>
  </header>
</template>

<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import { computed, nextTick, onBeforeUnmount, onMounted, useSlots, watch } from 'vue'
import DashboardBackButton from '~/components/dashboard/DashboardBackButton.vue'
import { useIosPageNav } from '~/composables/useIosPageNav'

const props = withDefaults(
  defineProps<{
    title: string
    showBack?: boolean
    backTo?: RouteLocationRaw | null
    backLabel?: string
    fallbackTo?: RouteLocationRaw
  }>(),
  {
    showBack: false,
    backTo: null,
    backLabel: 'Back',
    fallbackTo: '/dashboard',
  }
)

const slots = useSlots()
const { isCapacitorIos } = useIsCapacitorIos()
const { setPageNav, clearPageNav } = useIosPageNav()

const hasTrailingSlot = computed(() => Boolean(slots.trailing))
const trailingReady = ref(false)

let owner = 0

function syncPageNav() {
  if (!isCapacitorIos.value) return
  owner = setPageNav(
    {
      title: props.title,
      showBack: props.showBack,
      backTo: props.backTo,
      backLabel: props.backLabel,
      fallbackTo: props.fallbackTo,
      hasTrailing: hasTrailingSlot.value,
    },
    owner || undefined
  )
}

watch(
  () =>
    [
      props.title,
      props.showBack,
      props.backTo,
      props.backLabel,
      props.fallbackTo,
      hasTrailingSlot.value,
      isCapacitorIos.value,
    ] as const,
  () => {
    syncPageNav()
  },
  { immediate: true }
)

onMounted(async () => {
  await nextTick()
  trailingReady.value =
    isCapacitorIos.value && Boolean(document.getElementById('ios-global-top-bar-trailing'))
})

onBeforeUnmount(() => {
  clearPageNav(owner)
})
</script>
