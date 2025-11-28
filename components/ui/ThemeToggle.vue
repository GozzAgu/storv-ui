<template>
  <button
    @click="toggleTheme"
    :key="currentTheme"
    class="inline-flex items-center justify-center p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-200 border border-gray-300 dark:border-gray-600 hover:border-primary-500 dark:hover:border-primary-400 bg-white dark:bg-gray-800 shadow-sm min-w-[40px] min-h-[40px]"
    :aria-label="`Switch to ${currentTheme === 'dark' ? 'light' : 'dark'} mode`"
    title="Toggle theme"
  >
    <SunIcon v-if="currentTheme === 'dark'" class="w-5 h-5 transition-transform duration-200" />
    <MoonIcon v-else class="w-5 h-5 transition-transform duration-200" />
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
