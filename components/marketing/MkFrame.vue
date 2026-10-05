<template>
  <figure class="mk-frame">
    <div class="mk-frame__bar" aria-hidden="true">
      <span class="mk-frame__dots"><span /><span /><span /></span>
      <span class="mk-frame__url">{{ url }}</span>
    </div>
    <img
      :src="imageSrc"
      :alt="alt"
      class="mk-frame__img"
      width="1440"
      height="900"
      :loading="eager ? 'eager' : 'lazy'"
      :fetchpriority="eager ? 'high' : undefined"
      decoding="async"
    />
  </figure>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useThemeStore } from '~/stores/theme'

const props = defineProps<{
  src: string
  /** Shown instead of `src` in dark mode. */
  darkSrc?: string
  alt: string
  url: string
  eager?: boolean
}>()

const themeStore = useThemeStore()
const imageSrc = computed(() =>
  props.darkSrc && themeStore.actualTheme === 'dark' ? props.darkSrc : props.src
)
</script>
