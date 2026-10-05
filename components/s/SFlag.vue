<template>
  <img v-if="src" class="s-flag" :src="src" alt="" aria-hidden="true" />
  <span v-else class="s-flag" aria-hidden="true" />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  /** ISO 3166-1 alpha-2 code, or `EU`. */
  code: string
}>()

// Lazy so each flag is its own small asset, fetched only when shown.
const flags = import.meta.glob<string>('../../node_modules/country-flag-icons/3x2/*.svg', {
  query: '?url',
  import: 'default',
})

const src = ref('')

watch(
  () => props.code,
  async (code) => {
    const load = flags[`../../node_modules/country-flag-icons/3x2/${code.toUpperCase()}.svg`]
    src.value = load ? await load() : ''
  },
  { immediate: true }
)
</script>
