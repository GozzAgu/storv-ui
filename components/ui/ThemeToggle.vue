<template>
  <button
    type="button"
    class="theme-clean-toggle"
    :class="{ 'theme-clean-toggle--dark': isDark }"
    :aria-label="`Color theme: ${isDark ? 'Dark' : 'Light'}. Switch to ${
      isDark ? 'light' : 'dark'
    } mode.`"
    :aria-pressed="isDark"
    @click="toggleTheme"
  >
    <span class="theme-clean-toggle__track" aria-hidden="true">
      <span class="theme-clean-toggle__thumb">
        <svg v-if="!isDark" class="theme-clean-toggle__icon" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 3v2M12 19v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M3 12h2M19 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
          />
          <circle cx="12" cy="12" r="4.25" stroke="currentColor" stroke-width="1.8" />
        </svg>
        <svg v-else class="theme-clean-toggle__icon" viewBox="0 0 24 24" fill="none">
          <path
            d="M20.25 15.1A8.7 8.7 0 1 1 8.9 3.75a7 7 0 1 0 11.35 11.35Z"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'

const { actualTheme, setTheme, applyTheme } = useTheme()

const isDark = computed(() => actualTheme.value === 'dark')

const toggleTheme = () => {
  setTheme(isDark.value ? 'light' : 'dark')
}

onMounted(() => {
  applyTheme()
})
</script>

<style scoped>
.theme-clean-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.theme-clean-toggle:focus-visible {
  outline: none;
  border-radius: 9999px;
  box-shadow: 0 0 0 2px #f4f1ea, 0 0 0 4px rgb(26 21 35 / 0.35);
}

.theme-clean-toggle--dark:focus-visible {
  box-shadow: 0 0 0 2px #080808, 0 0 0 4px rgb(244 241 234 / 0.55);
}

.theme-clean-toggle__track {
  position: relative;
  display: inline-flex;
  align-items: center;
  box-sizing: border-box;
  width: 2.75rem;
  height: 1.625rem;
  padding: 0.125rem;
  border-radius: 9999px;
  border: 1px solid rgb(26 21 35 / 0.12);
  background: rgb(255 255 255 / 0.72);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.95), 0 1px 2px rgb(26 21 35 / 0.06);
  transition: background 0.16s cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 0.16s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.16s cubic-bezier(0.16, 1, 0.3, 1);
}

.theme-clean-toggle--dark .theme-clean-toggle__track {
  border-color: rgb(255 255 255 / 0.16);
  background: rgb(16 16 18 / 0.72);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.08), 0 1px 2px rgb(0 0 0 / 0.35);
}

.theme-clean-toggle__thumb {
  position: absolute;
  top: 0.125rem;
  left: 0.125rem;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 9999px;
  pointer-events: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #1a1523;
  border: 1px solid rgb(26 21 35 / 0.1);
  background: #ffffff;
  box-shadow: 0 1px 3px rgb(26 21 35 / 0.12);
  transition: transform 0.16s cubic-bezier(0.16, 1, 0.3, 1), color 0.16s ease,
    border-color 0.16s ease, background 0.16s ease;
  transform: translateX(0);
}

.theme-clean-toggle--dark .theme-clean-toggle__thumb {
  transform: translateX(1.125rem);
  color: #1a1523;
  border-color: transparent;
  background: #f4f1ea;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.35);
}

.theme-clean-toggle__icon {
  width: 0.72rem;
  height: 0.72rem;
  flex-shrink: 0;
}

@media (prefers-reduced-motion: reduce) {
  .theme-clean-toggle__thumb,
  .theme-clean-toggle__track {
    transition-duration: 0.06s;
  }
}
</style>
