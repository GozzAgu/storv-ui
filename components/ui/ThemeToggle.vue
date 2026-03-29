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
    <span class="theme-track">
      <span class="theme-knob"></span>
    </span>
  </label>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'

const { actualTheme, setTheme, applyTheme } = useTheme()

const currentTheme = computed(() => actualTheme.value || 'light')

const toggleTheme = () => {
  const current = actualTheme.value
  const newTheme = current === 'dark' ? 'light' : 'dark'
  setTheme(newTheme)
}

// Sync document theme class if store and DOM drift (e.g. after navigation)
onMounted(() => {
  applyTheme()
})
</script>

<style scoped>
.theme-switch {
  --track-w: 2.5rem;
  --track-h: 1.25rem;
  --knob: 1rem;
  --gap: 0.125rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--track-w);
  height: var(--track-h);
  cursor: pointer;
  position: relative;
}

.theme-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.theme-track {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  background: #e5e7eb;
  transition: background 0.15s linear;
}

.theme-knob {
  position: absolute;
  width: var(--knob);
  height: var(--knob);
  border-radius: 50%;
  left: var(--gap);
  top: 50%;
  transform: translateY(-50%);
  background: #fff;
  transition: left 0.15s linear;
}

input:checked + .theme-track {
  background: #4b5563;
}

input:checked + .theme-track .theme-knob {
  left: calc(100% - var(--knob) - var(--gap));
  background: #fff;
}
</style>
