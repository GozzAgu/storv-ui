<template>
  <a :href="href" target="_blank" rel="noopener noreferrer" :class="linkClass">
    <slot>Get help on WhatsApp</slot>
  </a>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { supportWhatsAppUrl } from '~/utils/growth-config'

const props = withDefaults(
  defineProps<{
    message?: string
    class?: string
  }>(),
  {}
)

const href = computed(() => supportWhatsAppUrl(props.message))
const linkClass = computed(() => props.class)
</script>
