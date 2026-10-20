<template>
  <span
    class="s-tier-badge"
    :style="{ '--tier': `var(--s-tier-${tierKey})`, width: `${size}px`, height: `${size}px` }"
    :role="label ? 'img' : undefined"
    :aria-label="label"
    :aria-hidden="label ? undefined : 'true'"
  >
    <component :is="icon" :size="Math.round(size * 0.55)" :stroke-width="2" aria-hidden="true" />
  </span>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'
import { Award, Crown, Gem, Medal, Shield } from '@lucide/vue'

const props = withDefaults(defineProps<{ tier: string; size?: number; label?: string }>(), {
  size: 24,
  label: undefined,
})

/** One line icon per tier, rising in prestige; colours come from the --s-tier-* tokens. */
const ICONS: Record<string, Component> = {
  bronze: Shield,
  silver: Medal,
  gold: Award,
  platinum: Crown,
  diamond: Gem,
}

const tierKey = computed(() => (props.tier in ICONS ? props.tier : 'silver'))
const icon = computed(() => ICONS[tierKey.value] ?? Medal)
</script>

<style scoped>
.s-tier-badge {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border: 1px solid color-mix(in srgb, var(--tier) 22%, transparent);
  border-radius: var(--s-radius-full);
  background: color-mix(in srgb, var(--tier) 10%, transparent);
  color: var(--tier);
}
</style>
