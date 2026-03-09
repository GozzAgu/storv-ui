<template>
  <button
    @click="toggleTheme"
    :key="currentTheme"
    class="flex items-center justify-center w-10 h-10 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
    :aria-label="`Switch to ${currentTheme === 'dark' ? 'light' : 'dark'} mode`"
    title="Toggle theme"
  >
    <SunIcon v-if="currentTheme === 'dark'" class="w-5 h-5" stroke-width="1.75" />
    <MoonIcon v-else class="w-5 h-5" stroke-width="1.75" />
  </button>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { SunIcon, MoonIcon } from '@heroicons/vue/24/outline'

const { actualTheme, setTheme, applyTheme } = useTheme()

const currentTheme = computed(() => actualTheme.value || 'light')

const toggleTheme = () => {
  // Get current actual theme to determine what we're switching from
  const current = actualTheme.value
  
  // Toggle to opposite theme (always set to explicit light or dark, not system)
  const newTheme = current === 'dark' ? 'light' : 'dark'
  setTheme(newTheme)
}

// Apply theme on mount
onMounted(() => {
  applyTheme()
})

// Watch for theme changes and apply
watch(() => actualTheme.value, () => {
  applyTheme()
})
</script>
