<template>
  <form :id="id" class="s-c s-form" @submit.prevent="emit('submit', $event)">
    <slot />
  </form>
</template>

<script setup lang="ts">
defineProps<{ id?: string }>()

const emit = defineEmits<{ submit: [event: Event] }>()
</script>
