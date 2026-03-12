<template>
  <label
    class="theme-switch"
    :aria-label="`Switch to ${currentTheme === 'dark' ? 'light' : 'dark'} mode`"
    title="Toggle theme"
  >
    <input
      type="checkbox"
      :checked="currentTheme === 'dark'"
      @change="toggleTheme"
    />
    <span class="theme-slider"></span>
  </label>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'

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

<style scoped>
/* Top-nav theme switch based on Uiverse design */
.theme-switch {
  display: flex;
  align-items: center;
  justify-content: center;
  --width-of-switch: 3.2em;
  --height-of-switch: 1.8em;
  --size-of-icon: 1.3em;
  --slider-offset: 0.25em;
  position: relative;
  width: var(--width-of-switch);
  height: var(--height-of-switch);
  cursor: pointer;
}

.theme-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.theme-slider {
  position: absolute;
  inset: 0;
  background-color: #f4f4f5;
  transition: 0.4s;
  border-radius: 999px;
  box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.04);
}

.theme-slider::before {
  position: absolute;
  content: "";
  height: var(--size-of-icon, 1.3em);
  width: var(--size-of-icon, 1.3em);
  border-radius: 999px;
  left: var(--slider-offset, 0.25em);
  top: 50%;
  transform: translateY(-50%);
  background: linear-gradient(40deg, #ff0080, #ff8c00 70%);
  transition: 0.4s;
}

input:checked + .theme-slider {
  background-color: #111827;
}

input:checked + .theme-slider::before {
  left: calc(100% - (var(--size-of-icon, 1.3em) + var(--slider-offset, 0.25em)));
  background: #111827;
  box-shadow:
    inset -3px -2px 5px -2px #8983f7,
    inset -10px -4px 0 0 #a3dafb;
}
</style>
