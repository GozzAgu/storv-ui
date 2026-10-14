<template>
  <ol class="s-loyalty-top">
    <li v-for="(member, index) in topFive" :key="member.key" class="s-loyalty-top__item">
      <span class="s-loyalty-top__rank">{{ index + 1 }}</span>
      <LoyaltyTierBadge :tier="member.tier.id" :size="24" :label="`${member.tier.name} tier`" />
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
.s-loyalty-top {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
  gap: var(--s-space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.s-loyalty-top__item {
  display: flex;
  align-items: center;
  gap: var(--s-space-2);
  min-width: 0;
  padding: var(--s-space-2) var(--s-space-3) var(--s-space-2) var(--s-space-2);
  border-radius: var(--s-radius-lg);
  background: var(--s-surface-2);
}

.s-loyalty-top__rank {
  width: 1.1rem;
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
}

.s-loyalty-top__name {
  overflow: hidden;
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
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.s-loyalty-top__unit {
  margin-left: 0.2rem;
  color: var(--s-text-muted);
  font: var(--s-text-caption);
}
</style>
