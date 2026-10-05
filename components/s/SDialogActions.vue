<template>
  <SButton :disabled="cancelDisabled || primaryLoading" @click="emit('cancel')">
    {{ cancelLabel }}
  </SButton>
  <slot name="primary">
    <SButton
      v-if="showPrimary"
      :variant="primaryVariant"
      :loading="primaryLoading"
      :disabled="primaryDisabled"
      @click="emit('primary')"
    >
      <template v-if="primaryIcon" #leading>
        <component :is="primaryIcon" :size="16" :stroke-width="2" aria-hidden="true" />
      </template>
      {{ primaryLabel }}
    </SButton>
  </slot>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import SButton from '~/components/s/SButton.vue'

/** Cancel + primary action pair for an `SDialog` footer. */
withDefaults(
  defineProps<{
    cancelLabel?: string
    primaryLabel?: string
    primaryVariant?: 'primary' | 'danger'
    primaryIcon?: Component
    primaryLoading?: boolean
    primaryDisabled?: boolean
    cancelDisabled?: boolean
    /** When false, only the cancel action is shown. */
    showPrimary?: boolean
  }>(),
  {
    cancelLabel: 'Cancel',
    primaryLabel: 'Save',
    primaryVariant: 'primary',
    showPrimary: true,
  }
)

const emit = defineEmits<{
  cancel: []
  primary: []
}>()
</script>
