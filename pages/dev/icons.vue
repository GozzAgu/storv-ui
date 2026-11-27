<template>
  <div class="ds-root svg-gallery" :class="{ 'is-dark': isDark }">
    <header class="svg-gallery__head">
      <div>
        <p class="ds-overline">Storvv icon set</p>
        <h1 class="ds-title">{{ uiNames.length + STORVV_ICON_NAMES.length }} icons</h1>
        <p class="ds-text-2">24px grid · rounded 1.6 stroke · two tones from the text colour</p>
      </div>
      <div class="svg-gallery__controls">
        <input
          v-model="query"
          type="search"
          class="svg-gallery__search"
          placeholder="Find an icon"
          aria-label="Find an icon"
        />
        <button
          v-for="c in colours"
          :key="c.label"
          type="button"
          class="svg-gallery__swatch"
          :style="{ background: c.value }"
          :aria-pressed="colour === c.value"
          :aria-label="`Show in ${c.label}`"
          @click="colour = c.value"
        />
        <button type="button" class="svg-gallery__toggle" @click="toggleDark">
          {{ isDark ? 'Light mode' : 'Dark mode' }}
        </button>
      </div>
    </header>

    <h2 class="svg-gallery__section">App icons · {{ shownUi.length }}</h2>
    <ul class="svg-gallery__grid" :style="{ color: colour }">
      <li v-for="name in shownUi" :key="name" class="svg-gallery__cell">
        <div class="svg-gallery__sizes">
          <component :is="uiIcon(name)" :size="48" :stroke-width="1.5" />
          <component :is="uiIcon(name)" :size="24" :stroke-width="1.75" />
          <component :is="uiIcon(name)" :size="16" :stroke-width="1.75" />
        </div>
        <code class="svg-gallery__name">{{ name }}</code>
      </li>
    </ul>

    <h2 class="svg-gallery__section">Marketing illustrations · {{ STORVV_ICON_NAMES.length }}</h2>
    <ul class="svg-gallery__grid" :style="{ color: colour }">
      <li v-for="name in STORVV_ICON_NAMES" :key="name" class="svg-gallery__cell">
        <div class="svg-gallery__sizes">
          <StorvvIcon :name="name" :size="48" />
          <StorvvIcon :name="name" :size="32" />
          <StorvvIcon :name="name" :size="20" />
        </div>
        <code class="svg-gallery__name">{{ name }}</code>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, type Component } from 'vue'
import StorvvIcon from '~/components/brand/StorvvIcon.vue'
import { STORVV_ICON_NAMES } from '~/utils/storvv-icons'
import { useThemeStore } from '~/stores/theme'
import * as AppIcons from '~/icons'

if (!import.meta.dev) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found' })
}

definePageMeta({ layout: false })
useHead({ title: 'Icons - Storvv', meta: [{ name: 'robots', content: 'noindex' }] })

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.actualTheme === 'dark')
function toggleDark() {
  themeStore.setTheme(isDark.value ? 'light' : 'dark')
}

const colours = [
  { label: 'Ink', value: 'var(--s-text)' },
  { label: 'Storvv blue', value: '#3d63f2' },
  { label: 'Green', value: '#16a34a' },
  { label: 'Orange', value: '#ea580c' },
]
const colour = ref(colours[0]!.value)

const uiNames = Object.keys(AppIcons.STORVV_UI_ICONS).sort()
const query = ref('')
const shownUi = computed(() => {
  const q = query.value.trim().toLowerCase()
  return q ? uiNames.filter((n) => n.toLowerCase().includes(q)) : uiNames
})
const uiIcon = (name: string) => (AppIcons as unknown as Record<string, Component>)[name]
</script>

<style scoped>
.svg-gallery {
  min-height: 100vh;
  padding: 40px 48px 64px;
  background: var(--s-bg);
  color: var(--s-text);
}

.svg-gallery__head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 32px;
}

.svg-gallery__controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.svg-gallery__swatch {
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 50%;
  box-shadow: inset 0 0 0 2px var(--s-surface), 0 0 0 1px var(--s-divider);
  cursor: pointer;
}

.svg-gallery__swatch[aria-pressed='true'] {
  box-shadow: inset 0 0 0 2px var(--s-surface), 0 0 0 2px var(--s-text);
}

.svg-gallery__toggle {
  height: 36px;
  margin-left: 8px;
  padding: 0 14px;
  border: 0;
  border-radius: 10px;
  background: var(--s-surface);
  box-shadow: inset 0 0 0 1px var(--s-divider);
  color: var(--s-text);
  font: 500 0.875rem / 1 var(--s-font-sans);
  cursor: pointer;
}

.svg-gallery__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(176px, 1fr));
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.svg-gallery__cell {
  display: grid;
  gap: 14px;
  padding: 20px 16px 14px;
  border-radius: 14px;
  background: var(--s-surface);
  box-shadow: inset 0 0 0 1px var(--s-divider);
}

.svg-gallery__sizes {
  display: flex;
  align-items: flex-end;
  gap: 14px;
}

.svg-gallery__section {
  margin: 32px 0 14px;
  color: var(--s-text-muted);
  font: 600 0.8125rem / 1 var(--s-font-sans);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.svg-gallery__search {
  height: 36px;
  margin-right: 8px;
  padding: 0 12px;
  border: 0;
  border-radius: 10px;
  background: var(--s-surface);
  box-shadow: inset 0 0 0 1px var(--s-divider);
  color: var(--s-text);
  font: 0.875rem / 1 var(--s-font-sans);
}

.svg-gallery__name {
  color: var(--s-text-muted);
  font-size: 0.75rem;
}
</style>
