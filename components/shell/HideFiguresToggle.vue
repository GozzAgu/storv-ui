<template>
  <SIconButton
    variant="secondary"
    :label="figuresHidden ? 'Show figures' : 'Hide figures'"
    :aria-pressed="figuresHidden"
    tooltip
    @click="toggleFigures"
  >
    <EyeOff v-if="figuresHidden" :size="16" :stroke-width="1.75" aria-hidden="true" />
    <Eye v-else :size="16" :stroke-width="1.75" aria-hidden="true" />
  </SIconButton>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, watch } from 'vue'
import { Eye, EyeOff } from '@lucide/vue'
import SIconButton from '~/components/s/SIconButton.vue'

const { figuresHidden, toggleFigures } = useHideFigures()

/**
 * Masking is CSS off `s-figures-hidden` on <html>. The class only lives while a page that shows
 * this toggle is mounted, so pages without it never end up with figures the user can't reveal.
 * Counted because the next page's toggle can mount before the previous one unmounts.
 */
function apply() {
  document.documentElement.classList.toggle(
    's-figures-hidden',
    mountedToggles > 0 && figuresHidden.value
  )
}

onMounted(() => {
  mountedToggles += 1
  apply()
})
watch(figuresHidden, apply)
onBeforeUnmount(() => {
  mountedToggles -= 1
  apply()
})
</script>

<script lang="ts">
let mountedToggles = 0
</script>
