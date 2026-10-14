<template>
  <span
    class="s-tier-badge"
    :style="{ fontSize: `${size}px` }"
    :role="label ? 'img' : undefined"
    :aria-label="label"
    :aria-hidden="label ? undefined : 'true'"
    >{{ emoji }}</span
  >
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{ tier: string; size?: number; label?: string }>(), {
  size: 24,
  label: undefined,
})

const EMOJI: Record<string, string> = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '💠',
  diamond: '💎',
}

const emoji = computed(() => EMOJI[props.tier] ?? '🏅')
</script>

<style scoped>
.s-tier-badge {
  display: inline-block;
  flex-shrink: 0;
  width: 1em;
  font-family: 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif;
  line-height: 1;
  text-align: center;
}
</style>
