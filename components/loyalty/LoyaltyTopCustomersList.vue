<template>
  <ol class="s-loyalty-top">
    <li
      v-for="(member, index) in topFive"
      :key="member.key"
      class="s-loyalty-top__item"
      :title="`${member.name} · ${member.tier.name} · ${formatCurrency(
        member.spend12m
      )} in 12 months`"
    >
      <span class="s-loyalty-top__rank">{{ index + 1 }}</span>
      <LoyaltyTierBadge :tier="member.tier.id" :size="22" :label="`${member.tier.name} tier`" />
      <span class="s-loyalty-top__main">
        <span class="s-loyalty-top__name">{{ member.name }}</span>
        <span class="s-loyalty-top__meta">
          {{ member.tier.name }} · {{ formatCurrency(member.spend12m) }}
        </span>
      </span>
      <span class="s-loyalty-top__points">
        {{ member.points.toLocaleString() }}<span class="s-loyalty-top__unit">pts</span>
      </span>
    </li>
  </ol>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import LoyaltyTierBadge from '~/components/loyalty/LoyaltyTierBadge.vue'
import type { LoyaltyMemberView } from '~/composables/useLoyalty'

const props = defineProps<{ members: LoyaltyMemberView[] }>()

const topFive = computed(() => props.members.slice(0, 5))

const { formatCurrency } = usePreferences()
</script>

<style scoped>
/* Compact chips, up to five across, so the customers table stays near the top. */
.s-loyalty-top {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(12.5rem, 1fr));
  gap: var(--s-space-1);
  margin: 0;
  padding: 0;
  list-style: none;
}

.s-loyalty-top__item {
  display: flex;
  align-items: center;
  gap: var(--s-space-1);
  min-width: 0;
  padding: 6px var(--s-space-1-5) 6px var(--s-space-1);
  border: 1px solid var(--s-border);
  border-radius: var(--s-radius);
  /* A very light grey in light mode, so the chips read as a group without competing with the table. */
  background: color-mix(in srgb, var(--s-surface-2) 70%, var(--s-surface));
}

:global(html.dark) .s-loyalty-top__item {
  background: var(--s-surface);
}

.s-loyalty-top__rank {
  width: 0.9rem;
  flex-shrink: 0;
  color: var(--s-text-muted);
  font: var(--s-text-caption);
  font-variant-numeric: tabular-nums;
  text-align: center;
}

.s-loyalty-top__main {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  line-height: 1.25;
}

.s-loyalty-top__name {
  overflow: hidden;
  color: var(--s-text);
  font: var(--s-text-small);
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.s-loyalty-top__meta {
  overflow: hidden;
  color: var(--s-text-muted);
  font: var(--s-text-caption);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.s-loyalty-top__points {
  flex-shrink: 0;
  color: var(--s-text);
  font: var(--s-text-small);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.s-loyalty-top__unit {
  margin-left: 2px;
  color: var(--s-text-muted);
  font: var(--s-text-caption);
  font-weight: 400;
}
</style>
