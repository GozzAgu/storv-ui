<template>
  <button
    type="button"
    :class="['ios-tabbar-theme-btn', variant === 'topnav' ? 'ios-tabbar-theme-btn--topnav' : '']"
    :aria-label="`Switch to ${isDark ? 'light' : 'dark'} mode`"
    :aria-pressed="isDark"
    @click="toggleTheme"
  >
    <svg
      v-if="isDark"
      class="ios-tabbar-theme-btn__icon"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4.25" stroke="currentColor" stroke-width="1.75" />
      <path
        d="M12 3v2M12 19v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M3 12h2M19 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linecap="round"
      />
    </svg>
    <MoonIcon v-else class="ios-tabbar-theme-btn__icon" aria-hidden="true" />
  </button>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { MoonIcon } from '~/utils/app-icons'
import { useIosHaptics } from '~/composables/useIosHaptics'

withDefaults(
  defineProps<{
    variant?: 'tabbar' | 'topnav'
  }>(),
  {
    variant: 'tabbar',
  }
)

const { actualTheme, setTheme, applyTheme } = useTheme()
const { impact } = useIosHaptics()

const isDark = computed(() => actualTheme.value === 'dark')

function toggleTheme() {
  setTheme(isDark.value ? 'light' : 'dark')
  void impact('light')
}

onMounted(() => {
  applyTheme()
})
</script>

<style scoped>
.ios-tabbar-theme-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  -webkit-tap-highlight-color: transparent;
}

.ios-tabbar-theme-btn__icon {
  width: 1.375rem;
  height: 1.375rem;
  stroke-width: 1.75;
}
</style>
