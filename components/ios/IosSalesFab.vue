<template>
  <div class="ios-sales-fab-stack" role="group" aria-label="Sales actions">
    <button
      type="button"
      class="ios-fab ios-fab--secondary"
      aria-label="Quick sale"
      @click="onQuickSale"
    >
      <QrCodeIcon class="h-5 w-5" stroke-width="1.75" />
    </button>
    <button
      type="button"
      class="ios-fab"
      aria-label="New sale"
      @click="onNewSale"
    >
      <PlusIcon class="h-6 w-6" stroke-width="2" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { PlusIcon, QrCodeIcon } from '~/utils/app-icons'
import { useIosHaptics } from '~/composables/useIosHaptics'

const emit = defineEmits<{
  'new-sale': []
  'quick-sale': []
}>()

const { impact } = useIosHaptics()

function onNewSale() {
  void impact('medium')
  emit('new-sale')
}

function onQuickSale() {
  void impact('light')
  emit('quick-sale')
}
</script>
