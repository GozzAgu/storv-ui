<template>
  <SButton
    :type="type"
    variant="primary"
    size="lg"
    block
    :loading="loading"
    :disabled="disabled"
    @click="$emit('click')"
  >
    {{ label }}
  </SButton>
</template>

<script setup lang="ts">
import SButton from '~/components/s/SButton.vue'

withDefaults(
  defineProps<{
    label: string
    disabled?: boolean
    loading?: boolean
    type?: 'button' | 'submit'
  }>(),
  {
    type: 'submit',
  }
)

defineEmits<{
  click: []
}>()
</script>
