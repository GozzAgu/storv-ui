<template>
  <SCard
    v-if="members.length > 0"
    title="Top customers"
    description="By reward points across all branches, with spend over the last 12 months."
  >
    <LoyaltyTopCustomersList :members="members" />
  </SCard>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import SCard from '~/components/s/SCard.vue'
import LoyaltyTopCustomersList from '~/components/loyalty/LoyaltyTopCustomersList.vue'
import { loyaltyUiFlag, useLoyalty, type LoyaltyMemberView } from '~/composables/useLoyalty'

const loyalty = useLoyalty()
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
