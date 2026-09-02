<template>
  <button type="button" class="ios-inventory-item-card" @click="$emit('click')">
    <div class="ios-inventory-item-card__icon" aria-hidden="true">
      <CubeIcon />
    </div>
    <div class="ios-inventory-item-card__body">
      <div class="ios-inventory-item-card__top">
        <div class="ios-inventory-item-card__main">
          <p class="ios-inventory-item-card__title">{{ title }}</p>
          <p v-if="subtitle" class="ios-inventory-item-card__subtitle">{{ subtitle }}</p>
        </div>
        <p class="ios-inventory-item-card__price">{{ price }}</p>
      </div>
      <div class="ios-inventory-item-card__bottom">
        <div class="ios-inventory-item-card__meta">
          <span v-if="reference" class="ios-inventory-item-card__ref">{{ reference }}</span>
          <span :class="['ios-inventory-item-card__status', statusClass]">{{ statusLabel }}</span>
        </div>
        <span v-if="date" class="ios-inventory-item-card__date">{{ date }}</span>
      </div>
    </div>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CubeIcon } from '~/utils/app-icons'
import type { InventoryAvailabilityStatus } from '~/utils/inventory-availability'

const props = defineProps<{
  title: string
  subtitle?: string
  price: string
  reference?: string
  statusLabel: string
  status: InventoryAvailabilityStatus
  date?: string
}>()

defineEmits<{
  click: []
}>()

const statusClass = computed(() =>
  `ios-inventory-item-card__status--${props.status.replace(/_/g, '-')}`
)
</script>
