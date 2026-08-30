<template>
  <Button
    :variant="cancelVariant"
    size="sm"
    :disabled="cancelDisabled || primaryLoading"
    @click="emit('cancel')"
  >
    {{ cancelLabel }}
  </Button>
  <slot name="primary">
    <Button
      v-if="showPrimary !== false"
      :variant="primaryVariant"
      size="sm"
      :icon="primaryIcon"
      :loading="primaryLoading"
      :disabled="primaryDisabled"
      :extra-class="primaryExtraClass"
      @click="emit('primary')"
    >
      {{ primaryLabel }}
    </Button>
  </slot>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import Button from '~/components/ui/Button.vue'

withDefaults(
  defineProps<{
    cancelLabel?: string
    cancelVariant?: 'outline' | 'ghost' | 'secondary'
    primaryLabel?: string
    primaryVariant?: 'primary' | 'danger' | 'success'
    primaryIcon?: Component
    primaryExtraClass?: string
    primaryLoading?: boolean
    primaryDisabled?: boolean
    cancelDisabled?: boolean
    /** When false, only the cancel/close action is shown */
    showPrimary?: boolean
  }>(),
  {
    cancelLabel: 'Cancel',
    cancelVariant: 'outline',
    primaryLabel: 'Save',
    primaryVariant: 'primary',
    primaryExtraClass: '',
    primaryLoading: false,
    primaryDisabled: false,
    cancelDisabled: false,
    showPrimary: true,
  }
)

const emit = defineEmits<{
  cancel: []
  primary: []
}>()
</script>
