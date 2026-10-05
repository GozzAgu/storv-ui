<template>
  <SCard
    title="If you cancel"
    description="What happens to your data when auto-renew stops."
  >
    <dl class="s-settings__policy">
      <div v-for="item in policy" :key="item.term">
        <dt>{{ item.term }}</dt>
        <dd>{{ item.detail }}</dd>
      </div>
    </dl>
  </SCard>
</template>

<script setup lang="ts">
import SCard from '~/components/s/SCard.vue'

const policy = [
  {
    term: 'During your paid period',
    detail: 'Full access continues until the date shown on your plan card.',
  },
  {
    term: 'After it ends',
    detail: 'Your account moves to Storvv Micro (one branch, core inventory and sales).',
  },
  {
    term: 'Your data',
    detail:
      'Storvv keeps your inventory, sales history, and customers. Export anytime before or after canceling.',
  },
  {
    term: 'Branches over plan limits',
    detail: 'Oldest branches stay active first; extras are hidden until you upgrade again.',
  },
] as const
</script>
