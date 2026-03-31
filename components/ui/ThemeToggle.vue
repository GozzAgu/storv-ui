<template>
  <button
    type="button"
    class="theme-dribbble-toggle"
    :class="{ 'theme-dribbble-toggle--dark': isDark }"
    :aria-label="`Color theme: ${isDark ? 'Dark' : 'Light'}. Switch to ${isDark ? 'light' : 'dark'} mode.`"
    :aria-pressed="isDark"
    @click="toggleTheme"
  >
    <span class="theme-dribbble-toggle__track">
      <span class="theme-dribbble-toggle__thumb" aria-hidden="true" />

      <span class="theme-dribbble-toggle__icons">
        <!-- Light: sun (circle + rays) — dark UI: simple ring like reference -->
        <span class="theme-dribbble-toggle__cell" aria-hidden="true">
          <svg v-if="!isDark" class="theme-dribbble-toggle__sun" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2" />
            <path
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              d="M12 2v2.5M12 19.5V22M4.22 4.22l1.77 1.77M18.01 18.01l1.77 1.77M2 12h2.5M19.5 12H22M4.22 19.78l1.77-1.77M18.01 5.99l1.77-1.77"
            />
          </svg>
          <svg v-else class="theme-dribbble-toggle__sun-simple" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="6" stroke="currentColor" stroke-width="1.85" />
          </svg>
        </span>

        <!-- Moon: filled + highlight (light UI ref) · stroke crescent (dark UI ref) -->
        <span class="theme-dribbble-toggle__cell" aria-hidden="true">
          <svg v-if="!isDark" class="theme-dribbble-toggle__moon-lite" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12.5" r="5.75" fill="rgb(232 162 62)" />
            <circle cx="10.2" cy="10.8" r="3.35" fill="rgb(255 235 200)" fill-opacity="0.92" />
          </svg>
          <svg v-else class="theme-dribbble-toggle__moon" viewBox="0 0 24 24" fill="none">
            <path
              d="M20.2 14.9A8.9 8.9 0 1 1 9.1 3.8a7.2 7.2 0 1 0 11.1 11.1Z"
              stroke="currentColor"
              stroke-width="1.85"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
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
.theme-dribbble-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.theme-dribbble-toggle:focus-visible {
  outline: none;
  border-radius: 9999px;
  box-shadow: 0 0 0 2px rgb(255 255 255), 0 0 0 4px rgb(59 130 246);
}

.theme-dribbble-toggle--dark:focus-visible {
  box-shadow: 0 0 0 2px rgb(15 18 28), 0 0 0 4px rgb(96 165 250);
}

.theme-dribbble-toggle__track {
  position: relative;
  display: block;
  box-sizing: border-box;
  width: 3.625rem;
  height: 1.5rem;
  padding: 0.1875rem;
  border-radius: 9999px;
  border: 1px solid transparent;
  /* Light UI: white pill + soft elevation */
  background: rgb(255 255 255);
  box-shadow:
    0 1px 2px rgb(15 23 42 / 0.05),
    0 2px 6px rgb(15 23 42 / 0.06);
  transition:
    background 0.25s cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1),
    border-color 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Dark mode chrome follows resolved theme (matches nav), not only html.dark */
.theme-dribbble-toggle--dark .theme-dribbble-toggle__track {
  background: rgb(30 35 48);
  border-color: rgb(255 255 255 / 0.1);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.05),
    0 1px 2px rgb(0 0 0 / 0.45);
}

.theme-dribbble-toggle__thumb {
  position: absolute;
  top: 0.1875rem;
  bottom: 0.1875rem;
  left: 0.1875rem;
  width: calc(50% - 0.28125rem);
  border-radius: 9999px;
  pointer-events: none;
  transition: transform 0.38s cubic-bezier(0.16, 1, 0.3, 1);
  transform: translateX(0);
  border: 1.5px solid rgb(232 162 62);
  background: rgb(255 250 235 / 0.88);
  box-shadow: 0 1px 2px rgb(180 83 9 / 0.1);
}

.theme-dribbble-toggle--dark .theme-dribbble-toggle__thumb {
  border-color: rgb(255 255 255 / 0.32);
  background: rgb(255 255 255 / 0.1);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.1);
  transform: translateX(calc(100% + 0.1875rem));
}

@media (prefers-reduced-motion: reduce) {
  .theme-dribbble-toggle__thumb,
  .theme-dribbble-toggle__track {
    transition-duration: 0.05s;
  }
}

.theme-dribbble-toggle__icons {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: stretch;
  height: 100%;
  width: 100%;
  pointer-events: none;
}

.theme-dribbble-toggle__cell {
  flex: 1 1 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
}

.theme-dribbble-toggle__sun,
.theme-dribbble-toggle__sun-simple,
.theme-dribbble-toggle__moon,
.theme-dribbble-toggle__moon-lite {
  width: 0.75rem;
  height: 0.75rem;
  flex-shrink: 0;
}

/* Light UI: warm gold stroke icons */
.theme-dribbble-toggle__sun,
.theme-dribbble-toggle__moon {
  color: rgb(217 150 40);
}

/* Dark UI: white line icons (follows isDark, same as track) */
.theme-dribbble-toggle--dark .theme-dribbble-toggle__sun-simple,
.theme-dribbble-toggle--dark .theme-dribbble-toggle__moon {
  color: rgb(248 250 252);
}
</style>
