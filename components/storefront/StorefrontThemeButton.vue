<template>
  <SIconButton
    :label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
    tooltip
    @click="setTheme(isDark ? 'light' : 'dark')"
  >
    <Sun v-if="isDark" :size="18" aria-hidden="true" />
    <Moon v-else :size="18" aria-hidden="true" />
  </SIconButton>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { Moon, Sun } from '@lucide/vue'
import SIconButton from '~/components/s/SIconButton.vue'

const { actualTheme, setTheme, applyTheme, initTheme } = useTheme()
const isDark = computed(() => actualTheme.value === 'dark')

onMounted(() => {
  initTheme()
  applyTheme()
})
</script>
