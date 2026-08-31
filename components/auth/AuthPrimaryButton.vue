<template>
  <button
    :type="type"
    class="auth-primary-btn"
    :disabled="disabled || loading"
    :aria-busy="loading"
    @click="$emit('click')"
  >
    <span v-if="loading" class="auth-primary-btn__spinner" aria-hidden="true" />
    <span :class="{ 'opacity-0': loading }">{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
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
