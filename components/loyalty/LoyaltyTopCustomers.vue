<template>
  <SCard
    v-if="members.length > 0"
    title="Top customers"
    description="By reward points, across all branches."
    flush
  >
    <ol class="s-list">
      <li v-for="(member, index) in members" :key="member.key" class="s-list__item">
        <span class="s-loyalty-rank" aria-hidden="true">{{ index + 1 }}</span>
        <SAvatar :name="member.name" size="sm" />
        <span class="s-list__main">
          <span class="s-list__primary">{{ member.name }}</span>
          <span class="s-list__secondary"
            >{{ formatCurrency(member.spend12m) }} in the last 12 months</span
          >
        </span>
        <span class="s-list__end">
          <SBadge :tone="loyaltyTierTone(member.tier.id)" size="sm">{{ member.tier.name }}</SBadge>
          <span class="s-loyalty-points">{{ member.points.toLocaleString() }} pts</span>
        </span>
      </li>
    </ol>
  </SCard>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import SAvatar from '~/components/s/SAvatar.vue'
import SBadge from '~/components/s/SBadge.vue'
import SCard from '~/components/s/SCard.vue'
import { loyaltyUiFlag, useLoyalty, type LoyaltyMemberView } from '~/composables/useLoyalty'
import { loyaltyTierTone } from '~/utils/loyalty'

const loyalty = useLoyalty()
const { formatCurrency } = usePreferences()
const members = ref<LoyaltyMemberView[]>([])

onMounted(async () => {
  if (!loyaltyUiFlag()) return
  try {
    members.value = await loyalty.topMembers(5)
  } catch {
    members.value = []
  }
})
</script>

<style scoped>
.s-loyalty-rank {
  width: 1.25rem;
  color: var(--s-text-muted);
  font: var(--s-text-caption);
  font-variant-numeric: tabular-nums;
  text-align: center;
}

.s-loyalty-points {
  min-width: 4.5rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  text-align: right;
}
</style>
