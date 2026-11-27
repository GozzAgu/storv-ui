<template>
  <p v-if="offer" class="mk-trial-offer">
    <Gift :size="16" aria-hidden="true" />
    <span
      ><strong>{{ offer.headline }}.</strong> {{ offer.detail }}</span
    >
  </p>
</template>

<script setup lang="ts">
import { Gift } from '~/icons'
import { getTrialOffer } from '~/utils/trial-offer'

const offer = getTrialOffer()
</script>
